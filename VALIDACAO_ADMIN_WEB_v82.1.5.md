# Validação do painel administrativo web — Ninou v82.1.5

Data: 19/07/2026

## Defeito reproduzido

A conta administrativa era reconhecida, mas o painel permanecia dentro do shell familiar. Por isso o cabeçalho e o menu inferior continuavam visíveis enquanto o conteúdo administrativo ficava vazio.

## Alteração validada

O painel agora é montado em `#adminWebPortal`, um contêiner filho direto de `body`, independente do perfil, das telas do diário e do menu inferior.

## Teste executado no build de produção

O teste carregou diretamente de `dist/` o CSS e o runtime administrativos reais da v82.1.5, usando um conjunto controlado de dados para não alterar o Firebase. A renderização foi feita em Chromium, com viewport de 1440 × 1100 px.

Resultados:

- inicialização do runtime: aprovada;
- `#adminWebPortal` montado: `true`;
- portal: `display: block` e `visibility: visible`;
- largura renderizada: 1440 px;
- título renderizado: `Centro de operação`;
- cinco abas principais presentes;
- shell familiar: `display: none` e altura 0;
- Visão geral: quatro indicadores renderizados;
- clique em Famílias: seção alterada e duas famílias de teste renderizadas;
- clique em Suporte: seção alterada e um ticket de teste renderizado.

Evidências:

- `validation/admin-web-v82.1.5-dist-desktop.png`;
- `validation/admin-web-v82.1.5-dist-browser-report.json`.

## Testes do projeto

- build de produção: aprovado;
- arquitetura: aprovada;
- regressões: aprovadas;
- validação estrutural: aprovada;
- 172 arquivos da pasta `mobile/` comparados por SHA-256 com a versão original: nenhuma alteração.

Observação: o teste de navegador valida o build, a montagem, o isolamento do shell e a navegação do painel. O login real da conta na URL publicada depende da implantação desta versão e da sessão Firebase do ambiente publicado.
