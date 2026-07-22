# Validação de estabilidade visual — web v82.1.10

A validação utilizou os arquivos reais gerados em `dist/`, com as folhas de estilo do build carregadas em Chromium.

## Cenários medidos

1. Botão principal em repouso, pressionado e após troca de estado de “Acordou” para “Iniciar soneca”.
2. Ícones e textos da barra inferior antes, durante e depois da troca para a aba Sons.
3. Cards e textos da tela de sons imediatamente após a entrada, depois de 80 ms e depois de 320 ms.
4. Card de som em repouso, pressionado e após assumir o estado selecionado.
5. Troca do título, descrição e ícone do player.

## Viewports

- 390 × 844 px;
- 430 × 932 px.

## Resultado

Todos os elementos monitorados apresentaram deslocamento geométrico máximo de **0 px**.

A tela de sons apresentou:

- `animation-name: none`;
- `transform: none`.

Os testes de arquitetura, regressão e validação estrutural também foram aprovados.

A pasta `mobile/` foi comparada por SHA-256, arquivo por arquivo, e não possui alterações.
