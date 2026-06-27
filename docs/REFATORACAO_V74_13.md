# v74.13 — Consolidação funcional

Esta etapa interrompe a separação puramente estrutural e entrega melhorias funcionais de maior impacto para o Ninou.

## O que mudou

### 1. Registro Acordou

- Adicionado ao `typeConfig`.
- Adicionado ao modal de novo registro.
- Aparece no Diário, últimos registros e linha do tempo.
- Entra no filtro Sono junto de soneca, noite e despertar noturno.

### 2. Timer de sono mais confiável

Antes, o texto “Ficou acordado X antes de dormir” usava o tempo decorrido do sono ativo, o que gerava valores incorretos.

Agora, ao iniciar o sono, o app salva:

- `lastWakeWindowStartedAt`
- `lastWakeWindowMs`

A interface usa esse valor salvo, deixando a informação estável e confiável.

### 3. Finalização do sono

Ao tocar em **Acordou** enquanto o bebê está dormindo, o app:

1. fecha o sono ativo;
2. cria o registro de soneca/noite;
3. cria um registro **Acordou** no mesmo horário;
4. inicia o estado acordado a partir desse horário.

### 4. Edição manual

O tipo **Acordou** pode ser criado manualmente pelo modal quando os pais esquecerem de registrar.

Se o horário manual for no dia atual, o app também atualiza o estado ativo para acordado, quando fizer sentido.

### 5. Sono e despertar

As opções foram revisadas:

- Soneca: local da soneca.
- Sono noturno: local para dormir.
- Despertar noturno: motivo do despertar.

### 6. Amamentação mista

Quando o timer registra os dois lados, o detalhe passa a ser salvo como:

`Mista • E 00:00 • D 00:00 • Total 00:00`

Isso melhora a leitura do Diário e prepara os relatórios futuros.
