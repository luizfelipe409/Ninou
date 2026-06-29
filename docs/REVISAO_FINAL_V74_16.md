# Ninou v74.16 — Revisão final do roadmap estável

## O que foi revisado

- Carregamento principal e versionamento de cache.
- Estrutura modular de `js/`, `css/`, `audio/` e `icons/`.
- Sintaxe dos arquivos JavaScript.
- Referências do `index.html`, `styles.css` e `sw.js`.
- Persistência local-first para evitar perda de rotina/perfil ao abrir sem login ou desconectar.
- Tela Inicial, Diário, Dados, Perfil, Sons, timers, últimos registros e últimos 5 dias.

## Correções aplicadas nesta etapa

- O app não apaga mais perfil, foto, peso e registros locais quando o Firebase informa usuário desconectado.
- Sair da conta deixa a rotina local preservada.
- Janela acordado pode ser ajustada localmente sem login.
- Tema alterado sem login passa a marcar alteração local para sincronização futura.
- Próxima soneca agora mostra estado atrasado quando a janela já passou.
- Últimos 5 dias passam a contar também registros de `Acordou`.
- Player de sons preserva a mensagem de timer finalizado ao completar 1 hora.

## Observação de publicação

Depois de subir esta versão, remova cache antigo do PWA ou faça hard refresh. No iPhone, se o app estiver instalado na Tela de Início, remova e adicione novamente se ainda aparecer conteúdo antigo.
