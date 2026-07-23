# Ninou v84.1.1 — correção do ESLint ESM

- Corrige `mobile/eslint.config.js` para o arquivo CommonJS explícito `eslint.config.cjs`, compatível com `"type": "module"`.
- Move `require()` e `module.exports` para um arquivo `.cjs`, onde são válidos.
- Adiciona contrato automatizado para impedir a regressão.
- Mantém a arquitetura universal: web, iOS e Android usam o mesmo Expo/React Native Web e o mesmo Firebase.
- Atualiza versões e números de build para 84.1.1 / 92.
