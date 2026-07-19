# Ninou v82.1.1 — Paridade estrita do admin web com o mobile

- O painel administrativo web passou a usar o componente mobile como especificação visual e comportamental direta.
- Conteúdo limitado a 720 px, cartões de métricas sempre em duas colunas e espaçamentos equivalentes ao aplicativo principal.
- Cabeçalho, hero, abas, listas, chips, ícones e estados foram refeitos com a mesma linguagem visual do mobile.
- A abertura de uma família agora ocorre em tela cheia, deslizando de baixo para cima.
- Confirmações destrutivas são sobrepostas à tela da família, mantendo o contexto visível, como no mobile.
- Criação de família e tickets usam diálogos centrais com fade.
- O CSS administrativo antigo deixou de fazer parte do pacote de produção; somente a camada de paridade é carregada para o admin global.
- Admin global continua sem família pessoal e sem o card técnico legado.
