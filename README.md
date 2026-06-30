# Ninou v75.56.3 — refinamento final geral premium

## Novidades v75.56.3

- Home com visual mais editorial, clean e parecido com app mobile premium.
- Relógio principal mais claro, com menos ruído visual e ação principal logo abaixo.
- Botões de ação com espaçamento refinado entre ícone e texto.
- Perfil redesenhado como hero card premium, com avatar em destaque e menos texto.
- Coleção de 12 avatares premium mantida, agora com grade mais nobre, cards maiores e estado selecionado mais claro.
- Barra inferior refinada com aparência mais nativa, translúcida e confortável para toque.
- Tema visual mais claro, adulto e luxuoso, mantendo a delicadeza do Ninou.
- Service Worker atualizado para v75.56.3 e registro com `updateViaCache: "none"`.
- Mantidas as travas offline, identificação por aparelho, ausência de foto real e biblioteca local de avatares.

---

# Ninou v75.56.3.1.1 — Somente avatar

Versão criada para testar avatares antes de substituir definitivamente a foto do bebê.

## Novidades v75.56.3.1.1

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


## Novidades v75.56.3.1.1

- O app passa a usar somente avatar para representar o bebê.
- Upload de foto e fotos antigas deixam de ser exibidos.
- Dados antigos de foto são ignorados e substituídos visualmente pelo avatar.
- O painel admin passa a mostrar avatares visuais diferentes por família, membro, usuário conhecido e admin.
- Não usa Firebase Storage e não salva imagem/base64 como fluxo principal.


## v75.56.3.1.1 — Admin online estável

- Corrige o status visual do admin global para não aparecer como "Off-line" após login.
- Falhas pontuais de leitura/escrita no Firestore agora viram aviso no painel, sem rebaixar o admin para visitante.
- Mantém o avatar limpo: somente rostinhos infantis e cor de fundo.
- Mantém isolamento de conta e evita reaproveitar identificação de outro usuário.


## v75.56.3.1.1 — Identificação por aparelho

Esta versão ajusta o uso familiar real do Ninou:

- Felipe e Maria podem usar a mesma conta `francisco@gmail.com`.
- A identificação do cuidador é salva localmente por aparelho, não na conta global.
- O celular do Felipe pode registrar como Felipe/Pai.
- O celular da Maria pode registrar como Maria/Mãe.
- Novos registros salvam `createdByDeviceId`, `createdByName` e `createdByRelationship`.
- A tela agora informa que a identificação fica salva neste celular.
- O app não grava mais essa identificação em `users/{uid}/account/profile`, evitando que um aparelho sobrescreva o outro.


## v75.56.3.1.1 — Avatar 3D Soft moderno

- Avatares do bebê redesenhados em estilo 3D Soft, com aparência mais novinha e moderna.
- Personalização agora foca em cabelinho, tom de pele e cor de fundo.
- Depois de salvar, o editor some da tela e só reaparece ao tocar em **Editar avatar** abaixo da foto do perfil.


## v75.56.3.1.1 — menino, menina e cores de cabelo

- Melhora os cabelos dos avatares.
- Adiciona opções de **menino** e **menina**.
- Adiciona mais de uma **cor de cabelo**.
- Mantém edição sob demanda: depois de salvar, o editor some e volta só no botão **Editar avatar**.


## v75.56.3.1.1 — Correções de UX offline, ação principal e avatar

- Modo offline bloqueia edição de avatar, peso, perfil e registros.
- Sem login, a única interação é preencher login/senha ou tocar em Solicitar acesso.
- Botão Acordou/Iniciar soneca fica abaixo do quadro do relógio principal.
- Adicionado respiro visual entre ícone e texto do botão.
- Corrigido tempo acordado absurdo em estado offline/cache antigo.
- Cabelos dos avatares foram redesenhados com formas mais naturais.


## v75.56.3.1.1 — Avatares premium 3D

- Novo conjunto de avatares com aparência mais delicada e realista.
- Estilos de menino e menina inspirados no mock aprovado.
- Cabelo com desenho mais natural.
- Mantidas opções de cor de cabelo, tom de pele e fundo.
- Continuidade das regras de bloqueio offline da v75.46.


## v75.56.3.1.1 — Correção de carregamento

- Corrige erro que podia impedir o app de carregar por referência antiga ao botão de peso.
- Mantém o fallback de erro em tema claro para não abrir a tela preta.
- Mantém os avatares premium da v75.56.3.1.1.


## v75.56.3.1.1 — Avatares premium baseados na análise

- Redesenho do sistema de avatar com proporção mais jovem: cabeça maior, bochechas cheias, olhos mais baixos e boca menor.
- Cabelos refeitos com massa base, sombra, mechas e highlights suaves para evitar aparência de “capacete”.
- 8 penteados, 8 cores de cabelo, 6 tons de pele e 8 fundos suaves.
- Mantém SVG dinâmico leve, sem foto real e sem Firebase Storage.
- Mantém editor escondido após salvar e bloqueado no modo offline.


## v75.56.3.1 — Correção dos cabelos

- Corrige o encaixe dos cabelos dentro da cabeça do avatar.
- Redesenha os penteados com formas mais contidas e naturais.
- Aplica clip interno no topo da cabeça para impedir cabelo escapando para fora.


## v75.56.3.1 — Avatares premium detalhados

- Refinamento completo do acabamento 3D Soft.
- Cabelos redesenhados com melhor massa, brilho e encaixe.
- Rostos mais suaves, delicados e coerentes com bebê novinho.
- Polimento visual do editor para aparência mais premium.


## v75.56.3.1 — referência aprovada

- Consolida o visual premium aprovado para os avatares.
- Mantém o estilo 3D Soft detalhado.
- Organiza a interface do editor em linha com o mock aprovado.


## v75.56.3 — Refinamento fino

- Ajusta os avatares para uma proporção mais infantil.
- Olhos mais suaves e delicados.
- Cabeça levemente maior e corpo mais discreto.
- Mantém o visual premium 3D Soft aprovado.


## v75.56.3 — Foco 1: cabelos mais realistas

- Etapa dedicada a melhorar os cabelos dos avatares.
- Penteados redesenhados com melhor massa, mechas e brilho.
- Menos efeito de “capacete” e mais naturalidade visual.
- As próximas etapas previstas continuam sendo: 2) rosto mais bebê recém-nascido; 3) polimento geral do editor.


## v75.56.3 — Etapa 2: rosto mais bebê recém-nascido

- Cabeça levemente maior e corpo mais discreto.
- Olhos mais suaves e proporcionais.
- Nariz menor e mais sutil.
- Bochechas mais cheias.
- Boca menor, expressão mais delicada e infantil.
- Próxima etapa prevista: polimento geral do editor.


## v75.56.3 — Etapa 3: polimento geral do editor

- Visual do editor reorganizado e mais premium.
- Cabeçalho, prévia, seções e ações mais elegantes.
- Cards, botões e swatches refinados para uso melhor no celular.
- Fecha a trilha pedida: 1) cabelos; 2) rosto mais bebê; 3) polimento geral.


## v75.56.3 — cabelos reconstruídos com cuidado

- Descartei os penteados anteriores.
- Reconstruí do zero a base do cabelo com foco em eixo central e melhor simetria.
- Esta versão trabalha com 3 penteados-base: Topetinho suave, Franjinha natural e Cachinhos fofos.
- Mantive as opções de cor de cabelo, pele e fundo.
- O objetivo foi trocar quantidade por qualidade e corrigir o problema de cabelo torto.


## v75.56.3 — ajuste de proporção

- Cabeça reduzida.
- Cabelo com mais presença visual.
- Melhor equilíbrio entre rosto, cabelo e corpo.
- Mantidos os 3 penteados-base da reconstrução.


## v75.56.3 — biblioteca local com 12 avatares ilustrados premium

- Substitui o avatar procedural por 12 avatares ilustrados prontos.
- Biblioteca local no app, sem foto real e sem depender de storage.
- Diversidade visual com menino, menina, diferentes tons de pele, cores de cabelo e acessórios.
- Seleção simplificada: agora o usuário escolhe um avatar pronto e salva.


## v75.56.3 — premium layout do editor de avatar

- visual mais sofisticado na tela Perfil;
- card do perfil com acabamento mais premium;
- editor de avatar com header em duas colunas, badges e painel de prévia;
- cards dos 12 avatares com seleção mais elegante;
- CTAs e feedbacks mais refinados.


## v75.56.3 — luxuoso, clean e mobile refinado

- lapidação da paleta premium com tons mais suaves e elegantes;
- visual mais clean na tela Perfil;
- editor premium com badges mais refinadas e painel de prévia mais nobre;
- cards dos avatares com acabamento mais leve;
- melhoria do comportamento no mobile para parecer mais um app premium de App Store.


## v75.56.3 — polimento final visual

- menos texto e mais foco visual;
- tela mais minimalista;
- microajustes de espaçamento, tipografia e hierarquia;
- preview do avatar mais compacto;
- grid de opções com cartões mais leves;
- botões e status mais discretos e elegantes.
