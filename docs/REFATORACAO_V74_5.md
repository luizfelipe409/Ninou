# Ninou v74.5 — Refatoração Parte 5

## Objetivo

Separar a camada de timers e regras de sono sem alterar o comportamento aprovado da v74.

Esta etapa reduz a responsabilidade do `js/app.legacy.js` e prepara a base para a próxima evolução: edição completa de início/fim de sono, registro de "Acordou" no Diário e recálculo da janela acordado.

## Novos módulos

### `js/domain/sleep.js`

Centraliza regras de domínio da rotina de sono:

- detectar se a rotina está ativa;
- detectar modo acordado/dormindo;
- calcular tempo ativo ao vivo;
- identificar despertar noturno ativo;
- fechar despertar noturno ao voltar a dormir;
- finalizar sono ativo;
- iniciar timer de sono;
- iniciar rotina acordado/dormindo;
- decidir quando um registro manual deve virar timer ativo;
- calcular sobreposição de sono em períodos;
- calcular sono e tempo acordado por intervalo.

### `js/services/timer-service.js`

Centraliza a montagem textual do timer:

- texto abaixo do relógio principal;
- dados do cartão de timer ativo;
- título, subtítulo, ação, ícone e progresso do timer.

## Arquivos atualizados

- `app.js` atualizado para `v74.5`;
- `styles.css` atualizado para `v74.5`;
- `index.html` atualizado para carregar `v=74.5`;
- `sw.js` atualizado para cache `ninou-v74-5-refactor`;
- `js/app.legacy.js` agora delega regras de sono/timer para os novos módulos.

## Garantia desta etapa

A alteração foi estrutural. A tela, os botões e os fluxos existentes foram preservados.

A próxima etapa poderá mexer na regra de sono com mais segurança, porque a lógica de acordado/dormindo/despertar já está isolada.
