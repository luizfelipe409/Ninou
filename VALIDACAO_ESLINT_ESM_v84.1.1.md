# Validação — Ninou v84.1.1

## Correção

A v84.1.0 declarava `"type": "module"` no `mobile/package.json`, mas mantinha a configuração do ESLint em `eslint.config.js` usando `require()` e `module.exports`.

A v84.1.1 move essa configuração para `mobile/eslint.config.cjs`, preservando o formato CommonJS de modo explícito e compatível com o projeto ESM.

## Proteção contra regressão

O teste `mobile/tests/typescript-style-contract.test.mjs` agora exige:

- `eslint.config.cjs` presente;
- uso de CommonJS apenas no arquivo `.cjs`;
- ausência da combinação incompatível que causou `require is not defined in ES module scope`.

## Validações executadas neste ambiente

Aprovadas:

- sintaxe de `eslint.config.cjs`;
- contratos de estilos e imports TypeScript;
- paridade universal de dados, menus e órbita;
- sincronização da rotina e permissões familiares;
- separação entre admin e famílias;
- fluxos mobile e permissões;
- prontidão App Store em análise estática;
- arquitetura universal web/iOS/Android;
- validação estrutural do projeto.

A execução integral de `expo lint`, `tsc --noEmit` e `expo export` depende da instalação local das dependências com `npm ci`. O usuário já confirmou que o `typecheck` da v84.1.0 estava aprovado antes do erro de carregamento da configuração do ESLint.
