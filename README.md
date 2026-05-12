# AWG Converter

AmneziaWG `.conf` ⇄ `vpn://` конвертер. Всё работает локально в браузере — конфиги никуда не отправляются.

## Локальный запуск

```bash
npm install
npm run dev
```

Откроется на `http://localhost:5173`.

## Build

```bash
npm run build
```

Готовая сборка ляжет в `dist/`.

## Деплой на GitHub Pages

1. Создай репозиторий на GitHub (например `awg-converter`).
2. **Замени** `REPO_NAME` в `vite.config.js` на имя своего репо.
3. Запушь код:

   ```bash
   git init
   git add .
   git commit -m "init"
   git branch -M main
   git remote add origin https://github.com/USERNAME/REPO_NAME.git
   git push -u origin main
   ```

4. В GitHub: **Settings → Pages → Source → "GitHub Actions"**.
5. Любой push в `main` теперь автоматически собирает и деплоит. Готовый сайт будет на `https://USERNAME.github.io/REPO_NAME/`.

## Стек

- Vue 3 (Composition API, `<script setup>`)
- Vite
- Zero рантайм-зависимостей помимо Vue
