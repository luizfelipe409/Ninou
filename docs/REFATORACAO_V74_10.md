# Refatoração v74.10 — Parte 10

## Foco

Esta etapa separa a lógica de áudio/sons do `js/app.legacy.js`, mantendo a aba Sons funcionando como antes.

A mudança continua conservadora: o app legado ainda orquestra a inicialização, mas o player de sons, o timer de 1 hora e a configuração das faixas agora ficam em módulos próprios.

## Arquivos adicionados

### `js/domain/sounds.js`

Centraliza:

- duração padrão do timer de sons;
- opções de sons disponíveis;
- normalização da chave do som;
- formatação do tempo restante;
- cálculo de progresso do timer;
- textos de status e botão do player.

### `js/ui/sounds.js`

Centraliza:

- inicialização da aba Sons;
- seleção entre Som do útero, Som para relaxar e Ritmo suave bebê;
- play, pause e stop;
- loop do áudio;
- timer de 1 hora;
- barra de progresso;
- atualização dos textos do player.

## Arquivos atualizados

- `js/app.legacy.js`
- `app.js`
- `styles.css`
- `index.html`
- `sw.js`
- `README.md`

## O que foi preservado

- Som do útero com `/audio/som-utero.mp3`;
- Som para relaxar com `/audio/som-relaxar.mp3`;
- Ritmo suave bebê com `/audio/ritmo-suave-bebe.mp3`;
- botão tocar/pausar;
- botão parar;
- timer de 1 hora;
- loop do áudio;
- seleção visual do som ativo;
- cache PWA dos áudios e dos novos módulos.

## Próxima etapa sugerida

A v74.11 deve separar navegação principal, bottom nav, estados vazios e utilitários de renderização geral, preparando a limpeza final do `js/app.legacy.js`.
