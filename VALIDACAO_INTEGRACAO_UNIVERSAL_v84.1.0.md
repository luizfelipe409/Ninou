# Validação — Ninou v84.1.1

## Objetivo

Eliminar divergências de nome, e-mail, opções, menus, wallpapers, efeitos, telas, órbita e registros entre web, iPhone e Android.

## Arquitetura aplicada

A web não possui mais runtime próprio. O comando de build executa:

`expo export --platform web --output-dir dist --clear`

Assim, o mesmo código em `mobile/src` gera web, iOS e Android.

## Fonte de dados única

- Firebase project: `ninou-3c936`
- Auth: Firebase Authentication
- Família ativa: `users/{uid}/access/ninou`
- Perfil: `families/{familyId}/profile/main`
- Rotina: `families/{familyId}/days/{dayId}`
- Membros: `families/{familyId}/members/{uid}`

## Proteções contra divergência

1. Ponteiro canônico de família com autorreparo.
2. Mesma resolução de acesso em todas as plataformas.
3. Perfil e rotina sempre carregados do Firestore.
4. Cache local separado por `familyId`.
5. Atualização ao retornar ao primeiro plano.
6. Runtime web legado, Service Worker legado, `index.html`, `js/` e `styles/` removidos.
7. Regras antigas de escrita em `profile` e `days` mantidas apenas para leitura/migração; novas gravações usam os caminhos canônicos.

## Testes executados

- Arquitetura universal: aprovado.
- Estrutura universal: aprovada.
- Contratos TypeScript: aprovados.
- Paridade universal de dados, menus e órbita: aprovada.
- Sincronização de rotina e permissões: aprovada.
- Separação de admin e famílias: aprovada.
- Fluxos UX mobile/universal: aprovados.
- Prontidão App Store por inspeção de configuração: aprovada.

## Observação

O build Expo completo deve ser executado após `npm ci`, pois as dependências não são incluídas no ZIP limpo.
