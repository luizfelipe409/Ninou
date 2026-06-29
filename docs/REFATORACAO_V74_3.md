# Ninou v74.3 — Refatoração Parte 3

Esta etapa continua a refatoração controlada da arquitetura, sem mudar propositalmente o comportamento visual ou funcional do app.

## Objetivo da Parte 3

Separar responsabilidades ligadas a persistência, perfil, pesos e Firebase, que antes estavam concentradas no `js/app.legacy.js`.

## Novos módulos criados

### `js/storage/local-storage.js`
Centraliza operações seguras com `localStorage`:

- leitura de texto;
- leitura numérica;
- leitura JSON;
- escrita de texto;
- escrita JSON;
- remoção de múltiplas chaves;
- escrita segura com fallback.

### `js/domain/weights.js`
Centraliza a regra de pesos do bebê:

- normalização do histórico;
- persistência local;
- cadastro/edição por data;
- exclusão por ID;
- ordenação do histórico mais recente primeiro.

### `js/domain/baby-profile.js`
Centraliza as regras do perfil:

- perfil padrão;
- normalização de nome, artigo, nascimento, tema e pesos;
- leitura do perfil salvo;
- gravação do perfil;
- verificação de conteúdo local/nuvem;
- versão de perfil sincronizável.

### `js/services/firebase-service.js`
Centraliza o carregamento dinâmico do Firebase:

- Firebase App;
- Firebase Auth;
- Firestore;
- mensagens de erro amigáveis.

## Alterações no app legado

O `js/app.legacy.js` agora passa a usar esses módulos para:

- carregar e salvar perfil;
- normalizar pesos;
- salvar/editar/excluir pesos;
- carregar Firebase;
- traduzir erros do Firebase.

As funções antigas foram mantidas como camada de compatibilidade interna, mas agora delegam para os módulos novos. Isso reduz risco de regressão e permite continuar a separação por partes.

## Cache/PWA

O `sw.js` foi atualizado para o cache `ninou-v74-3-refactor` e agora inclui os novos módulos.

## Validação

Sintaxe validada com:

```bash
node --check app.js
node --check js/app.legacy.js
node --check js/storage/local-storage.js
node --check js/domain/weights.js
node --check js/domain/baby-profile.js
node --check js/services/firebase-service.js
```

## Próxima etapa sugerida — v74.4

Separar lógica de eventos e diário:

- normalização de eventos;
- criação/edição/exclusão de registros;
- filtros do diário;
- formatação de cards;
- regras específicas de sono, amamentação, mamadeira, fralda e medicamento.
