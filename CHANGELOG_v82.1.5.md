# Ninou v82.1.5 — Admin Web em portal dedicado

- Corrige o painel administrativo web que era montado dentro da tela de perfil do diário familiar.
- Cria `#adminWebPortal` como filho direto de `body`, independente do cabeçalho, telas e menu inferior.
- Usa runtime, serviço, núcleo, boot e CSS com nomes de arquivo próprios da versão 82.1.5 para impedir mistura de módulos em cache.
- Mantém toda a pasta `mobile/` sem alterações.
- Adiciona estados `data-admin-portal-state` e evento `ninou:admin-portal-ready` para validação objetiva da montagem.
