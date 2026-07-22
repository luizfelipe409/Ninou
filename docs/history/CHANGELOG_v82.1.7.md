# Ninou v82.1.7 — Web pronta para famílias adquirentes

## Entrada e ativação

- Cadastro público livre substituído por ativação mediante código enviado após a aquisição.
- Usuários existentes continuam entrando normalmente com e-mail e senha.
- Recuperação de senha adicionada ao fluxo web.
- Atalho de atendimento abre o WhatsApp oficial do Ninou.
- Instalação PWA disponível, com instrução específica para Safari/iPhone quando necessário.

## Controle comercial

- O painel administrativo cria a família cliente com e-mail do responsável, plano e validade.
- Planos suportados: teste, premium, cortesia e suspenso.
- A mensagem de ativação é preparada com endereço, e-mail e código da família.
- Famílias vencidas ou suspensas veem uma tela clara de renovação; os dados permanecem preservados.
- Falha temporária de rede não bloqueia uma família que já estava autorizada no aparelho.
- Famílias antigas sem metadados comerciais continuam compatíveis.

## Segurança, privacidade e suporte

- Páginas públicas de Política de Privacidade, Termos de Uso e Suporte.
- Solicitação de exclusão disponível ao responsável e ao administrador familiar.
- Arquivos locais de ambiente e vínculo privado da Vercel não fazem parte do pacote.
- Cabeçalhos de segurança reforçados no `vercel.json`.
- Textos de beta e opções técnicas foram removidos da experiência do cliente.

## Compatibilidade

- Painel administrativo web preservado.
- Aplicação mobile v82.1.6 preservada sem alterações.
- Famílias existentes continuam acessíveis.
