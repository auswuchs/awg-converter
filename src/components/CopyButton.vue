<script setup>
import { ref } from 'vue'

const props = defineProps({ text: { type: String, required: true } })
const copied = ref(false)

async function copy() {
  if (!props.text) return
  try {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(props.text)
    } else {
      const ta = document.createElement('textarea')
      ta.value = props.text
      document.body.appendChild(ta)
      ta.select()
      document.execCommand('copy')
      document.body.removeChild(ta)
    }
    copied.value = true
    setTimeout(() => copied.value = false, 2000)
  } catch (e) {
    alert('Не удалось скопировать. Выдели текст вручную и скопируй.')
  }
}
</script>

<template>
  <button :class="['copy-btn', { copied }]" @click="copy">
    <svg v-if="!copied" width="13" height="13" viewBox="0 0 16 16" fill="none">
      <rect x="5" y="5" width="9" height="9" rx="2" stroke="currentColor" stroke-width="1.5"/>
      <path d="M11 5V4a2 2 0 00-2-2H4a2 2 0 00-2 2v5a2 2 0 002 2h1" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
    </svg>
    <svg v-else width="13" height="13" viewBox="0 0 16 16" fill="none">
      <path d="M3 8l4 4 6-7" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
    </svg>
    {{ copied ? 'Скопировано' : 'Копировать' }}
  </button>
</template>
