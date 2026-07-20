# Validação — Ninou Web v82.1.7

Data: 19/07/2026

## Verificações automatizadas aprovadas

- Build de produção (`npm run build`).
- Testes de arquitetura.
- Testes de regressão.
- Validação estrutural e sintática de todos os scripts.
- Ausência de IDs HTML duplicados.
- Presença dos arquivos públicos de privacidade, termos e suporte.
- Ausência de `.env.local` e `.vercel` no pacote final.
- Regra comercial testada isoladamente para:
  - família legada sem validade;
  - premium vigente;
  - premium vencido;
  - família suspensa.
- Bloqueio da criação autônoma de família para clientes sem código.
- Service Worker e build contendo o serviço de acesso comercial.

## Validação visual

A tela inicial e o painel de ativação foram renderizados em Chromium usando o HTML e o CSS exatos da pasta `dist`.

Capturas geradas:

- `Ninou_v82.1.7_VALIDACAO_VISUAL_WEB_CLIENTES_HOME.png`
- `Ninou_v82.1.7_VALIDACAO_VISUAL_WEB_CLIENTES_ATIVACAO.png`
- `Ninou_v82.1.7_VALIDACAO_VISUAL_WEB_CLIENTES_HOME_MOBILE.png`
- `Ninou_v82.1.7_VALIDACAO_VISUAL_WEB_CLIENTES_ATIVACAO_MOBILE.png`

O ambiente de navegador disponível bloqueia servidores locais por política organizacional. Por isso, a renderização visual foi feita por injeção do markup e estilos de produção em uma página vazia. O fluxo Firebase real deve ser confirmado após publicar a versão na Vercel, usando uma família piloto e um código criado no painel administrativo.

## Resultado

A aplicação web está preparada para uma operação comercial controlada por convite. Esta versão não inclui checkout ou cobrança automática; a aquisição e a renovação continuam sendo registradas pelo administrador no painel.
