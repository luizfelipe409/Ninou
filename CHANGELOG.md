# Changelog — Ninou v78.2.0

## Visual perceptível

- cabeçalho premium com transparência e sombra progressiva ao rolar;
- órbita com fundo claro/escuro próprio, centro em vidro e relógio de maior hierarquia;
- botão principal redesenhado e estados iniciais reorganizados;
- card “Hoje com o bebê” com hierarquia, grade e leitura revisadas;
- atalhos “Registre em poucos toques” consolidados em quatro cards iguais e centralizados;
- barra inferior flutuante com estado ativo, indicador e FAB padronizados;
- cards da Home, Diário, Dados, Sons e Perfil alinhados à mesma linguagem visual;
- tratamento específico para 390 px, 430 px, tablet e desktop.

## Experiência e microinterações

- ripple posicionado no ponto real do toque;
- feedback de pressão e resposta tátil por categoria de ação;
- transições de tela, modal e folha inferior;
- animação da órbita ao receber registro;
- confirmação visual de correção/desfazer;
- estado de processamento nos botões de salvamento;
- suporte completo a “Reduzir movimento”.

## Loading e estabilidade

- classe de loading aplicada antes da primeira pintura;
- pré-carregamento das folhas de estilo e imagens críticas;
- espera explícita pela arquitetura, camadas de interface e estado familiar;
- fallback com dados locais em conexão lenta;
- remoção automática de parâmetros antigos de recuperação;
- novo cache `ninou-v78-2-0-premium-consolidated`.

## Refatoração CSS

- monólito anterior: 32.103 linhas, aproximadamente 886 KB e 7.393 ocorrências de `!important`;
- nova estrutura: legado isolado + seis módulos premium e um módulo de tokens;
- remoção das camadas acumuladas posteriores à base v75, incluindo as regras concorrentes v76/v77;
- CSS total reduzido para aproximadamente 772 KB;
- ocorrências totais de `!important` reduzidas em mais de mil;
- componentes principais passam a ter uma definição canônica por módulo.

## Preservado

- IDs e listeners usados pelo núcleo;
- dados locais e chaves existentes;
- autenticação, Firebase e regras do Firestore;
- estrutura familiar, cuidadores e permissões;
- relatórios, PDF, WhatsApp, gráficos, sons e avatares.
