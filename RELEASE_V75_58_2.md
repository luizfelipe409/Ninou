# Ninou v75.58.2 — Rotina estável + Observações por dia + Avatar

Base: v75.58.1.

Correções principais:

- Corrigida herança de Observações do dia entre datas.
- Cache local passa por sanitização rígida por família + dia.
- Estados históricos não mantêm cronômetro vivo de acordado/soneca.
- Edição de Acordou/Soneca recalcula a rotina do dia.
- Exclusão remove o registro ativo e respeita `deletedEventIds` no merge local/nuvem.
- Avatar do bebê volta a permitir alterar cabelo, cor, pele e fundo.
- Tema claro/escuro agora salva e re-renderiza o card familiar com mais consistência.

Versão:

- `NINOU_APP_VERSION = 75.58.2`
- Cache PWA: `ninou-v75-58-2-rotina-notas-avatar`

Regras Firestore:

- Continuam sendo as regras da v75.58.
- Não é obrigatório publicar nova regra para esta correção.
