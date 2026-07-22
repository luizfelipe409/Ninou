# Validação — Ninou Mobile v82.1.6

## Executado com sucesso

- `npm ci`: 918 pacotes instalados a partir do lockfile.
- `npm run lint`: aprovado.
- `npm run typecheck`: aprovado.
- testes de sincronização e política administrativa: aprovados.
- `npm run test:store`: aprovado.
- `expo config --type introspect --json`: configuração nativa gerada e inspecionada.
- exportação do bundle iOS pelo Metro: aprovada, 1.339 módulos e bundle Hermes gerado.
- `npm audit --omit=dev --audit-level=high`: nenhuma vulnerabilidade alta ou crítica; 13 avisos moderados em dependências de ferramentas Expo/Xcode.

## Confirmações objetivas

- iOS sem `NSMicrophoneUsageDescription`.
- Android gera `RECORD_AUDIO` com `tools:node="remove"`.
- reprodução em segundo plano preservada.
- versão de aplicativo `82.1.6` alinhada no Expo, pacote e Xcode.
- build local de referência `84` alinhado no Expo e Xcode.
- ícone-fonte confirmado em 1024 × 1024.
- Privacy Manifest presente no projeto iOS e no app config.
- fluxo de exclusão registra `data_deletion_request`, muda a conta para `deletion_requested` e impede novo acesso enquanto a solicitação está em processamento.

## Limites desta validação

O ambiente não contém Xcode nem credenciais Apple, portanto não foi possível gerar ou assinar um IPA real. A validação final ainda deve ser feita por um build EAS de produção e instalação pelo TestFlight em iPhone físico.

O `expo-doctor` executou 18 de 20 verificações. As duas restantes dependiam de acesso online às APIs do Expo/React Native Directory e falharam por indisponibilidade de rede do ambiente, não por erro encontrado no projeto.
