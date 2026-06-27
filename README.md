# Ninou v74.14 — sono manual e local-first

Versão funcional da refatoração v74.

## Principais melhorias

- Soneca, sono noturno e despertar noturno agora podem ter **início e fim** no modal.
- Ao editar um registro de sono, é possível corrigir início e fim sem apagar o histórico.
- O modal mostra a **duração calculada** antes de salvar.
- A janela acordado é recalculada e salva no próprio registro de sono quando existe despertar anterior válido.
- O Diário mostra “Acordado X antes” nos registros de sono.
- O app passa a salvar dados localmente mesmo sem login; Firebase fica como sincronização familiar.

## Deploy

Envie todos os arquivos para o projeto no Vercel e limpe o cache do navegador/PWA após atualizar.


## v74.15

Correção de carregamento: remove duplicidade `async async` no módulo principal e atualiza cache do Service Worker.
