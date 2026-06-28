# Ninou v75.17 — Migração por e-mail, pesos e status claro

Versão criada para resolver a confusão vista no fluxo de administração/migração.

## Ajustes principais

- Adicionada busca manual por e-mail antigo, como `francisco@gmail.com`.
- A busca por e-mail consulta `users`, `access` e `profile` para localizar o UID correto.
- A migração agora grava também `weights` em `families/ninou-family-luizfelipe/profile/main`.
- Após clicar em migrar, a tela mostra status de conclusão e não volta imediatamente para o loop de “dados encontrados”.
- O alerta de confirmação ficou mais claro: mostra quantidade de registros, dias, destino e informa que os dados antigos não serão apagados.
- No perfil conectado como admin, o topo passa a mostrar “Painel admin do Ninou” em vez de “Diário do Francisco”.
- Cache atualizado para `ninou-v75-17-migracao-email-pesos`.

## Caminhos finais esperados

- Perfil/foto/pesos: `families/ninou-family-luizfelipe/profile/main`
- Rotina diária: `families/ninou-family-luizfelipe/days/AAAA-MM-DD`
- Membros autorizados: `families/ninou-family-luizfelipe/members/{uid}`

## Regras

Publique as regras em:

`docs/FIRESTORE_RULES_ADMIN_GLOBAL_V75_17.md`

Depois faça hard refresh no navegador ou remova/reinstale o PWA no iPhone.
