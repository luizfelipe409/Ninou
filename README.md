# Ninou 83.0.2 — base de lançamento com correções mobile

Repositório consolidado do Ninou para web/PWA, iOS e Android.

## Estrutura

- `index.html`, `styles/` e `js/`: aplicação web/PWA.
- `mobile/`: aplicação nativa Expo/React Native para iOS e Android.
- `firestore.rules`: regras de acesso e sincronização do Firebase.
- `dist/`: build web gerado por `npm run build`.
- `docs/`: arquitetura, checklist e histórico técnico.

## Base web consolidada

A aplicação web utiliza apenas:

- `styles/app.css`: acabamento comum completo;
- `styles/admin.css`: painel administrativo, carregado apenas para o admin;
- `js/bootstrap.mjs`: inicialização;
- `js/app-core.mjs`: regras e fluxos principais;
- `js/ui/app-shell.mjs`: menu, live wallpaper e experiência compartilhada;
- módulos de domínio, serviços e interface com nomes estáveis.

Arquivos versionados de correção, cópias antigas de `boot`, `core`, painel e múltiplas folhas CSS empilhadas não fazem parte da base ativa. O núcleo legado foi preservado para reduzir risco funcional perto do lançamento, mas agora existe apenas uma cópia ativa com ponto de entrada estável.

## Mobile

A pasta `mobile/` usa Expo SDK 57, React Native e TypeScript. A mesma base gera:

- iOS: IPA/TestFlight/App Store;
- Android: APK de teste e AAB para Google Play.

Versão do pacote: `83.0.2`  
Build iOS/Android: `90`  
Identificador: `com.ninou.app`

## Validação web

```bash
npm run release:check
```

O comando executa regressões, build, validação estrutural e verificação de limpeza. Consulte também `VALIDACAO_BASE_LIMPA_v83.0.0.md`.

## Validação mobile

Consulte `VALIDACAO_MOBILE_v83.0.2.md` para os cenários corrigidos nesta versão.

```bash
cd mobile
npm ci
npm run check
```

Sem dependências instaladas, os testes puros ainda podem ser executados:

```bash
npm run test:source
```

## Publicação

### Web/Vercel

- Build Command: `npm run build`
- Output Directory: `dist`

### Lojas

Antes do envio, execute um build real de produção e valide em aparelhos físicos:

```bash
cd mobile
npx eas-cli build --profile production --platform ios
npx eas-cli build --profile production --platform android
```

O lançamento deve começar com uma família piloto criada pelo painel. Felipe e Maria seguem o mesmo fluxo comercial dos demais usuários; a conta administrativa apenas acrescenta acesso ao painel global.
