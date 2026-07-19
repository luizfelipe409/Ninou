# Ninou v82.1.0 — Mobile como referência, também no Web App

## Paridade do web app

- Os fluxos e regras desta versão mobile foram espelhados no web app.
- O layout diário mantém a linguagem visual mobile e ganha espaço apenas onde a tela maior melhora a leitura.
- O Centro de Operação web substitui integralmente o painel administrativo legado.
- Cache do PWA, módulos de runtime, diagnóstico, legal e suporte foram promovidos para a versão 82.1.0.
- O build de produção inclui o novo serviço administrativo web.

## Painel administrativo

- O admin global entra diretamente no Centro de Operação, sem família pessoal.
- A família técnica `ninou-family-luizfelipe` e documentos equivalentes de suporte interno são sempre ocultados da carteira de clientes.
- Visão executiva com famílias, usuários, convites, suporte, testes próximos do fim e alertas de sincronização.
- Cadastro de família cliente com perfil inicial, plano e convite opcional para o responsável.
- Busca e filtros de famílias, detalhe completo, estados ativa/suspensa/arquivada e exportação JSON.
- Gestão de plano de teste, Premium, cortesia ou suspenso, com prazo configurável.
- Gestão de membros, papéis, bloqueios e transferência do responsável principal.
- Gestão e compartilhamento de convites, incluindo renovação e cancelamento.
- Rotina recente disponível ao suporte em modo somente leitura.
- Diagnóstico de integridade para família sem responsável, perfil incompleto, membro duplicado, convite expirado e ausência de sincronização.
- Fila de suporte, privacidade e exclusão de dados com status e notas internas.
- Trilha de auditoria global e por família; ações sensíveis exigem justificativa.
- Sessão administrativa protegida com expiração automática após 30 minutos.

## Acesso e segurança

- Contas bloqueadas no painel passam a ver uma tela de acesso suspenso e não entram na família.
- O e-mail global `luizfelipe.dasilva@gmail.com` continua independente de vínculos familiares.

## Correções incluídas

- Sonecas encerradas no dia anterior deixam de competir com a órbita do dia atual.
- Sonecas que atravessam meia-noite aparecem no dia atual somente no trecho entre 00:00 e o horário de término.
- Confirmação de evento do cuidador renovada com visual moderno.
- Erro de e-mail ou senha permanece na tela de login e mostra a mensagem correta.
