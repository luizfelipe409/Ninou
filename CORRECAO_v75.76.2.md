# Ninou v75.76.2 — recuperação do JavaScript, Firebase e PWA

## Sintoma corrigido

A interface carregava com a barra verde correta, mas permanecia em **Off-line** e nenhum botão respondia.

## Causas

1. Os caminhos antigos `app.js` e `js/app.legacy.js` haviam sido removidos durante a refatoração. Um PWA ainda controlado por cache anterior podia carregar o HTML/CSS novo e falhar ao localizar o JavaScript.
2. O Service Worker podia devolver `index.html` como fallback para uma requisição `.js`, causando erro de MIME e impedindo toda a inicialização.
3. O fallback de conexão chamava o bloqueio de acesso, deixando a navegação desabilitada.
4. Uma falha temporária ao consultar o Firestore podia apagar o vínculo familiar armazenado no aparelho.

## Correções

- Restaurado `app.js` como carregador estável.
- Mantido `js/app.legacy.js` apenas como ponte de compatibilidade; o código real existe somente em `js/app.js`.
- Service Worker atualizado para nunca responder HTML a requisições JavaScript/CSS.
- Instalação do cache passou a tolerar falha isolada de um recurso sem abortar toda a atualização.
- Vínculo familiar local é preservado quando a leitura do Firestore falha temporariamente.
- Validação de autenticação possui watchdog de 18 segundos e libera o uso local sem bloquear a página.
- Status **Erro/Off-line** pode ser tocado para tentar reconectar.
- Mantida uma única barra inferior verde premium.

## Validações estruturais

- 36 arquivos JavaScript passaram em `node --check`.
- Nenhuma referência local ausente no HTML, imports ou cache do PWA.
- Nenhum `.env` ou token incluído no pacote.
- Uma única `bottom-bar` e uma única `bottom-nav` no HTML.
