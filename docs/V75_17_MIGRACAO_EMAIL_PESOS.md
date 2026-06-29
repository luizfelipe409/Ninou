# Ninou v75.17 — Migração por e-mail, pesos e status claro

Correções feitas após o vídeo da tela de admin:

- A busca manual agora aceita e-mail antigo, como `francisco@gmail.com`.
- A migração de perfil agora envia `weights` para `families/ninou-family-luizfelipe/profile/main`.
- A tela de administração deixa de voltar imediatamente para “dados encontrados” após uma migração concluída.
- O texto de confirmação informa origem, quantidade de registros/dias, destino e que os dados antigos não são apagados.
- O cabeçalho em modo admin mostra `Painel admin do Ninou` na tela de perfil/admin.

## Caminhos finais

- `families/ninou-family-luizfelipe/profile/main`
- `families/ninou-family-luizfelipe/days/{AAAA-MM-DD}`
- `families/ninou-family-luizfelipe/members/{uid}`
