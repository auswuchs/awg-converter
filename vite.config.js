import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

// ⚠️ Замени 'awg-converter' на имя своего github-репозитория
const REPO_NAME = 'awg-converter'

export default defineConfig({
  plugins: [vue()],
  base: process.env.NODE_ENV === 'production' ? `/${REPO_NAME}/` : '/',
})
