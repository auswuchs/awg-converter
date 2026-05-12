<script setup>
import { ref } from 'vue'
import EncodeTab from './components/EncodeTab.vue'
import DecodeTab from './components/DecodeTab.vue'
import InfoBar from './components/InfoBar.vue'

const tab = ref('encode')
</script>

<template>
  <div class="wrap">
    <header class="header">
      <div class="logo-line">
        <span class="logo-badge">AWG</span>
        <span class="logo-v">converter</span>
      </div>
      <h1>.conf <span>⇄</span> vpn://</h1>
      <p class="subtitle">Конвертер конфигов AmneziaWG 2.0. Всё локально, ничего не отправляется.</p>
    </header>

    <InfoBar />

    <div class="tabs">
      <button :class="['tab', { active: tab === 'encode' }]" @click="tab = 'encode'">.conf → vpn://</button>
      <button :class="['tab', { active: tab === 'decode' }]" @click="tab = 'decode'">vpn:// → .conf</button>
    </div>

    <EncodeTab v-show="tab === 'encode'" />
    <DecodeTab v-show="tab === 'decode'" />

    <footer class="footer">
      AmneziaWG 2.0 · Работает полностью в браузере<br>
      <span class="footer-dim">Совместим с amnezia-awg2 (I1–I5 параметры)</span>
    </footer>
  </div>
</template>
