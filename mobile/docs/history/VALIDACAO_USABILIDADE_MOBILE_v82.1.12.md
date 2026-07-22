# Validação — usabilidade mobile Ninou v82.1.12

## Escopo

Correções realizadas somente na pasta `mobile/`, usando como referência o vídeo e as capturas enviados em 21/07/2026.

## Cenários cobertos

1. **Validade encerrada**
   - título curto, sem hifenização indevida;
   - contraste explícito em tema escuro e claro;
   - conteúdo rolável em telas menores;
   - plano, situação, renovação, atendimento e preservação dos dados mantidos.

2. **Exclusão de registro**
   - confirmação em painel inferior;
   - prévia do tipo, horário, duração e detalhe do registro;
   - aviso de sincronização familiar;
   - ações claras: `Remover registro` e `Voltar ao diário`.

3. **Configuração da família**
   - campos declarados fora do componente principal, evitando remontagem e perda de foco a cada letra;
   - gravação inicial agrupada em operação consistente;
   - data de nascimento por calendário nativo;
   - relação com o bebê por seletor moderno, com opção personalizada.

4. **Permissões familiares**
   - Responsável adicional: registra, edita perfil e gerencia convites;
   - Cuidador: registra e corrige a rotina, sem administrar a família;
   - Somente visualização: acompanha rotina e relatórios sem criar, editar ou excluir registros;
   - regras do Firestore verificadas para impedir escrita pelo perfil de visualização.

5. **Primeiro início da rotina**
   - escolha entre bebê acordado ou dormindo;
   - horário real informado na etapa seguinte;
   - retirada do botão genérico duplicado `Começar a partir de agora`;
   - horário selecionado alimenta corretamente o estado inicial da rotina.

## Verificações executadas

- análise sintática de 36 arquivos TypeScript/TSX;
- testes de rotina e permissões familiares;
- teste da política de separação do administrador;
- teste estático específico dos novos fluxos de usabilidade;
- validação estática das versões iOS/Android, permissões e projeto Xcode;
- conferência das referências de estilos nos arquivos modificados;
- comparação por SHA-256 dos arquivos de execução da web com a v82.1.11.

## Limite da validação

O ambiente desta execução não possuía acesso ao registro do npm, portanto não foi possível reinstalar as dependências nem executar o Expo em simulador. A instalação final em iPhone/Android real continua necessária antes de envio às lojas.
