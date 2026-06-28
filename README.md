# Ninou v75.20 — Gráficos familiares e pesos migrados

Esta versão mantém os avanços da v75.19 e corrige o comportamento visto no vídeo: os dados migrados existiam em dias específicos, mas os gráficos e resumos ainda olhavam quase sempre apenas para o dia aberto no diário.

## Novo na v75.20

- Gráficos de "últimos 7 dias" agora usam todos os dias carregados de `families/ninou-family-luizfelipe/days`, não apenas a data selecionada.
- Relatório de sono, mamadeira, fraldas e medicamentos passa a considerar os dias migrados em conjunto.
- Card de quantidade de ações dos últimos dias usa o cache familiar completo.
- Ao listar `families/{familyId}/days`, o app guarda também o conteúdo de cada dia para alimentar gráficos e médias.
- Peso do bebê agora busca formatos antigos adicionais: `weights`, `weightHistory`, `pesos`, `babyWeights`, mapas por data e coleções `users/{uid}/weights` ou `users/{uid}/pesos`.
- Perfil em nuvem com pesos/foto não é mais ignorado apenas porque o cache local tem uma versão mais nova sem pesos.
- Regras Firestore v75.20 adicionadas para leitura/admin de `weights` e `pesos` legados.

## Mantido das versões anteriores

- Migração por e-mail e UID.
- Cópia de perfil, foto, pesos e rotina para `families/ninou-family-luizfelipe`.
- Vinculação da conta migrada em `families/{familyId}/members/{uid}` e `users/{uid}/access/ninou`.
- Leitura dos dias migrados pelo calendário/último dia com dados.
- Admin responsivo, sem tela partida/zoomada no mobile.

## Depois de publicar

1. Publique as regras em `docs/FIRESTORE_RULES_ADMIN_GLOBAL_V75_20.md`.
2. Suba esta versão no Vercel.
3. Entre como admin e faça a busca/migração novamente por `francisco@gmail.com`.
4. No iPhone, atualize o PWA ou remova/adicone novamente à tela inicial para garantir que o cache antigo saia.
