# Ninou v75.13 — Recuperação inteligente de dados

Esta versão foi criada para recuperar dados antigos que ficaram em `users/{uid}/activities`, `users/{uid}/days` ou `users/{uid}/profile` e migrar tudo para a família principal `families/ninou-family-luizfelipe`.

## Principais ajustes

- Admin global vê um painel focado em administração/migração, não a rotina completa do app.
- O painel **Dados da família** agora busca dados no Firebase, não apenas no cache do aparelho.
- Migra perfil, foto, janela de despertar, pesos e registros antigos.
- Converte registros de `activities` para `families/{familyId}/days/{dayId}`.
- Registra uma trilha em `families/{familyId}/migrations`.
- Mantém convites e membros da família.

## Depois de subir

1. Publique as regras do arquivo `docs/FIRESTORE_RULES_ADMIN_GLOBAL_V75_13.md`.
2. Entre como `luizfelipe.dasilva@gmail.com`.
3. Abra Perfil > Administração do Ninou > Dados da família.
4. Toque em **Migrar dados encontrados**.
5. Entre com a conta `francisco@gmail.com` para validar.
