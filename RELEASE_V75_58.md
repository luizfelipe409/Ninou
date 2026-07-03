# Ninou v75.58 — Base multi-família + PWA confiável

Esta versão foi criada em cima da v75.57.6.

## Principais mudanças

- Preparação real para uso por outras famílias.
- Usuário logado sem família pode criar a própria família pelo botão **Criar minha família**.
- Novo espelho de acesso em `users/{uid}/families/{familyId}`, mantendo compatibilidade com `users/{uid}/access/ninou`.
- Registros locais do dia agora usam chave com escopo de família + data:
  - `ninou.demo.dayState.family.<familyId>.2026-07-02`
  - isso evita misturar notas/registros entre famílias ou contas.
- Convites familiares agora também são espelhados em `families/{familyId}/invitations/{code}`.
- Card de sincronização ganhou detalhes de família e último salvamento.
- Novo card de diagnóstico para admin/família conectada:
  - versão do app;
  - usuário logado;
  - familyId atual;
  - modo PWA/navegador;
  - quantidade de dias em cache local.
- PWA/Service Worker melhorado:
  - cache `ninou-v75-58-multifamilia-pwa`;
  - `SKIP_WAITING` por mensagem;
  - aviso visual quando há atualização disponível;
  - `viewport-fit=cover` para melhor compatibilidade com iPhone.
- Regras Firestore atualizadas em `FIRESTORE_RULES_V75_58.rules`.

## Atenção

A versão do app não publica automaticamente as regras Firestore. Para o fluxo multi-família funcionar corretamente, publique manualmente `FIRESTORE_RULES_V75_58.rules` no Firebase Console.

Depois de subir na Vercel, remova o PWA antigo do iPhone e instale novamente para limpar cache antigo.
