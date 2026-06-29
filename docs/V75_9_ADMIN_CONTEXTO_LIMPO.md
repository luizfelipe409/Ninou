# v75.9 - Admin com contexto limpo

Esta versão corrige o comportamento em que, ao trocar de conta no mesmo aparelho, o Ninou ainda podia exibir foto, nome do bebê e dados da conta anterior.

## O que mudou

- O app identifica o dono visual dos dados locais por e-mail.
- Ao trocar de conta, os dados visíveis são zerados ou restaurados apenas do cache daquele e-mail.
- Ao sair da conta, a tela volta para modo visitante sem exibir dados privados.
- O admin global não precisa de convite e não herda dados da conta anterior.
- A família principal do admin só recebe perfil/rotina local se esses dados realmente estiverem no contexto do admin.
- O painel Administração do App recebeu espaçamentos mais limpos para iPhone.

## Observação

As regras do Firestore da v75.8 continuam válidas para criação e aceite de convites.
