# Migração do Ninou para Expo / React Native

## Decisão

O aplicativo mobile será uma interface React Native verdadeira, sem WebView, usando:

- Expo SDK 57 e React Native 0.86;
- TypeScript em modo estrito;
- Expo Router para navegação;
- Development Build durante o desenvolvimento;
- EAS Build para binários Android e iOS.

O Expo Go permanece útil para testes muito rápidos, mas não é o ambiente final do Ninou. Development Build permite evoluir com módulos nativos e reproduz melhor o aplicativo que será enviado às lojas.

## Estado da migração da experiência familiar

Concluído:

- workspace independente em `mobile/`;
- cinco áreas principais e modal funcional com os oito tipos de registro;
- cabeçalho, largura, espaçamentos e primeira dobra da Home equivalentes ao app web;
- os 12 avatares originais, seleção no Perfil e persistência/sincronização do avatar e de “Diário do/da”;
- editor modal de avatar com prévia, nomes, seleção temporária e confirmação;
- órbita cósmica responsiva de 24 horas, relógio central em tempo real, arcos de duração, lua, estrelas e estados de rotina equivalentes ao app web;
- barra inferior premium com cinco áreas e novo registro na mesma cápsula;
- painel de Dados com leitura sincronizada dos últimos sete dias, pesos e gráficos por categoria;
- player de Sons com repetição, pausa/continuação e timer real de uma hora;
- cronômetros de sono, soneca, vigília e despertar;
- persistência local do perfil e da rotina;
- Firebase Authentication com a mesma conta do app web;
- resolução de família pelo contrato `users/{uid}/families`;
- listener Firestore em tempo real para perfil e rotina do dia;
- gravações de rotina em transação, com versão monotônica para convergência entre aparelhos;
- diário e dados calculados a partir da mesma fonte local;
- sons reais do produto com controle de reprodução;
- tema claro/escuro e componentes de interface próprios;
- configuração inicial de ícone, splash, scheme e EAS;
- lint e TypeScript integrados.
- portal comercial, cadastro, login, criação guiada da família e aceite de convite;
- menu do avatar e barra inferior canônica com cinco áreas e botão `+` independente;
- Diário por data com filtros, edição, exclusão sincronizada, episódios rápidos e nota livre com salvamento automático;
- formulário manual de data/início/fim, timer de amamentação por lado, volume de mamadeira e dose de medicamento;
- relatórios por período com PDF profissional, WhatsApp, CSV e JSON;
- histórico de peso, identificação do cuidador deste aparelho, convites de uso único, lista de membros e papéis;
- tema persistente, termos, privacidade, aviso médico, aceite sincronizado, suporte com diagnóstico limitado e solicitação de exclusão;
- exclusões de eventos propagadas entre aparelhos sem ressuscitar registros antigos.

Fora do aplicativo distribuído por decisão de produto:

- console técnico/global de administração, migração de clientes e reparo de vínculos, que permanece restrito ao webapp interno;
- credenciais administrativas e operações de suporte privilegiadas.

## Próximas fases

### 1. Contratos compartilhados — concluída localmente

As regras puras de registro, rotina, intervalos e resumo já foram modeladas no mobile, sem dependência de DOM ou `localStorage`. Papéis familiares continuam vinculados à migração do Firebase.

### 2. Firebase mobile — núcleo conectado

O mobile usa Firebase JS SDK 12.16 para Authentication e Firestore. A configuração pública aceita variáveis `EXPO_PUBLIC_*` e aponta, por padrão, para o mesmo projeto Firebase do Ninou web; credenciais administrativas nunca entram no aplicativo.

Para impedir divergência entre dois aparelhos, a implementação atual:

- usa o Firestore como fonte compartilhada da rotina ativa;
- mantém listener em tempo real para família e dia atuais;
- grava início/fim de ações em transação;
- preserva eventos por identificador e incrementa a versão do estado ativo dentro da transação;
- reconcilia o estado local com cada snapshot do servidor.

Antes da publicação ainda é obrigatório executar o cenário completo em dois aparelhos físicos, incluindo perda e retorno da conexão.

### 3. Autenticação e família — fluxo familiar conectado

Login, cadastro, criação de família, aceite de convite, geração de convite e leitura dos membros usam os mesmos documentos e papéis familiares do webapp.

### 4. Rotina vertical — base local concluída

Migrar uma jornada completa por vez:

1. sono e estado acordado/dormindo;
2. mamadas;
3. fraldas;
4. medicamentos e observações;
5. diário e relatórios.

As jornadas compartilham uma única fonte de estado, histórico familiar, notas e exclusões sincronizadas. A substituição da web nas lojas ainda depende da rodada final em aparelhos físicos, incluindo dois aparelhos na mesma conta, perda de rede, restauração e compartilhamentos nativos.

### 5. Preparação das lojas

- confirmar `android.package` e `ios.bundleIdentifier`;
- criar ícone 1024 × 1024 e adaptive icon com área segura;
- definir política de privacidade, exclusão de conta e contato de suporte;
- gerar builds `preview` para testes internos;
- validar permissões, acessibilidade, telas pequenas e modo escuro;
- configurar fichas da Play Store/App Store e então gerar o build `production`.

## Comandos de validação

```bash
npm run mobile:check
npm --prefix mobile exec expo-doctor
npm --prefix mobile run audit:production
npm test
```

## Dependência transitiva monitorada

O scaffold oficial do SDK 57 atualmente reporta alertas moderados no pacote `uuid`, trazido pelas ferramentas de configuração do Expo. O `npm audit fix --force` propõe voltar para Expo 46 e, portanto, não deve ser executado. O gate local falha apenas para vulnerabilidades altas/críticas enquanto essa correção depende do upstream do Expo.
