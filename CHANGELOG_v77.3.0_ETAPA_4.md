# Ninou v77.3.0 — Etapa 4: limpeza e estabilidade

## Estabilidade de inicialização
- Boot centralizado com bloqueio contra execução duplicada.
- Timeout explícito para módulos, evitando loading infinito em publicação incompleta.
- Limpeza de cache legado executada apenas uma vez, sem desregistrar o Service Worker em toda atualização.
- Reparo completo continua disponível somente quando ocorre uma falha real.

## PWA e cache
- Service Worker atualizado para cache `ninou-v77-3-0-stability-stage4`.
- Navegação usa rede com timeout e fallback offline.
- Arquivos versionados usam cache imutável; recursos estáticos usam stale-while-revalidate.
- Remoção automática apenas de caches antigos do Ninou.

## Diagnóstico e retomada
- Novo módulo `ninou-stability-v77.3.0.mjs`.
- Captura controlada dos últimos erros e rejeições não tratadas no armazenamento local.
- Estado online/offline centralizado.
- Evento `ninou:resume` ao retornar ao app ou restaurar a página pelo iOS.
- Marcas de desempenho para medir o tempo de boot.

## Limpeza e segurança
- Removido `.env.local` do pacote de distribuição.
- Removidos núcleos antigos v76.1.1 e entradas legadas desatualizadas.
- `app.js` e `app.legacy.js` agora apontam para a versão atual.
- Referências, cache e arquivos principais padronizados em v77.3.0.

## Preservado
- Estrutura de dados local e Firebase.
- IDs, listeners e fluxos de registro.
- Regras do Firestore.
- Design e consistência visual das etapas 1, 2 e 3.
