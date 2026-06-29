# Refatoração v74.9 — Parte 9

## Foco

Esta etapa separa a lógica de perfil visual, tema, foto do bebê, formulário do perfil e histórico de pesos do `js/app.legacy.js`.

A mudança continua conservadora: o `js/app.legacy.js` ainda orquestra a aplicação, mas regras e renderizações do perfil passaram para módulos próprios.

## Arquivos adicionados

### `js/ui/profile.js`

Centraliza:

- nome de exibição do bebê;
- título do diário;
- cálculo do texto de idade;
- renderização da identidade do bebê;
- sincronização do formulário de perfil;
- renderização dos últimos pesos;
- leitura e limpeza do formulário de peso;
- hidratação do formulário ao editar peso;
- aplicação da foto nos avatares;
- redimensionamento da foto do perfil.

### `js/ui/theme.js`

Centraliza:

- leitura segura do tema escolhido;
- decisão entre tema claro e escuro;
- aplicação da classe `day-theme` no `body`;
- normalização da escolha Automático/Claro/Escuro.

## Arquivos atualizados

- `js/app.legacy.js`
- `app.js`
- `styles.css`
- `index.html`
- `sw.js`
- `README.md`

## O que foi preservado

- perfil do bebê;
- artigo `do/da`;
- nascimento e idade;
- tema Automático/Claro/Escuro;
- foto do bebê;
- cadastro, edição e exclusão de pesos;
- sincronização do perfil com Firebase;
- cache PWA com os novos módulos.

## Próxima etapa sugerida

A v74.10 deve separar a camada de áudio/sons, deixando `js/app.legacy.js` mais limpo e preparando a base para futuras melhorias no player.
