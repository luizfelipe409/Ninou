# Validação mobile — Ninou 83.0.2

## Cenários validados por testes de domínio

- Primeiro despertar registrado separadamente do estado atual.
- Estado atual acordado pode iniciar depois do primeiro despertar.
- Estado atual dormindo pode iniciar depois do primeiro despertar.
- Sono iniciado menos de 2 minutos após acordar é bloqueado.
- Despertar iniciado menos de 2 minutos após dormir é bloqueado.
- Um segundo início de sono enquanto o bebê já está dormindo não altera o estado.
- Um novo despertar enquanto o bebê já está acordado não cria registro duplicado.
- Sono manual inferior a 2 minutos não é persistido.
- Três marcadores próximos são agrupados e recebem contagem.
- Agrupamentos não crescem por encadeamento além da janela visual.
- Marcadores próximos de 23:59 e 00:00 são tratados como vizinhos na órbita.

## Verificações de código

- `npm run test:source`: aprovado.
- Sintaxe TypeScript/TSX dos seis arquivos funcionais modificados: aprovada com TypeScript `transpileModule`.
- Configuração de versão, permissões e ícone para lojas: aprovada pelos testes de fonte.
- Nenhum `node_modules`, `.env`, credencial ou artefato temporário incluído.
- Lógica da aplicação web comparada com a base 83.0.0: sem alterações funcionais; somente versão e cache foram alinhados para 83.0.2.

## Limitação da validação

As dependências não puderam ser reinstaladas neste ambiente. Portanto, `expo lint`, `tsc --noEmit`, `expo config --type introspect` e a instalação física no iPhone ainda precisam ser executados no ambiente de desenvolvimento antes do TestFlight.
