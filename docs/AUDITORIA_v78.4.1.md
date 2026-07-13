# Auditoria técnica — Ninou v78.4.1

## Escopo desta correção

A v78.4.1 foi criada a partir da gravação de 13/07/2026, com foco nos três defeitos confirmados em aparelho móvel:

- loading não aparecia antes da interface instável;
- centro e relógio da órbita podiam surgir fora do eixo;
- atalhos “Registre em poucos toques” mantinham ícones cortados e desalinhados.

## Estratégia aplicada

- folha `styles/v78.4-critical.css` carregada por último, com autoridade explícita somente sobre os componentes afetados;
- módulo `js/runtime/visual-guard-v78.4.1.mjs`, que mede a geometria renderizada e reaplica a composição quando necessário;
- boot não libera a Home enquanto perfil salvo, relógio e geometria mínima não estiverem coerentes;
- migração única e segura de Service Worker/cache para impedir a reutilização do runtime 78.3.0, sem apagar registros locais;
- loading de abertura e loading de retomada tratados separadamente.

## Validações concluídas

- `npm test`: arquitetura, regressões e validação estrutural aprovadas;
- 55 arquivos JavaScript verificados;
- CSS total: aproximadamente 783,6 KB, mantendo a base legada necessária às telas antigas;
- build de produção gerado com a folha crítica e o guardião visual;
- teste de geometria em viewport móvel 430 × 932:
  - diferença horizontal do centro da órbita: 0 px;
  - diferença vertical do centro da órbita: 0 px;
  - quatro ícones contidos integralmente nos respectivos cards;
  - grade final 2 × 2 e botões em composição vertical.

## Limite da validação

O teste automatizado reproduz a geometria do viewport móvel e confirma os estilos computados. A confirmação definitiva do comportamento do Safari/PWA ainda depende de abrir esta versão no iPhone após a migração única do cache.
