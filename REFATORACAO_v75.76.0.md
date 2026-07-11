# Ninou v75.76.0 — refatoração estrutural

## Objetivo
Eliminar código morto e camadas antigas que disputavam a interface, mantendo o visual verde premium e a lógica familiar existente.

## Alterações principais

### Navegação inferior
- Removidos 135 seletores antigos relacionados a `.bottom-nav`, `.bottom-bar` e `.fab`.
- Removidos 59 blocos CSS antigos de navegação.
- Criada uma única implementação canônica da barra inferior.
- A barra, os cinco atalhos e o botão `+` agora pertencem ao mesmo componente.
- A barra é escondida durante a abertura do registro e o botão `+` desaparece na tela Perfil.
- Mantido tratamento específico para telas pequenas e painel administrativo no desktop.

### CSS
- `css/logged-premium.css` foi incorporado ao `styles.css` e removido.
- O projeto agora carrega uma única folha de estilos.
- Removidas 306 alternativas de seletores referentes a classes ou IDs inexistentes.
- Removidas definições duplicadas de animações.
- Consolidados blocos duplicados seguros, sem alterar a cascata funcional.
- Nenhuma regra antiga de navegação existe antes da seção canônica final.

### JavaScript
- `js/app.legacy.js` foi renomeado para `js/app.js`.
- O carregador raiz `app.js`, que duplicava o carregamento, foi removido.
- Removido o código do card `activeTimerCard`, inexistente no HTML.
- Removidos wrappers, funções, variáveis e imports sem consumidor.
- Removida a cadeia antiga de migração que ficou órfã.
- Removido o suporte morto a foto de perfil, já substituído pelos avatares ilustrados.
- Removidos os módulos órfãos:
  - `js/ui/account.js`
  - `js/services/account-service.js`
  - `js/services/export-service.js`
- A auditoria de código não encontrou imports, variáveis, funções ou parâmetros abandonados.

### Segurança e pacote
- `.env.local` foi retirado do ZIP. Ele continha um token local da Vercel e não deve ser distribuído.
- O `.gitignore` continua bloqueando `.env*`.
- Arquivos históricos de revisão e changelogs antigos foram retirados do pacote de produção.
- O Service Worker foi atualizado para o cache `ninou-v75-76-0-refactor-canonico`.
- Todas as referências aos arquivos removidos foram eliminadas do cache e do HTML.

## Antes e depois

| Item | Antes | Depois |
|---|---:|---:|
| Arquivos no pacote | 259 | 63, incluindo este relatório |
| Folhas CSS carregadas | 2 | 1 |
| Linhas de CSS | 31.289 | 28.501 |
| Arquivo JS principal | 622.620 bytes | 607.914 bytes |
| Linhas do JS principal | 14.649 | 14.243 |
| Módulos JS de runtime | 34 + carregador | 30 |
| Barras inferiores no HTML | 1 | 1 |
| Implementações CSS da barra | várias camadas | 1 canônica |

## Validações realizadas
- Sintaxe de todos os módulos JavaScript com `node --check`.
- Parse integral do CSS com PostCSS.
- Integridade de todos os imports locais.
- Integridade dos arquivos listados no Service Worker.
- Ausência de módulos órfãos.
- Ausência de IDs duplicados no HTML.
- Ausência de referências a `app.legacy.js` e `logged-premium.css` no runtime.
- Ausência de `.env.local` no pacote.
- Auditoria `noUnusedLocals/noUnusedParameters`: sem ocorrências de código abandonado.

## Publicação
Ao substituir a versão publicada, faça um novo deploy completo. O nome de cache foi alterado para descartar a camada antiga do PWA. Em um aparelho que permaneça com a interface anterior, feche o app instalado, abra novamente e aceite a atualização quando o aviso aparecer.

## Observação de teste
A validação realizada neste ambiente foi estrutural e estática. O navegador gráfico do ambiente bloqueou a execução local do projeto; por isso, o smoke test visual final deve ser feito no endereço publicado, principalmente em 320–430 px e no painel administrativo do desktop.
