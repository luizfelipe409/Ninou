# Ninou v75.57 — Perfil Familiar + Convite de Cuidador

Versão criada para elevar o Ninou com base nas funcionalidades profissionais observadas no vídeo de referência, principalmente nas áreas de perfil, configurações e convite familiar.

## Objetivo da versão

Transformar a tela Perfil em uma central familiar mais profissional, com:

- Card do bebê Francisco.
- Card “Cuidador neste aparelho”.
- Botão “Editar cuidador” abaixo da foto/perfil, sem exibir opções repetidamente.
- Card “Família Ninou”.
- Card “Compartilhamento de acesso”.
- Geração de código de convite.
- Copiar código.
- Compartilhar convite pelo WhatsApp.
- Tela/modal para entrar em uma família usando código.
- Configurações visuais de notificações e preferências.
- Campo de unidade de peso mais lapidado.
- Suporte/feedback.

## Decisão importante

Esta versão NÃO força uma migração completa para contas individuais por cuidador.

Ela mantém o modelo atual de conta familiar compartilhada, mas cria uma camada local/profissional de identificação do cuidador por aparelho:

- No celular do Felipe: `Felipe / Pai`.
- No celular da Maria: `Maria / Mãe`.

Assim, os registros deixam de parecer que “Francisco adicionou a ação” e passam a carregar o cuidador correto.

## Nome sugerido da versão

`v75.57 — Perfil Familiar + Convite de Cuidador`

## Arquivos deste pacote

- `PROMPT_CODEX_NINOU_V75_57.md`: prompt completo para aplicar no Codex.
- `FIRESTORE_RULES_V75_57.rules`: regras Firestore compatíveis com família, membros e convites.
- `HTML_SNIPPET_PERFIL_FAMILIAR.html`: blocos de interface para inserir na tela Perfil.
- `CSS_SNIPPET_PERFIL_FAMILIAR.css`: estilos dos cards, modais e convite.
- `JS_ADDON_PERFIL_FAMILIAR.js`: lógica base para cuidador local, convite, cópia e WhatsApp.
- `CHECKLIST_TESTES_V75_57.md`: testes obrigatórios antes de subir para produção.

## Onde aplicar

Aplicar na estrutura atual do Ninou, preferencialmente nos arquivos principais:

- `index.html`
- `styles.css`
- arquivo JS principal do app, por exemplo `app.js`, `app-ninou-firebase.js` ou equivalente.

## Caminho de dados sugerido

### Perfil principal da família

`families/ninou-family-luizfelipe/profile/main`

Campos sugeridos:

```js
{
  name: "Francisco",
  article: "do",
  birthDate: "YYYY-MM-DD",
  photo: "base64-or-url",
  wakeWindowMinutes: 70,
  weightUnit: "kg",
  familyName: "Família do Francisco",
  themeMode: "light" | "dark",
  notifications: {
    routine: true,
    feeding: false,
    diaper: false,
    dailyReport: false
  },
  updatedAt: serverTimestamp(),
  clientUpdatedAt: Date.now()
}
```

### Cuidador deste aparelho

LocalStorage:

`ninou.device.caregiver`

```js
{
  name: "Felipe",
  relationship: "Pai",
  avatar: "pai-modern-01",
  updatedAt: 1782950400000
}
```

### Membros da família

`families/ninou-family-luizfelipe/members/{uid}`

```js
{
  displayName: "Felipe",
  relationship: "Pai",
  role: "owner" | "caregiver",
  deviceLabel: "iPhone do Felipe",
  createdAt: serverTimestamp(),
  updatedAt: serverTimestamp()
}
```

### Convites

`families/ninou-family-luizfelipe/invitations/{inviteCode}`

```js
{
  code: "FRA7K2B9",
  familyId: "ninou-family-luizfelipe",
  status: "active",
  createdBy: "uid",
  createdByName: "Felipe",
  expiresAt: timestamp,
  createdAt: serverTimestamp()
}
```

## Resultado esperado

A tela Perfil passa a transmitir uma aparência mais próxima de app comercial, parecida com apps do nicho:

- usuário entende em qual família está;
- usuário entende quem está registrando as ações naquele aparelho;
- convite parece recurso real e profissional;
- configurações deixam de ficar espalhadas;
- o app fica preparado para futura evolução para contas individuais por cuidador.
