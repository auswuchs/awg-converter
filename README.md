# AWG Converter

A converter for **AmneziaWG** configs: turns `.conf` files into `vpn://` keys and back. Runs entirely in the browser — keys and sensitive data never leave your device.

## Why

AmneziaVPN lets you share a server three ways: QR code, `.conf` file, and `vpn://` link. The link is the most convenient option for messaging apps, but there's no built-in way to generate one from an existing `.conf` file. This tool fills the gap:

- You have a WireGuard/AmneziaWG `.conf` file → get a shareable `vpn://` link
- Someone sent you a `vpn://` but you need a `.conf` (e.g. for a router or another client) → decode it back

## Features

- 🔒 **Fully local** — no backend, keys never leave the browser
- 🔄 **Both directions** — `.conf → vpn://` and `vpn:// → .conf`
- 🛡️ **AmneziaWG 2.0** — full support for obfuscation parameters (`H1-H4`, `S1-S4`, `Jc/Jmin/Jmax`, `I1-I5`)
- 📋 **Amnezia-compatible** — generated links work with the official AmneziaVPN app
- ⚡ **Zero dependencies** — uses native browser APIs for compression and base64

## How to use

1. Open the app
2. Pick a direction — `.conf → vpn://` or `vpn:// → .conf`
3. Paste your config into the textarea
4. Hit "Convert"
5. Copy the result

## How it works (technical)

The Amnezia `vpn://` format is:

```
vpn:// + URL-safe base64( qCompress( JSON ) )
```

where `qCompress` is Qt's compression format: 4 bytes (big-endian) of uncompressed data size, followed by zlib-compressed data. The inner JSON has a specific two-level structure — an outer `containers[0].awg` object and an inner `last_config` (a JSON string), which the app parses to register the server.

The converter implements both directions: parses `.conf`, builds the correct JSON structure, compresses via the `CompressionStream` API (with manual adler32 correction, since browsers compute it incorrectly), and encodes to URL-safe base64.

## License

MIT