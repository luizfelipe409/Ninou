# Prompt para Codex — Ninou v75.57

Você está trabalhando no projeto Ninou, um app web/PWA estático de rotina do bebê publicado na Vercel, usando Firebase Auth e Firestore.

Crie a versão:

`v75.57 — Perfil Familiar + Convite de Cuidador`

## Contexto obrigatório

A família principal é:

`ninou-family-luizfelipe`

O admin global é:

`luizfelipe.dasilva@gmail.com`

A conta familiar correta usada pela família do Francisco é:

`francisco@gmail.com`

Felipe é o pai do Francisco.
Maria é a mãe do Francisco.

Eles podem usar a mesma conta familiar em celulares diferentes, mas cada aparelho deve registrar as ações com o cuidador local escolhido:

- No celular do Felipe: `Felipe / Pai`
- No celular da Maria: `Maria / Mãe`

Após salvar o cuidador/avatar, o app NÃO deve ficar mostrando as opções de escolha toda hora. Só deve abrir novamente ao clicar no botão `Editar cuidador`, abaixo da foto/perfil na tela Perfil.

## Objetivo da versão

A tela Perfil deve virar uma central profissional com cards parecidos com apps comerciais do nicho:

1. Card do bebê.
2. Card “Cuidador neste aparelho”.
3. Card “Família Ninou”.
4. Card “Compartilhamento de acesso”.
5. Card “Configurações”.
6. Card “Ajuda e suporte”.

## Funcionalidades obrigatórias

### 1. Cuidador neste aparelho

Criar estrutura local:

```js
const caregiverStorageKey = "ninou.device.caregiver";
```

Objeto salvo:

```js
{
  name: "Felipe",
  relationship: "Pai",
  avatar: "pai-modern-01",
  updatedAt: Date.now()
}
```

Criar funções:

```js
function getDefaultCaregiver() {}
function loadDeviceCaregiver() {}
function saveDeviceCaregiver(caregiver) {}
function getCaregiverLabel() {}
function renderDeviceCaregiver() {}
function openCaregiverEditor() {}
function closeCaregiverEditor() {}
```

O app deve usar esse cuidador ao salvar qualquer evento de rotina.

Cada evento salvo deve receber estes campos novos:

```js
caregiverName: "Felipe",
caregiverRelationship: "Pai",
caregiverLabel: "Felipe · Pai",
createdByUid: cloudUser?.uid || null,
createdAtClient: Date.now()
```

Ao renderizar eventos no diário/últimos registros/relatório, trocar textos genéricos por algo como:

`Registrado por Felipe · Pai`

Nunca mostrar que o Francisco adicionou a ação.

### 2. Botão editar cuidador

Na tela Perfil, abaixo da foto/perfil, adicionar:

`Editar cuidador`

O editor só abre quando o botão for clicado.

Campos do modal:

- Nome do cuidador.
- Vínculo: Pai, Mãe, Avó, Avô, Tia, Tio, Babá, Outro.
- Avatar/boneco moderno em estilo soft 3D, podendo reaproveitar opções já existentes no projeto.

Botões:

- Salvar cuidador.
- Cancelar.

### 3. Perfil familiar em cards

Reorganizar a tela Perfil em cards:

#### Card Bebê

Mostrar:

- Foto do Francisco.
- Nome.
- Idade atual.
- Data de nascimento.
- Janela de sono.
- Botão para editar dados do bebê.

#### Card Cuidador neste aparelho

Mostrar:

- Avatar.
- Nome.
- Vínculo.
- Texto: `As ações deste aparelho serão registradas com este cuidador.`
- Botão: `Editar cuidador`.

#### Card Família Ninou

Mostrar:

- Nome da família: `Família do Francisco`.
- Conta familiar: email logado, se houver.
- Tipo de acesso: `Familiar`.
- ID interno: `ninou-family-luizfelipe`, apenas em texto discreto ou opção de debug/admin.

#### Card Compartilhamento de acesso

Mostrar:

- Botão `Convidar cuidador`.
- Botão `Entrar com código`.
- Área de convite ativo, se houver.

### 4. Convite de cuidador

Criar geração de código local/Firestore:

Código em formato curto, por exemplo:

`FRA7K2B9`

Função:

```js
function generateInviteCode() {
  return Math.random().toString(36).slice(2, 10).toUpperCase();
}
```

Ao clicar em `Convidar cuidador`:

- gerar código;
- salvar em `families/ninou-family-luizfelipe/invitations/{code}` quando Firebase estiver disponível;
- salvar fallback local quando offline;
- mostrar o código na tela;
- permitir copiar;
- permitir compartilhar no WhatsApp.

Mensagem WhatsApp sugerida:

```txt
Você foi convidado(a) para acompanhar a rotina do Francisco no Ninou.
Código de convite: FRA7K2B9
Acesse o Ninou, toque em Perfil > Entrar com código e informe este código.
```

### 5. Entrar com código

Criar modal:

Título: `Entrar em uma família`
Texto: `Digite o código recebido para acompanhar a rotina do bebê.`

Campo:

- Código do convite.

Botão:

- `Entrar na família`.

Nesta versão, como ainda existe conta familiar compartilhada, o fluxo pode:

1. validar o código no Firestore, se possível;
2. se válido, associar o usuário atual em `users/{uid}/access/ninou`;
3. pedir para configurar o cuidador local;
4. salvar nome/vínculo no aparelho.

Se estiver offline ou sem permissão, mostrar mensagem amigável:

`Não foi possível validar o convite agora. Verifique a conexão ou as permissões do Firebase.`

### 6. Configurações

Adicionar no Perfil:

- Tema: apenas `Claro` e `Escuro`. Não usar opção automática.
- Unidade de peso: `kg` e `g`.
- Notificações visuais:
  - Rotina do bebê.
  - Mamadeira/amamentação.
  - Fralda.
  - Relatório diário.

Nesta versão, as notificações podem ser apenas preferências salvas. Não implementar push notification real ainda.

### 7. Ajuda e suporte

Adicionar card:

- `Enviar sugestão`
- `Reportar problema`
- `Falar pelo WhatsApp`

Pode abrir WhatsApp com texto pronto:

`Olá! Gostaria de falar sobre o app Ninou.`

## Firestore

Usar estes caminhos:

- Perfil: `families/ninou-family-luizfelipe/profile/main`
- Dias: `families/ninou-family-luizfelipe/days/{yyyy-mm-dd}`
- Membros: `families/ninou-family-luizfelipe/members/{uid}`
- Convites: `families/ninou-family-luizfelipe/invitations/{inviteCode}`
- Acesso do usuário: `users/{uid}/access/ninou`

## Compatibilidade

Não remover funcionalidades atuais:

- Hoje.
- Diário.
- Perfil.
- Relatórios.
- Gráficos.
- Mamadeira.
- Amamentação.
- Fralda.
- Sono.
- Despertar noturno.
- Medicamento.
- PDF.
- WhatsApp.
- Login Firebase.

## Validações de qualidade

Ao final, revisar:

- Não existe erro de JavaScript no console.
- O app abre em iPhone/Safari.
- A tela Perfil não quebra margem.
- O botão Editar cuidador abre o modal.
- Depois de salvar cuidador, o modal não reaparece sozinho.
- Um evento novo salva `caregiverName`, `caregiverRelationship` e `caregiverLabel`.
- Diário mostra “Registrado por Felipe · Pai” ou “Registrado por Maria · Mãe”.
- Convidar cuidador gera código.
- Copiar código funciona.
- Compartilhar WhatsApp não duplica mensagem.
- Tema só tem Claro e Escuro.
- Unidade de peso está mais lapidada.
- Regras Firestore permitem admin global, membros da família e conta familiar.

## Resultado esperado

A versão deve deixar o Ninou com sensação mais profissional, parecida com apps do nicho, sem exigir ainda uma migração completa para app nativo ou contas individuais obrigatórias.
