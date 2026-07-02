# Ninou v75.41.1 — Simulação de 2 celulares

Esta revisão mantém a v75.41 como base e adiciona proteção para uso simultâneo.

## Ajuste principal

Ao salvar a rotina no Firestore, o app agora busca o estado atual do dia na nuvem e mescla os eventos por `id` antes de gravar. Isso reduz o risco de um celular sobrescrever o registro recém-criado pelo outro quando Felipe e Maria registram ações quase ao mesmo tempo.

## Identificação nos registros

- A identidade continua sendo por conta.
- Maria salva `Maria/Mãe` e os próximos registros aparecem como `Registrado por Maria`.
- Felipe salva `Felipe/Pai` e os próximos registros aparecem como `Registrado por Felipe`.
- O bebê não aparece como autor.
- `undefined` e `null` são filtrados na exibição.

## Avatar

A versão continua somente com avatar. Fotos antigas não aparecem na interface.
