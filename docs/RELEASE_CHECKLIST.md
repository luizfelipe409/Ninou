# Checklist de lançamento

## Dados e Firebase

- Fazer backup dos registros atuais.
- Remover usuários e famílias de teste somente após o backup.
- Não excluir o projeto Firebase inteiro.
- Publicar `firestore.rules` da mesma entrega.
- Confirmar que Felipe e Maria entram pelo fluxo comercial comum.
- Confirmar que o e-mail admin recebe apenas a permissão adicional do painel.

## Web

- Executar `npm run release:check`.
- Publicar `dist/` na Vercel.
- Abrir em janela anônima e validar ativação, login, expiração e renovação.
- Validar PWA após remover Service Worker/cache de versões anteriores.
- Validar painel administrativo em sessão Firebase real.

## iOS

- Executar `npm ci && npm run check` em `mobile/`.
- Gerar build EAS de produção.
- Instalar pelo TestFlight.
- Validar login, família, rotina, sons, órbita, relatórios e exclusão.
- Confirmar política de privacidade pública e ficha da App Store.

## Android

- Gerar APK de teste e AAB de produção.
- Validar em aparelho físico.
- Preencher Segurança dos dados e página externa de exclusão.
- Publicar primeiro em teste interno/fechado.
