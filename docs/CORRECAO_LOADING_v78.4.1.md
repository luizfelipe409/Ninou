# Correção do loading — Ninou v82.0.0

## Causa encontrada

A camada de microinterações observava mudanças na classe das telas e, ao mesmo tempo, adicionava e removia a própria classe de animação. Isso podia reativar o `MutationObserver` continuamente e impedir o boot de chegar à etapa que oculta o loading.

Além disso, quando um módulo falhava, o painel de erro era inserido fora da tela de loading e acabava ocultado pela própria barreira visual. Para o usuário, o resultado era apenas um loading infinito, sem diagnóstico.

## Correções

- observer de telas reage somente à mudança real do estado `active`;
- observer de modais reage somente à mudança real de visibilidade;
- guarda visual passa a agrupar mutações em um único frame;
- migração inicial não recarrega a página nem cria uma Promise infinita;
- folhas de estilo e camadas complementares não bloqueiam a abertura;
- falhas de boot são mostradas dentro da própria tela de loading;
- watchdog de 15 segundos oferece reparo ou abertura da interface disponível;
- Vercel configurada no próprio `vercel.json` com `npm run build` e saída `dist`.

Nenhuma chave de dados, família, perfil, rotina ou Firebase foi alterada.
