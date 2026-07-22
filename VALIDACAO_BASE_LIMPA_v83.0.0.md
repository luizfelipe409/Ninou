# Validação — Ninou 83.0.0 base limpa de lançamento

## Escopo

A versão 83.0.0 consolida a web/PWA e alinha o mobile para uma entrega única de lançamento. O objetivo foi remover arquivos de correção empilhados e cópias versionadas sem reescrever regras de negócio já validadas perto da publicação.

## Resultado da limpeza

Comparação com a v82.1.13:

- arquivos totais: 375 → 336;
- tamanho do projeto: 41.358.557 → 34.983.355 bytes;
- folhas CSS web: 11 → 2;
- arquivos JavaScript web: 61 → 52;
- arquivos do build web: 99 → 87;
- código-fonte web em `js/` + `styles/`: 3.662.250 → 1.911.106 bytes;
- arquivos versionados de remendo no código ativo: removidos;
- raiz e `dist/`: gerados pela mesma fonte e comparados por hash.

A tela familiar carrega apenas `styles/app.css`. O CSS, runtime e serviço administrativos ficam fora do HTML e do pré-cache comum, sendo carregados apenas quando a conta administrativa é reconhecida.

## Validações aprovadas

- arquitetura web;
- regressões de órbita, menus, live wallpaper, sons, fluxo familiar, validade e exclusão;
- sintaxe de todos os arquivos JavaScript/MJS da web;
- build de produção;
- comparação dos 87 arquivos públicos da raiz com `dist/`, sem divergências;
- ausência de IDs HTML duplicados;
- testes puros de sincronização e permissões mobile;
- testes dos ajustes de usabilidade mobile;
- validação estática para App Store/Google Play;
- leitura sintática de 38 arquivos TypeScript/TSX, sem erros de parser;
- ausência de `.env`, credenciais de assinatura, `node_modules`, estado local do Xcode e artefatos de usuário no pacote.

## Limitação desta validação

O registro npm interno retornou HTTP 503 durante a instalação das dependências Expo. Por isso, lint, typecheck completo com dependências, `expo config --type introspect`, IPA e AAB não foram executados neste ambiente. Esses passos continuam obrigatórios antes do envio às lojas.

O Chromium headless disponível também não concluiu a captura visual desta compilação. A web foi validada por regressões, estrutura, sintaxe e build, mas deve passar por uma rodada final em navegador e sessão Firebase reais após a publicação piloto.

## Natureza da consolidação

Esta é uma base de lançamento consolidada, não uma reescrita total do produto. O núcleo web legado foi mantido para reduzir o risco funcional perto da publicação, porém agora existe um único ponto de entrada, um único núcleo ativo, um shell transversal e nomes estáveis. Novas mudanças devem ser integradas nesses arquivos, sem criar folhas ou runtimes por número de versão.
