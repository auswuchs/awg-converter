<script setup>
import { ref } from 'vue'
import { parseConf, buildVpnJson, toVpnUri } from '../composables/useAwgConverter.js'
import CopyButton from './CopyButton.vue'

const input = ref('')
const result = ref('')
const status = ref(null)

async function encode() {
  status.value = null
  result.value = ''
  const raw = input.value.trim()
  if (!raw) { status.value = { type: 'err', msg: 'Вставь .conf конфиг' }; return }
  try {
    const conf = parseConf(raw)
    if (!conf.interface) throw new Error('[Interface] секция не найдена')
    if (!conf.peer) throw new Error('[Peer] секция не найдена')
    const json = buildVpnJson(conf)
    result.value = await toVpnUri(json)
    status.value = { type: 'ok', msg: 'Успешно! Скопируй результат ниже.' }
  } catch (e) {
    status.value = { type: 'err', msg: 'Ошибка: ' + e.message }
  }
}

function clear() {
  input.value = ''
  result.value = ''
  status.value = null
}
</script>

<template>
  <div>
    <div class="card">
      <div class="card-label"><span class="dot" /> Вставь .conf конфиг</div>
      <textarea v-model="input" placeholder="[Interface]&#10;PrivateKey = ...&#10;Address = ...&#10;...&#10;&#10;[Peer]&#10;PublicKey = ...&#10;..." />
      <div class="row">
        <button class="btn btn-primary" @click="encode">Конвертировать →</button>
        <button class="btn btn-secondary" @click="clear">Очистить</button>
      </div>
      <div v-if="status" :class="['status', 'status-' + status.type]">
        <span>{{ status.type === 'ok' ? '✓' : '✗' }}</span><span>{{ status.msg }}</span>
      </div>
    </div>

    <div v-if="result" class="output-card show">
      <div class="output-head">
        <div class="output-label"><span class="dot green" /> Результат</div>
        <CopyButton :text="result" />
      </div>
      <textarea class="output-textarea" :value="result" readonly />
    </div>
  </div>
</template>
