# Ninou v75.76.1 — correção do carregamento preso em “Conectando”

## Diagnóstico

A versão v75.76.0 realizou uma remoção agressiva de código JavaScript considerado sem uso. Essa limpeza era arriscada porque o aplicativo possui chamadas indiretas e componentes montados dinamicamente. Uma falha durante a primeira renderização podia interromper o módulo antes de `initFirebaseAuthState()`, deixando o status já definido como **Conectando** sem conclusão.

## Correção aplicada

- restaurado o núcleo JavaScript da última versão estável;
- restaurados `account-service.js`, `export-service.js` e `ui/account.js`;
- mantido o CSS verde premium consolidado;
- mantida uma única barra inferior;
- mantida a remoção do token da Vercel do pacote;
- adicionado limite de 15 segundos à inicialização do Firebase;
- se o Firebase não responder, o app sai de “Conectando” e abre em modo local com mensagem clara;
- cache do Service Worker atualizado para `ninou-v75-76-1-stable-recovery`.

## Estratégia de refatoração segura daqui em diante

A limpeza do JavaScript deve ser feita por módulos, com teste de login, família, registros, relatórios e PWA após cada etapa. Nesta versão, somente a refatoração visual/CSS considerada segura foi mantida; a remoção agressiva do núcleo JavaScript foi revertida.
