# Ninou v75.56.7.4 — refinamento final geral premium

## Novidades v75.56.7.4

- Home com visual mais editorial, clean e parecido com app mobile premium.
- Relógio principal mais claro, com menos ruído visual e ação principal logo abaixo.
- Botões de ação com espaçamento refinado entre ícone e texto.
- Perfil redesenhado como hero card premium, com avatar em destaque e menos texto.
- Coleção de 12 avatares premium mantida, agora com grade mais nobre, cards maiores e estado selecionado mais claro.
- Barra inferior refinada com aparência mais nativa, translúcida e confortável para toque.
- Tema visual mais claro, adulto e luxuoso, mantendo a delicadeza do Ninou.
- Service Worker atualizado para v75.56.7.4 e registro com `updateViaCache: "none"`.
- Mantidas as travas offline, identificação por aparelho, ausência de foto real e biblioteca local de avatares.

---

# Ninou v75.56.7.4.1.1 — Somente avatar

Versão criada para testar avatares antes de substituir definitivamente a foto do bebê.

## Novidades v75.56.7.4.1

- Nova seção no Perfil: **Escolha o avatar do bebê**.
- Avatar personalizável por:
  - Ícone
  - Cor
  - Fundo
  - Acessório
- Muitas opções visuais para teste:
  - Ursinho, lua, nuvem, bebê, mamadeira, coração, estrela, balão, patinho, carrinho, arco-íris e chupeta.
  - Cores pastel.
  - Fundos lisos, estrelas, nuvens, corações, bolinhas e noite.
  - Acessórios como laço, touca, chupeta, estrela, coroa e brilhos.
- O avatar é salvo como configuração leve no perfil, sem usar imagem pesada.
- Ao salvar avatar, o app remove a dependência de nova foto/base64 no perfil do bebê.
- A foto continua opcional e compatível com dados antigos, mas o fluxo principal agora é avatar.
- Não usa Firebase Storage.
- Não altera a barra inferior.

## Mantido da v75.39.1

- Áudios comprimidos.
- MP3s fora do cache inicial.
- Cache de áudio sob demanda.
- Diário revisado.
- Identificação automática do responsável nos registros.

## Observação

Esta versão é uma versão de teste visual. A ideia é validar com usuários se o avatar personalizável substitui bem a foto real do bebê antes de tornar essa mudança definitiva.


## Novidades v75.56.7.4.1

- O app passa a usar somente avatar para representar o bebê.
- Upload de foto e fotos antigas deixam de ser exibidos.
- Dados antigos de foto são ignorados e substituídos visualmente pelo avatar.
- O painel admin passa a mostrar avatares visuais diferentes por família, membro, usuário conhecido e admin.
- Não usa Firebase Storage e não salva imagem/base64 como fluxo principal.


## v75.56.7.4.1 — Admin online estável

- Corrige o status visual do admin global para não aparecer como "Off-line" após login.
- Falhas pontuais de leitura/escrita no Firestore agora viram aviso no painel, sem rebaixar o admin para visitante.
- Mantém o avatar limpo: somente rostinhos infantis e cor de fundo.
- Mantém isolamento de conta e evita reaproveitar identificação de outro usuário.


## v75.56.7.4.1 — Identificação por aparelho

Esta versão ajusta o uso familiar real do Ninou:

- Felipe e Maria podem usar a mesma conta `francisco@gmail.com`.
- A identificação do cuidador é salva localmente por aparelho, não na conta global.
- O celular do Felipe pode registrar como Felipe/Pai.
- O celular da Maria pode registrar como Maria/Mãe.
- Novos registros salvam `createdByDeviceId`, `createdByName` e `createdByRelationship`.
- A tela agora informa que a identificação fica salva neste celular.
- O app não grava mais essa identificação em `users/{uid}/account/profile`, evitando que um aparelho sobrescreva o outro.


## v75.56.7.4.1 — Avatar 3D Soft moderno

- Avatares do bebê redesenhados em estilo 3D Soft, com aparência mais novinha e moderna.
- Personalização agora foca em cabelinho, tom de pele e cor de fundo.
- Depois de salvar, o editor some da tela e só reaparece ao tocar em **Editar avatar** abaixo da foto do perfil.


## v75.56.7.4.1 — menino, menina e cores de cabelo

- Melhora os cabelos dos avatares.
- Adiciona opções de **menino** e **menina**.
- Adiciona mais de uma **cor de cabelo**.
- Mantém edição sob demanda: depois de salvar, o editor some e volta só no botão **Editar avatar**.


## v75.56.7.4.1 — Correções de UX offline, ação principal e avatar

- Modo offline bloqueia edição de avatar, peso, perfil e registros.
- Sem login, a única interação é preencher login/senha ou tocar em Solicitar acesso.
- Botão Acordou/Iniciar soneca fica abaixo do quadro do relógio principal.
- Adicionado respiro visual entre ícone e texto do botão.
- Corrigido tempo acordado absurdo em estado offline/cache antigo.
- Cabelos dos avatares foram redesenhados com formas mais naturais.


## v75.56.7.4.1 — Avatares premium 3D

- Novo conjunto de avatares com aparência mais delicada e realista.
- Estilos de menino e menina inspirados no mock aprovado.
- Cabelo com desenho mais natural.
- Mantidas opções de cor de cabelo, tom de pele e fundo.
- Continuidade das regras de bloqueio offline da v75.46.


## v75.56.7.4.1 — Correção de carregamento

- Corrige erro que podia impedir o app de carregar por referência antiga ao botão de peso.
- Mantém o fallback de erro em tema claro para não abrir a tela preta.
- Mantém os avatares premium da v75.56.7.4.1.


## v75.56.7.4.1 — Avatares premium baseados na análise

- Redesenho do sistema de avatar com proporção mais jovem: cabeça maior, bochechas cheias, olhos mais baixos e boca menor.
- Cabelos refeitos com massa base, sombra, mechas e highlights suaves para evitar aparência de “capacete”.
- 8 penteados, 8 cores de cabelo, 6 tons de pele e 8 fundos suaves.
- Mantém SVG dinâmico leve, sem foto real e sem Firebase Storage.
- Mantém editor escondido após salvar e bloqueado no modo offline.


## v75.56.7.4 — Correção dos cabelos

- Corrige o encaixe dos cabelos dentro da cabeça do avatar.
- Redesenha os penteados com formas mais contidas e naturais.
- Aplica clip interno no topo da cabeça para impedir cabelo escapando para fora.


## v75.56.7.4 — Avatares premium detalhados

- Refinamento completo do acabamento 3D Soft.
- Cabelos redesenhados com melhor massa, brilho e encaixe.
- Rostos mais suaves, delicados e coerentes com bebê novinho.
- Polimento visual do editor para aparência mais premium.


## v75.56.7.4 — referência aprovada

- Consolida o visual premium aprovado para os avatares.
- Mantém o estilo 3D Soft detalhado.
- Organiza a interface do editor em linha com o mock aprovado.


## v75.56.7.4 — Refinamento fino

- Ajusta os avatares para uma proporção mais infantil.
- Olhos mais suaves e delicados.
- Cabeça levemente maior e corpo mais discreto.
- Mantém o visual premium 3D Soft aprovado.


## v75.56.7.4 — Foco 1: cabelos mais realistas

- Etapa dedicada a melhorar os cabelos dos avatares.
- Penteados redesenhados com melhor massa, mechas e brilho.
- Menos efeito de “capacete” e mais naturalidade visual.
- As próximas etapas previstas continuam sendo: 2) rosto mais bebê recém-nascido; 3) polimento geral do editor.


## v75.56.7.4 — Etapa 2: rosto mais bebê recém-nascido

- Cabeça levemente maior e corpo mais discreto.
- Olhos mais suaves e proporcionais.
- Nariz menor e mais sutil.
- Bochechas mais cheias.
- Boca menor, expressão mais delicada e infantil.
- Próxima etapa prevista: polimento geral do editor.


## v75.56.7.4 — Etapa 3: polimento geral do editor

- Visual do editor reorganizado e mais premium.
- Cabeçalho, prévia, seções e ações mais elegantes.
- Cards, botões e swatches refinados para uso melhor no celular.
- Fecha a trilha pedida: 1) cabelos; 2) rosto mais bebê; 3) polimento geral.


## v75.56.7.4 — cabelos reconstruídos com cuidado

- Descartei os penteados anteriores.
- Reconstruí do zero a base do cabelo com foco em eixo central e melhor simetria.
- Esta versão trabalha com 3 penteados-base: Topetinho suave, Franjinha natural e Cachinhos fofos.
- Mantive as opções de cor de cabelo, pele e fundo.
- O objetivo foi trocar quantidade por qualidade e corrigir o problema de cabelo torto.


## v75.56.7.4 — ajuste de proporção

- Cabeça reduzida.
- Cabelo com mais presença visual.
- Melhor equilíbrio entre rosto, cabelo e corpo.
- Mantidos os 3 penteados-base da reconstrução.


## v75.56.7.4 — biblioteca local com 12 avatares ilustrados premium

- Substitui o avatar procedural por 12 avatares ilustrados prontos.
- Biblioteca local no app, sem foto real e sem depender de storage.
- Diversidade visual com menino, menina, diferentes tons de pele, cores de cabelo e acessórios.
- Seleção simplificada: agora o usuário escolhe um avatar pronto e salva.


## v75.56.7.4 — premium layout do editor de avatar

- visual mais sofisticado na tela Perfil;
- card do perfil com acabamento mais premium;
- editor de avatar com header em duas colunas, badges e painel de prévia;
- cards dos 12 avatares com seleção mais elegante;
- CTAs e feedbacks mais refinados.


## v75.56.7.4 — luxuoso, clean e mobile refinado

- lapidação da paleta premium com tons mais suaves e elegantes;
- visual mais clean na tela Perfil;
- editor premium com badges mais refinadas e painel de prévia mais nobre;
- cards dos avatares com acabamento mais leve;
- melhoria do comportamento no mobile para parecer mais um app premium de App Store.


## v75.56.7.4 — polimento final visual

- menos texto e mais foco visual;
- tela mais minimalista;
- microajustes de espaçamento, tipografia e hierarquia;
- preview do avatar mais compacto;
- grid de opções com cartões mais leves;
- botões e status mais discretos e elegantes.


## v75.56.7.4 — ajustes finais de UX

- reduzido o raio da órbita de 24h para evitar corte visual no card principal;
- linha do tempo inteligente refinada com chips de horário, melhor espaçamento e sem sobreposição;
- contraste de textos reforçado para melhor leitura nos modos claro e escuro;
- tela de avatares limpa, com textos reduzidos e alinhamento visual mais consistente;
- removidos os textos “Avatar 3D Soft”, “Tudo local, leve e sem foto real” e “Perfil privado, salvo com cuidado e sem foto real”.


## v75.56.7.4 — polimento fino visual

- Microalinhamentos finais na Home.
- Órbita 24h com raio mais seguro para evitar corte.
- Linha do tempo refinada com horários em chips/pílulas.
- Melhor contraste de texto em claro/escuro.
- Cards dos avatares com imagens centralizadas e seleção consistente.
- Textos excedentes removidos para manter visual premium.


## v75.56.7.4 — restauração dos temas, relógio e timeline

- Restaura as cores do modo claro e escuro como estavam anteriormente.
- Restaura o card do relógio principal para o comportamento visual anterior.
- Restaura a linha do tempo para o estilo anterior.
- Mantém a remoção de textos indesejados: “Avatar 3D Soft”, “Tudo local, leve e sem foto real” e “Perfil privado, salvo com cuidado e sem foto real”.
- Mantém o alinhamento visual dos avatares e seleção mais consistente.


## v75.56.7.4 — restauração visual com topo premium

- mantidas as cores originais do modo claro e do modo escuro;
- mantido o card principal do relógio/arco com estrelas;
- mantida a linha do tempo inteligente no formato visual anterior;
- mantida a parte superior com avatar/foto do jeito refinado que você aprovou;
- mantidos os avatares premium criados.


## v75.56.7.4
- Corrige o alinhamento da prévia do avatar, centralizando imagem e legenda no painel de prévia.


## v75.56.7.4 — polimento final de perfil e avatares

- Centraliza definitivamente o avatar no campo de prévia.
- Mantém as cores anteriores do modo claro/escuro, relógio/arco e linha do tempo.
- Refina microalinhamentos da tela de Perfil.
- Evita que cards de avatar “pulem” ou pareçam tortos ao selecionar.
- Mantém a coleção de 12 avatares premium aprovada.

## v75.56.7.4 — correção de exclusão, duplicidade e timeline

- Corrige item excluído do Diário que voltava após sincronização.
- Adiciona marcação local/de nuvem para impedir que registros excluídos sejam reintroduzidos ao mesclar com Firestore.
- Evita registrar dois eventos "Acordou" dentro da mesma janela acordada ativa.
- Força atualização da timeline após salvar/excluir registros.
- Ao salvar um novo item, o Diário volta para "Todos" para o registro não ficar escondido por filtro ativo.
- Preserva cache local do dia para evitar que registros recém-criados desapareçam enquanto o Firebase atualiza.


## v75.56.7.4 — Release Candidate

Correções aplicadas antes de publicação:

- Exclusões do diário agora sincronizam mesmo quando o último item do dia é apagado, preservando tombstones no Firestore.
- Bloqueio reforçado para impedir dois registros “Acordou” dentro da mesma janela acordada ativa.
- Firestore Web passa a tentar usar cache persistente IndexedDB; se não estiver disponível, cai para o comportamento padrão com aviso no console.
- Linha do tempo do Diário e Linha do tempo inteligente receberam espaçamento maior, quebra de linha segura e ações empilhadas no mobile.
- Query string do script principal e cache do Service Worker corrigidos para a versão atual.
- Mantidos os avatares premium aprovados, as cores anteriores e o card principal do relógio/arco.


## v75.56.7.4 — correção real de 24h e diário completo

- A órbita/linha de 24h agora busca eventos na janela móvel das últimas 24 horas usando o cache de dias da família, em vez de depender apenas do dia atualmente aberto no Diário.
- O Diário deixa de limitar a exibição a 8 registros; agora mostra todos os registros do dia filtrado.
- A linha do tempo inteligente da Home passa a considerar a janela móvel de 24h e até 48 registros agrupáveis.
- Registros manuais criados com horário de outro dia são roteados para o dia correto no cache/sincronização.
- Ao voltar para a tela Hoje, o app restaura o estado do dia atual para evitar misturar a visualização com uma data antiga do Diário.


## v75.56.7.4 — correção de dia-calendário, diário e timeline

- A linha/arco de 24h voltou a respeitar o dia-calendário: começa à 00:00 e reseta à meia-noite.
- A linha do tempo inteligente da Home mostra somente registros pertinentes ao dia atual, não uma janela móvel das últimas 24h.
- O Diário protege a troca de datas para não misturar o estado carregado de um dia com outro.
- Registros de dias anteriores, como antes de 28/06, são carregados do cache familiar/Firebase antes da renderização do Diário.
- Registros duplicados com mesmo tipo, horário, fim e detalhe são removidos da exibição e do merge com o banco.
- Eventos que atravessam meia-noite são considerados por sobreposição de janela, mantendo o reset visual do dia sem perder sono que cruzou a virada.


## v75.56.7.4 — correção do tempo acordado após soneca manual

- Corrige o caso em que o app continuava mostrando “acordado desde” um horário antigo mesmo após uma soneca manual com horário de fim.
- O tempo acordado agora passa a considerar o fim da última soneca/sono concluído do dia como início real da janela acordada.
- A Home, lembretes, resumo “Tempo acordado” e relógio principal passam a usar o mesmo ponto de referência.
- O estado local e o estado retornado do Firebase são reconciliados antes de renderizar, evitando divergência entre registros do diário e tempo acordado.
