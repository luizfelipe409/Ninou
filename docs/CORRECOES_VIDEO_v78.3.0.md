# Correções baseadas na gravação — Ninou v78.3.0

A versão foi revisada diretamente a partir da gravação de 13/07/2026.

## Falhas observadas e correções

- **Órbita desmontada ao voltar ao Safari:** criada uma estrutura visual de segurança que mantém SVG, centro, horários e relógio posicionados mesmo durante a restauração da sessão.
- **Francisco substituído temporariamente por “Bebê”:** a mesma conta não limpa mais perfil e rotina quando o Firebase reconfirma a autenticação.
- **Tela comercial aparecendo para conta conectada:** o conteúdo de visitante só pode ser renderizado após a autenticação ser resolvida e apenas quando não existir usuário conectado.
- **Loading ausente:** a tela de carregamento começa no `<head>`, permanece por no mínimo 1,5 segundo e pode reaparecer de forma controlada ao voltar do segundo plano.
- **Atalhos com ícones cortados:** os quatro atalhos agora possuem um contêiner canônico, ícones em posição estática e dimensões iguais dentro dos cards.
- **Barra inferior cobrindo o conteúdo:** ampliado o espaço inferior rolável e a margem segura da tela ativa.
- **Tipos de registro cortados:** a faixa exibe quatro opções completas por vez e permite rolagem horizontal com encaixe.
- **Rodapé do formulário cobrindo campos:** o formulário ganhou espaço inferior e o rodapé fixo não captura toques fora dos botões.
- **Falha temporária de rede:** os dados locais da mesma conta permanecem visíveis enquanto a sincronização tenta se recuperar.

## Proteção de dados

A atualização não altera as chaves existentes, o formato dos registros, a estrutura familiar nem as regras do Firestore.
