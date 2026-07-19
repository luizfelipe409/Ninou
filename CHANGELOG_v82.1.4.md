# Ninou 82.1.4

## Painel administrativo restaurado no web app

- A conta global `luizfelipe.dasilva@gmail.com` agora entra por um gate administrativo dedicado no web app, seguindo a separação já usada pela versão mobile.
- O painel deixa de depender apenas da renderização posterior da tela de perfil: a abertura é aguardada logo após a autenticação do admin.
- Runtime, estilos e serviço administrativo passam a usar a mesma versão de cache.
- O Service Worker passa a preparar os arquivos do painel para evitar que o restante do app abra sem o módulo administrativo.
- Removido o cache imutável de URLs internas sem versão na Vercel, evitando mistura de arquivos antigos e novos.
- Adicionada recuperação visível com botão “Recarregar painel” caso o navegador ainda tenha um módulo antigo em cache.
- A inicialização administrativa pode ser repetida com segurança quando o contêiner ainda não estava disponível.
- Nenhum arquivo da pasta `mobile/` foi alterado.
