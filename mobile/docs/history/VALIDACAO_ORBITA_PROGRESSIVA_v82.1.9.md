# Validação — órbita progressiva Ninou Mobile v82.1.9

## Cenário principal

Registro concluído:

- início: `19/07/2026 21:34`;
- término: `20/07/2026 02:00`.

A função de composição da órbita foi verificada nos seguintes horários do dia 20:

| Horário atual | Trechos esperados e confirmados |
|---|---|
| `06:43` | `21:34 → 00:00` e `00:00 → 02:00` |
| `21:20` | arco completo, ainda sem recorte |
| `23:15` | `21:34 → 23:15` e `00:00 → 02:00` |
| `23:59` | `21:34 → 23:59` e `00:00 → 02:00` |
| `21/07 00:01` | nenhum trecho herdado |

O trecho `23:15 → 00:00` é o único removido no teste das 23:15.

## Colisões

Também foram testados:

- barra entre `10:00 e 11:00`: não altera o sono herdado;
- barra iniciada às `23:15`: recorta somente a cauda noturna a partir de `23:15`;
- barra iniciada às `01:00`: recorta somente a parte após `01:00` no trecho da madrugada;
- os pontos artificiais de divisão em `00:00` não recebem marcador de início ou fim.

## Verificações executadas

- ESLint/Expo: aprovado.
- TypeScript sem emissão: aprovado.
- Testes de rotina e sincronização: aprovados.
- Testes de política administrativa: aprovados.
- Testes de preparação para App Store: aprovados.
- Versão Expo, Xcode, iOS build e Android versionCode alinhados.

A validação automatizada confirma a lógica e a compilação. O teste final em aparelho físico continua recomendado antes da publicação nas lojas.
