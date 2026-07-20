# Ninou Mobile v82.1.6 — preparação para App Store

## Atualizações aplicadas

- Remoção da permissão de microfone no iOS e bloqueio de `RECORD_AUDIO` no Android.
- `expo-audio` configurado apenas para reprodução, sem gravação.
- Reprodução em segundo plano preservada.
- Versão sincronizada em `app.json`, `package.json`, Xcode e tela administrativa.
- Build local de referência atualizado para 84; o EAS permanece com versionamento remoto e incremento automático.
- Ícone-fonte do Expo substituído pelo arquivo nativo real de 1024 × 1024.
- Privacy Manifest mantido no projeto nativo e espelhado no app config.
- Exclusão de conta agora desativa o acesso, registra uma solicitação administrativa e desconecta o usuário.
- Texto de privacidade dentro do aplicativo ampliado com categorias de dados, finalidade, Firebase, ausência de venda/rastreamento e tratamento de dados compartilhados.
- Teste automatizado `npm run test:store` criado.

## Processo administrativo de exclusão

A solicitação aparece no painel administrativo como `data_deletion_request`. Para concluir:

1. Confirmar a identidade e o escopo solicitado.
2. Verificar se o usuário é proprietário ou membro de uma família compartilhada.
3. Preservar somente dados compartilhados necessários aos demais responsáveis; remover ou anonimizar dados pessoais exclusivos do solicitante.
4. Remover vínculos do usuário nas coleções `users` e `families/*/members`.
5. Excluir o usuário no Firebase Authentication usando o Firebase Console ou Admin SDK.
6. Marcar a solicitação como concluída no painel administrativo.

## Pendências que exigem dados externos ou publicação

- Publicar uma política de privacidade em URL pública e informar essa URL no App Store Connect.
- Definir um endereço público de suporte/privacidade antes de criar a página definitiva.
- Gerar um IPA de produção e validar no TestFlight em iPhone físico.
- Preencher o formulário App Privacy do App Store Connect de acordo com a coleta real.
