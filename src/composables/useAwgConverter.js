// adler32 zlib checksum
function adler32(data) {
  const MOD = 65521
  let s1 = 1, s2 = 0
  for (let i = 0; i < data.length; i++) {
    s1 = (s1 + data[i]) % MOD
    s2 = (s2 + s1) % MOD
  }
  return ((s2 << 16) | s1) >>> 0
}

export function parseConf(text) {
  const lines = text.split('\n').map(l => l.trim()).filter(l => l && !l.startsWith('#'))
  const sections = {}
  let cur = null
  for (const line of lines) {
    if (line.startsWith('[')) {
      cur = line.slice(1, -1).toLowerCase()
      sections[cur] = sections[cur] || {}
      continue
    }
    const eq = line.indexOf('=')
    if (eq < 0 || !cur) continue
    sections[cur][line.slice(0, eq).trim()] = line.slice(eq + 1).trim()
  }
  return sections
}

export function buildVpnJson(conf) {
  const iface = conf['interface'] || {}
  const peer  = conf['peer'] || {}

  const privKey   = iface['PrivateKey']  || iface['privatekey']  || ''
  const addr      = iface['Address']     || iface['address']     || '10.8.0.2/32'
  const dns       = iface['DNS']         || iface['dns']         || '1.1.1.1, 8.8.8.8'
  const mtu       = iface['MTU']         || iface['mtu']         || '1376'
  const endpoint  = peer['Endpoint']     || peer['endpoint']     || ''
  const pubKey    = peer['PublicKey']    || peer['publickey']    || ''
  const psk       = peer['PresharedKey'] || peer['presharedkey'] || ''
  const allowed   = peer['AllowedIPs']   || peer['allowedips']   || '0.0.0.0/0, ::/0'
  const keepalive = peer['PersistentKeepalive'] || peer['persistentkeepalive'] || '25'

  const lastColon = endpoint.lastIndexOf(':')
  const host = lastColon >= 0 ? endpoint.slice(0, lastColon) : endpoint
  const portStr = lastColon >= 0 ? endpoint.slice(lastColon + 1) : '51820'
  const port = parseInt(portStr) || 51820

  const dnsParts = dns.split(',').map(d => d.trim())
  const dns1 = dnsParts[0] || '1.1.1.1'
  const dns2 = dnsParts[1] || '8.8.8.8'

  const clientIp = addr.split('/')[0]
  const subnet = clientIp.split('.').slice(0, 3).join('.') + '.0'

  const awgKeys     = ['H1','H2','H3','H4','S1','S2','S3','S4','Jc','Jmin','Jmax','I1','I2','I3','I4','I5']
  const awgConfKeys = ['Jc','Jmin','Jmax','S1','S2','S3','S4','H1','H2','H3','H4','I1','I2','I3','I4','I5']

  const awgParams = {}
  for (const k of awgKeys) {
    const v = iface[k] || iface[k.toLowerCase()]
    if (v) awgParams[k] = v
  }

  const allowedArr = allowed.split(',').map(s => s.trim())

  const lines = ['[Interface]', `Address = ${addr}`, 'DNS = $PRIMARY_DNS, $SECONDARY_DNS', `PrivateKey = ${privKey}`]
  for (const k of awgConfKeys) if (awgParams[k]) lines.push(`${k} = ${awgParams[k]}`)
  lines.push('', '[Peer]', `PublicKey = ${pubKey}`)
  if (psk) lines.push(`PresharedKey = ${psk}`)
  lines.push(`AllowedIPs = ${allowed}`, `Endpoint = ${endpoint}`, `PersistentKeepalive = ${keepalive}`)
  const confString = lines.join('\n')

  const lastConfig = {
    ...awgParams,
    allowed_ips: allowedArr,
    clientId: '',
    client_ip: clientIp,
    client_priv_key: privKey,
    client_pub_key: '',
    config: confString,
    hostName: host,
    mtu: mtu,
    persistent_keep_alive: String(keepalive),
    port: port,
    psk_key: psk,
    server_pub_key: pubKey
  }

  const awg = {
    ...awgParams,
    last_config: JSON.stringify(lastConfig),
    port: portStr,
    protocol_version: '2',
    subnet_address: subnet,
    transport_proto: 'udp'
  }

  return {
    containers: [{ awg: awg, container: 'amnezia-awg2' }],
    defaultContainer: 'amnezia-awg2',
    description: `AWG ${host}`,
    dns1: dns1,
    dns2: dns2,
    hostName: host
  }
}

export async function toVpnUri(jsonObj) {
  const str = JSON.stringify(jsonObj)
  const data = new TextEncoder().encode(str)

  const header = new Uint8Array(4)
  new DataView(header.buffer).setUint32(0, data.length, false)

  const cs = new CompressionStream('deflate')
  const w = cs.writable.getWriter()
  w.write(data); w.close()
  const compressed = new Uint8Array(await new Response(cs.readable).arrayBuffer())

  // Fix adler32 (browser CompressionStream is unreliable here)
  const checksum = adler32(data)
  const dv = new DataView(compressed.buffer, compressed.byteOffset + compressed.length - 4, 4)
  dv.setUint32(0, checksum, false)

  const result = new Uint8Array(4 + compressed.length)
  result.set(header, 0)
  result.set(compressed, 4)

  let binary = ''
  result.forEach(b => binary += String.fromCharCode(b))
  return 'vpn://' + btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}

export async function fromVpnUri(uri) {
  let b64 = uri.replace(/^vpn:\/\//, '').replace(/-/g, '+').replace(/_/g, '/')
  const padded = b64 + '==='.slice((b64.length + 3) % 4 || 4)
  const binary = atob(padded)
  const bytes = new Uint8Array(binary.length)
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i)

  const ds = new DecompressionStream('deflate')
  const w = ds.writable.getWriter()
  w.write(bytes.slice(4)); w.close()
  const text = new TextDecoder().decode(await new Response(ds.readable).arrayBuffer())
  return JSON.parse(text)
}

export function jsonToConf(json) {
  const container = json.containers?.find(c => c.container?.includes('awg'))
  if (!container) throw new Error('Контейнер AWG не найден в JSON')
  const awg = container.awg
  let lc = {}
  try { lc = JSON.parse(awg.last_config || '{}') } catch(e) {}

  const host      = json.hostName || lc.hostName || ''
  const port      = lc.port || 51820
  const privKey   = lc.client_priv_key || ''
  const addr      = lc.client_ip ? lc.client_ip + '/32' : '10.8.0.2/32'
  const dns1      = lc.dns1 || json.dns1 || '1.1.1.1'
  const dns2      = lc.dns2 || json.dns2 || '8.8.8.8'
  const mtu       = lc.mtu || '1376'
  const pubKey    = lc.server_pub_key || ''
  const psk       = lc.psk_key || ''
  const allowedRaw = lc.allowed_ips
  const allowed   = Array.isArray(allowedRaw) ? allowedRaw.join(', ') : (allowedRaw || '0.0.0.0/0')
  const keepalive = lc.persistent_keep_alive || 25

  const awgKeys = ['H1','H2','H3','H4','S1','S2','S3','S4','Jc','Jmin','Jmax','I1','I2','I3','I4','I5']

  let iface = `[Interface]\nPrivateKey = ${privKey}\nAddress = ${addr}\nDNS = ${dns1}, ${dns2}\nMTU = ${mtu}`
  for (const k of awgKeys) {
    const v = awg[k] || lc[k]
    if (v) iface += `\n${k} = ${v}`
  }
  const peerSection = `\n[Peer]\nPublicKey = ${pubKey}\n${psk ? 'PresharedKey = ' + psk + '\n' : ''}AllowedIPs = ${allowed}\nEndpoint = ${host}:${port}\nPersistentKeepalive = ${keepalive}`

  return iface + '\n' + peerSection
}
