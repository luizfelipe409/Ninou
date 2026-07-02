# v75.43 — Identificação por aparelho

## Objetivo

Permitir que Felipe e Maria usem a mesma conta familiar (`francisco@gmail.com`), mas registrem ações com nomes diferentes em celulares diferentes.

## Regra de produto

- Conta = família / Francisco.
- Identificação = aparelho / cuidador.
- Registro = usa o nome e vínculo salvos naquele celular.

## Exemplo

Celular do Felipe:
- Nome: Felipe
- Vínculo: Pai

Celular da Maria:
- Nome: Maria
- Vínculo: Mãe

Mesmo usando a mesma conta, os registros ficam:

- Registrado por Felipe
- Registrado por Maria

## Observação técnica

A identificação do cuidador é salva apenas no localStorage do aparelho, com chave baseada em `ninou.deviceId`.
Ela não é mais sincronizada para `users/{uid}/account/profile`, evitando que um cuidador sobrescreva o outro.
