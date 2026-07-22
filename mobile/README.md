# Ninou Mobile 83.0.2

Aplicativo nativo iOS e Android desenvolvido com Expo SDK 57, React Native, TypeScript e Expo Router.

## Configuração de lançamento

- versão: `83.0.2`;
- build iOS: `90`;
- versionCode Android: `90`;
- bundle/package: `com.ninou.app`;
- iOS mínimo: 16.4;
- gravação de microfone desativada;
- reprodução de áudio em segundo plano habilitada;
- Privacy Manifest presente;
- ícone 1024 × 1024.

## Estrutura

- `src/app`: telas e rotas;
- `src/components`: componentes reutilizáveis;
- `src/config/release.ts`: versão central do runtime;
- `src/domain`: regras da rotina e acesso;
- `src/services`: Firebase e administração;
- `src/state`: autenticação, rotina, perfil e preferências;
- `assets`: ícones, avatares, fundos e sons;
- `ios`: projeto nativo usado pelo build iOS.

## Comandos

```bash
npm ci
npm run check
npm run start:dev-client
```

Testes puros que não exigem Expo instalado:

```bash
npm run test:source
```

Builds:

```bash
npx eas-cli build --profile production --platform ios
npx eas-cli build --profile production --platform android
```
