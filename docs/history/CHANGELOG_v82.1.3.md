# Ninou 82.1.3

## Painel administrativo funcional

- Corrigida a área segura do cabeçalho mobile e ampliado o alvo de toque do botão de retorno.
- “Assinatura e entitlement” foi substituído por “Assinatura e acesso”, com plano atual, validade e dias restantes.
- A validade configurada pelo admin passa a aparecer no perfil da pessoa conectada, no mobile e no webapp.
- Papéis legados como `responsavel` agora são reconhecidos como responsável principal.
- A transferência de responsabilidade atualiza os vínculos da família, da conta e do acesso legado.
- Famílias com responsável antigo, mas sem `ownerUid`, exibem a ação explícita “Consolidar vínculo”.
- Confirmações administrativas já abrem com motivo auditável e mostram sucesso ou erro dentro da própria tela.
- Convites aceitos deixaram de exibir a ação incoerente de cancelamento.
- A rotina sincronizada agora permite abrir cada dia e conferir tipo e horário dos registros reais.
- A integridade verifica responsável, membros, perfil, convites, rotina e validade, exibindo o resultado na tela e na auditoria.
- Adicionado cenário funcional de navegador para os fluxos críticos do detalhe da família.
