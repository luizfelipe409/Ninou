# Validação — Ninou Mobile v82.1.8

## Caso reproduzido

Cenário automatizado com horário local:

- início: `18/07/2026 20:30`;
- término informado: `02:30`;
- término resolvido: `19/07/2026 02:30`;
- duração esperada e confirmada: `6 horas`.

O teste confirma que o registro fica concluído e que nenhum timer aberto ou evento de duração zero é criado.

## Órbita

Foram verificados por teste automatizado:

- arco herdado visível em `19/07 às 15:00`;
- arco ainda visível em `19/07 às 23:59`;
- arco removido em `20/07 às 00:01`;
- ação entre `10:00 e 11:00` não remove o arco herdado;
- barra entre `20:40 e 21:10`, que ocupa o mesmo trecho visual, remove o arco herdado;
- o resumo do dia 19 contabiliza somente o trecho de `00:00 a 02:30`, totalizando `2h30` de sono naquele dia.

## Verificações executadas

- ESLint/Expo: aprovado.
- TypeScript sem emissão: aprovado.
- Testes de rotina e sincronização: aprovados.
- Testes de separação administrativa: aprovados.
- Testes de preparação para App Store: aprovados.
- Testes e build da aplicação web: aprovados.
- Comparação SHA-256 dos 226 arquivos de execução web com a v82.1.7: sem diferenças.

A validação cobre a lógica, persistência e compilação estática. Não substitui a instalação do build em um iPhone ou Android físico antes da publicação nas lojas.
