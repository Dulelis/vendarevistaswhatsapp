# iOS do projeto

O projeto ja tem a base iOS criada com `Capacitor`.

## O que ja ficou pronto

- dependencia `@capacitor/ios`
- pasta nativa `ios/`
- sincronizacao com o mesmo `capacitor.config.ts`
- shell leve em `mobile-shell/` para bootstrap do app

## Scripts

- `npm run ios:sync`
- `npm run ios:open`

## Observacao importante

O projeto iOS foi criado nesta maquina, mas a compilacao do app para iPhone,
simulador e App Store precisa continuar em um Mac com `Xcode`.

## Fluxo recomendado no Mac

1. Clonar este projeto no Mac.
2. Definir `CAPACITOR_APP_URL` com a URL publicada do sistema.
3. Rodar `npm install`.
4. Rodar `npm run ios:sync`.
5. Rodar `npm run ios:open`.
6. Abrir no Xcode, ajustar assinatura Apple e gerar o app.

## Estrutura

- `ios/App/App.xcodeproj`
- `ios/App/App/`

## URL local padrao

Se nenhuma URL estiver configurada, os scripts iOS usam `http://localhost:3000`.
Para uso real no iPhone, prefira sempre uma URL `https` publicada.
