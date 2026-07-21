# Ninou v82.1.10 — estabilidade de toque na web app

Correção exclusiva da aplicação web. A pasta `mobile/` permanece idêntica à v82.1.9.

## Ajustes

- removida a escala aplicada aos botões durante o toque;
- removido o deslocamento vertical do ícone da ação principal;
- a ação principal passou a usar uma coluna fixa para o ícone, evitando reposicionamento quando o texto muda;
- ícones e legendas da barra inferior receberam caixas de dimensões fixas;
- a troca de aba não anima mais telas com deslocamento vertical;
- cards da tela de sons não diminuem ao serem pressionados;
- o indicador do som selecionado não muda mais a largura da coluna;
- título e descrição do player de sons possuem altura reservada;
- números do timer utilizam algarismos tabulares.

## Validação

O build de produção foi renderizado em Chromium nas larguras de 390 px e 430 px. Foram comparadas as caixas geométricas antes, durante e depois dos cliques.

Resultado máximo encontrado:

- ação principal: `0 px` de deslocamento;
- ícone e texto da barra inferior: `0 px`;
- entrada da tela de sons: `0 px`;
- pressão e seleção dos cards de sons: `0 px`.

Relatório: `validation/Ninou_v82.1.10_VALIDACAO_ESTABILIDADE_WEB.json`.
