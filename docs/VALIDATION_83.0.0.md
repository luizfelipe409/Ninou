# Validação da base 83.0.0

## Web executado

- arquitetura e domínio;
- regressões funcionais e visuais;
- build de produção;
- estrutura do pacote;
- ausência de arquivos versionados de correção no código ativo e em `dist/`;
- alinhamento entre versão web e mobile.

## Mobile executado sem dependências externas

- sincronização da rotina;
- política de separação entre admin e famílias;
- fluxos de usabilidade, validade, exclusão e permissões;
- configuração estática para lojas;
- leitura sintática dos arquivos TypeScript/TSX.

## Validação ainda obrigatória antes das lojas

A instalação das dependências e o build Expo completo não foram concluídos neste ambiente porque o registro npm retornou HTTP 503. Antes do envio, executar localmente:

```bash
cd mobile
npm ci
npm run check
npx expo config --type introspect
```

Depois, gerar IPA/AAB e testar em aparelhos físicos.
