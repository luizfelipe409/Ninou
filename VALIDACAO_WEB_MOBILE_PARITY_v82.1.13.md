# Validação — Ninou v83.0.3

## Escopo

Validação da paridade dos fluxos mobile na aplicação web e da nova camada de live wallpaper.

## Testes automatizados

- `npm test`: aprovado.
- Testes de arquitetura: aprovados.
- Regressões visuais e estruturais: aprovadas.
- Validação de sintaxe dos módulos JavaScript: aprovada.
- `npm run build`: aprovado.
- Build gerado em `dist/` com 99 arquivos públicos.

## Validação visual controlada

Executada em Chromium, viewport 390 × 844, usando os CSS e o runtime reais da v83.0.3.

Resultados:

- wallpaper injetado uma única vez;
- animação do wallpaper confirmada por mudança de transformação ao longo do tempo;
- opção redundante “Começar agora” removida;
- painel de primeiro estado aberto e horário `07:15` entregue ao fluxo interno;
- painel premium de exclusão aberto e confirmação entregue ao fluxo interno;
- três papéis de acesso exibidos com descrição;
- botão explícito de salvar perfil presente;
- campo de nascimento recebeu a classe moderna;
- tela de validade alterada para “Acesso encerrado”, sem hifenização e sem estouro horizontal;
- nenhuma exceção JavaScript registrada no cenário controlado.

Dados detalhados: `Ninou_v83.0.3_VALIDACAO_WEB.json` entregue junto ao pacote de validação.

## Integridade da pasta mobile

- 112 arquivos antes e depois.
- Comparação SHA-256 arquivo por arquivo: idêntica.
- Hash do manifesto de integridade: `7641ac203a2647dd181feff41cc839bb1255dc9ba48a0a09f2406ea26f724631`.

## Limite da validação

A validação visual foi executada com DOM controlado e os arquivos reais de produção. Login, salvamento e renovação com uma sessão Firebase real devem ser verificados novamente após a publicação na Vercel.
