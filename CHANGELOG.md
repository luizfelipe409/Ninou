# Changelog — Ninou v79.2.0

## Correções PWA e Perfil

- safe area superior aplicada ao Perfil no modo instalado, evitando o cabeçalho colado à barra do iPhone;
- barra inferior volta a ser fixa e legível no Perfil, tanto no tema escuro quanto no claro;
- mesma navegação preservada para conta conectada, visitante e estado bloqueado;
- timer de amamentação é encerrado e ocultado ao fechar a folha ou mudar de tela;
- proteção CSS impede que formulário, backdrop ou timer permaneçam sobre Home, Diário, Dados, Sons ou Perfil;
- estrelas e brilho da órbita mantêm movimento lento no PWA mesmo quando o aparelho informa “Reduzir Movimento”.

## Home

- centralização real dos quatro atalhos rápidos com `flex` vertical;
- altura e ícones uniformes em 390 px e 430 px.

## Gráfico de peso

- remoção do contorno branco grosso dos rótulos do eixo;
- tipografia reduzida para peso intermediário e contraste mais limpo;
- IDs de gradiente separados por gráfico;
- remoção do filtro SVG compartilhado que podia ocultar a curva em uma das telas.

## Diário

- contraste explícito para título, horários, detalhes, responsável e edição dos registros;
- ações Editar e Excluir organizadas lado a lado;
- filtros passam a quebrar em linhas naturais;
- `diaryChipsMoreButton` removido da interface.

## Perfil

- retirada da reconstrução compacta da v79.0.0;
- retorno ao acabamento anterior existente no CSS legado;
- correção mantida somente no card “Minha família”, com avatares de 48 px e texto protegido contra estouro.

## Infraestrutura

- scripts, manifesto, cache e Service Worker atualizados para 79.2.0;
- build da Vercel mantido em `dist`;
- testes de sintaxe, arquitetura, regressão e estrutura atualizados.
