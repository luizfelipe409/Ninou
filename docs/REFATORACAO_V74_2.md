# Ninou v74.2 — Refatoração Parte 2

Esta etapa continua a refatoração iniciada na v74.1, mantendo o comportamento do app e extraindo módulos pequenos e seguros do `js/app.legacy.js`.

## Objetivo

Reduzir o tamanho e a responsabilidade do arquivo principal sem mudar a experiência do usuário.

## O que foi extraído

### `js/config/constants.js`
- Chaves de armazenamento (`storageKeys`)
- Configuração Firebase (`firebaseConfig`)
- Versão do SDK Firebase
- Constantes de tempo (`hour`, `day`)

### `js/utils/time.js`
- Formatação de duração
- Formatação de horário
- Conversão para campos `date` e `datetime-local`
- Cálculo de início do dia
- Rótulos de dia da semana
- Data do diário

### `js/utils/text.js`
- Escape seguro de HTML
- Pluralização simples

### `js/dom/dom.js`
- Atualização segura de texto
- Controle seguro de atributo `hidden`

### `js/domain/record-types.js`
- Ícones dos registros
- Configuração dos tipos de registro
- Helpers de sono e tipo de evento

## Arquivos principais

- `app.js` continua sendo o carregador do aplicativo.
- `js/app.legacy.js` continua concentrando a maior parte da lógica, mas agora importa os módulos extraídos.
- `styles.css` continua sendo o carregador visual.
- `css/app.legacy.css` preserva o CSS estável.

## Validação feita

- `node --check` em `js/app.legacy.js`.
- `node --check` em todos os módulos novos.
- Atualização de cache no `sw.js` para `ninou-v74-2-refactor`.

## Próxima etapa sugerida — v74.3

Extrair a camada de armazenamento e perfil:

- `js/storage/local-store.js`
- `js/domain/baby-profile.js`
- `js/domain/weights.js`
- `js/services/firebase-sync.js`

Essa próxima etapa deve começar a reduzir a complexidade do perfil, peso e sincronização, ainda sem alterar a UX.
