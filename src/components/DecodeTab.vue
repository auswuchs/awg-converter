<script setup>
import { ref } from 'vue'
import { fromVpnUri, jsonToConf } from '../composables/useAwgConverter.js'
import CopyButton from './CopyButton.vue'

const input = ref('')
const result = ref('')
const status = ref(null)

async function decode() {
  status.value = null
  result.value = ''
  const raw = input.value.trim()
  if (!raw) { status.value = { type: 'err', msg: 'Вставь vpn:// строку' }; return }
  try {
    const json = await fromVpnUri(raw)
    const configs = Array.isArray(json) ? json : [json]
    let out = ''
    configs.forEach((j, i) => {
      if (configs.length > 1) out += `# ===== Сервер ${i + 1}: ${j.description || j.hostName || '?'} =====\n`
      try { out += jsonToConf(j) + '\n\n' }
      catch (e) { out += `# Ошибка парсинга: ${e.message}\n\n` }
    })
    result.value = out.trim()
    status.value = { type: 'ok', msg: configs.length > 1 ? `Обнаружено ${configs.length} сервера(-ов).` : 'Успешно декодировано!' }
  } catch (e) {
    status.value = { type: 'err', msg: 'Ошибка декодирования: ' + e.message }
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
      <div class="card-label"><span class="dot" /> Вставь vpn:// ключ</div>
      <textarea v-model="input" placeholder="vpn://eyJ..." />
      <div class="row">
        <button class="btn btn-primary" @click="decode">Декодировать →</button>
        <button class="btn btn-secondary" @click="clear">Очистить</button>
      </div>
      <div v-if="status" :class="['status', 'status-' + status.type]">
        <span>{{ status.type === 'ok' ? '✓' : '✗' }}</span><span>{{ status.msg }}</span>
      </div>
    </div>

    <div v-if="result" class="output-card show">
      <div class="output-head">
        <div class="output-label"><span class="dot green" /> Результат (.conf)</div>
        <CopyButton :text="result" />
      </div>
      <textarea class="output-textarea" :value="result" readonly />
    </div>
  </div>
</template>
