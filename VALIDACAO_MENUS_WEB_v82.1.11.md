# Validação dos menus web — Ninou v82.1.11

## Referência mobile usada

- `mobile/src/app/(tabs)/_layout.tsx`
- `mobile/src/components/ninou-app-header.tsx`

## Barra inferior

Validada com os arquivos reais de `dist/` em Chromium:

- ordem: Hoje, Diário, Dados, Sons e Perfil;
- cinco ícones SVG, com estado outline/inativo e preenchido/ativo;
- marcador inferior no item ativo;
- botão de novo registro no lado direito;
- largura de 366 px em viewport 390 px e largura máxima de 500 px no desktop;
- altura fixa de 70 px;
- posição idêntica antes e depois da navegação;
- navegação para Sons atualizou a aba ativa e a tela visível;
- abertura do menu de novo registro confirmada.

## Menu do avatar

Validado em viewport 390 × 844 e 1440 × 1000:

- abertura ao clicar no avatar/cabeçalho;
- bottom sheet com 630 px de altura no cenário de teste;
- identidade do bebê, papel, conta e status sincronizados;
- atalhos: Perfil, Diário, Dados, Sons, Relatórios e Novo registro;
- aparência: Claro, Escuro e Automático;
- fechamento pelo botão e pelo fundo;
- saída da conta ligada ao fluxo existente da web;
- nenhum erro de JavaScript durante a validação.

## Estabilidade

A barra permaneceu com as mesmas coordenadas e dimensões antes e depois da troca de tela:

- mobile web: `x=12`, `y=766`, `366 × 70`;
- desktop: `x=470`, `y=922`, `500 × 70`.

## Integridade mobile

A pasta `mobile/` foi comparada com a v82.1.10 original:

- 106 arquivos em ambas;
- nenhum arquivo adicionado;
- nenhum arquivo removido;
- nenhum hash SHA-256 alterado.
