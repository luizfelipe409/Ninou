# Ninou v75.45 — Somente avatar

Versão criada para testar avatares antes de substituir definitivamente a foto do bebê.

## Novidades v75.42

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


## Novidades v75.42

- O app passa a usar somente avatar para representar o bebê.
- Upload de foto e fotos antigas deixam de ser exibidos.
- Dados antigos de foto são ignorados e substituídos visualmente pelo avatar.
- O painel admin passa a mostrar avatares visuais diferentes por família, membro, usuário conhecido e admin.
- Não usa Firebase Storage e não salva imagem/base64 como fluxo principal.


## v75.42.1 — Admin online estável

- Corrige o status visual do admin global para não aparecer como "Off-line" após login.
- Falhas pontuais de leitura/escrita no Firestore agora viram aviso no painel, sem rebaixar o admin para visitante.
- Mantém o avatar limpo: somente rostinhos infantis e cor de fundo.
- Mantém isolamento de conta e evita reaproveitar identificação de outro usuário.


## v75.45 — Identificação por aparelho

Esta versão ajusta o uso familiar real do Ninou:

- Felipe e Maria podem usar a mesma conta `francisco@gmail.com`.
- A identificação do cuidador é salva localmente por aparelho, não na conta global.
- O celular do Felipe pode registrar como Felipe/Pai.
- O celular da Maria pode registrar como Maria/Mãe.
- Novos registros salvam `createdByDeviceId`, `createdByName` e `createdByRelationship`.
- A tela agora informa que a identificação fica salva neste celular.
- O app não grava mais essa identificação em `users/{uid}/account/profile`, evitando que um aparelho sobrescreva o outro.


## v75.45 — Avatar 3D Soft moderno

- Avatares do bebê redesenhados em estilo 3D Soft, com aparência mais novinha e moderna.
- Personalização agora foca em cabelinho, tom de pele e cor de fundo.
- Depois de salvar, o editor some da tela e só reaparece ao tocar em **Editar avatar** abaixo da foto do perfil.


## v75.45 — menino, menina e cores de cabelo

- Melhora os cabelos dos avatares.
- Adiciona opções de **menino** e **menina**.
- Adiciona mais de uma **cor de cabelo**.
- Mantém edição sob demanda: depois de salvar, o editor some e volta só no botão **Editar avatar**.
