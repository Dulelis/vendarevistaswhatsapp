# APK do projeto

Este projeto usa `Next.js` com rotas de servidor, login e Supabase.
Por isso, o APK mais seguro neste momento e um app Android com `Capacitor`
abrindo a versao web do sistema.

## Como funciona

- Em desenvolvimento local, os scripts Android usam `http://10.0.2.2:3000`
  por padrao para rodar no emulador.
- Em producao, basta definir `CAPACITOR_APP_URL` com a URL publicada do sistema.
- Depois disso, novas atualizacoes do painel entram pela web sem recriar toda a base.
- O APK usa um `mobile-shell` leve so para bootstrap, sem empacotar a pasta
  `.next` inteira.

## Scripts

- `npm run dev:mobile`
- `npm run apk:sync`
- `npm run apk:android`
- `npm run apk:build:debug`

## URL usada pelo APK

O arquivo `capacitor.config.ts` le:

- `CAPACITOR_APP_URL`
- `NEXT_PUBLIC_SITE_URL`
- `NEXT_PUBLIC_APP_URL`
- `.env.local`

Se nada estiver definido, ele usa:

- `http://10.0.2.2:3000` nos scripts Android
- `http://localhost:3000` nos scripts iOS

## Saida esperada

Depois de `npm run apk:build:debug`, o APK de debug costuma ficar em:

`android/app/build/outputs/apk/debug/app-debug.apk`

## Observacao

Para celular real, o ideal e publicar o sistema em uma URL `https`.
