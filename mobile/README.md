# Ninou Mobile

Aplicativo nativo Android e iOS do Ninou, criado com Expo SDK 57, React Native, TypeScript e Expo Router.

## Estado desta entrega

- interface nativa fiel ao Ninou nas telas Hoje, Diário, Dados, Sons e Perfil, com a mesma largura, cabeçalho e hierarquia visual do webapp;
- os 12 avatares originais do Ninou, seleção no Perfil e sincronização do avatar e de “Diário do/da” entre o aparelho e a família;
- editor modal de avatar com prévia, nomes, seleção temporária e confirmação, equivalente ao webapp;
- órbita cósmica responsiva de 24 horas, relógio central em tempo real, arcos de duração, lua, estrelas e transições acordado, soneca, noite e despertar;
- menu inferior premium com as cinco áreas e o botão de novo registro integrados na mesma cápsula;
- Dados com histórico familiar de sete dias, indicadores, peso e gráficos por categoria;
- Sons com player principal, seleção dos três áudios, repetição e timer pausável de uma hora;
- os oito tipos de registro do produto, com ícones, opções e histórico integrado;
- persistência local da rotina e do perfil no aparelho;
- biblioteca de sons com os áudios do produto;
- entrada com a mesma conta Firebase e resolução do vínculo `users/{uid}/families`;
- listener Firestore do dia e gravação transacional da rotina compartilhada;
- tema claro/escuro, identificadores iniciais Android/iOS e perfis EAS;
- Development Build configurado;
- criação/aceite de convites, administração familiar, relatórios/exportações e partes avançadas do Perfil ainda não migrados para o mobile.

O app web continua independente na raiz do repositório. O mobile reutiliza a linguagem visual e as regras de domínio, sem incorporar a versão web por WebView.

## Requisitos

- Node.js 22.13 ou superior;
- Xcode para simulador/build iOS local;
- Android Studio para emulador/build Android local;
- conta Expo para builds EAS.

## Comandos

```bash
cd mobile
npm install
npm run check
npm run start:dev-client
```

Para uma visualização rápida sem módulos nativos adicionais, `npm start` pode abrir o projeto. O fluxo oficial do produto deve usar Development Build:

```bash
npx eas-cli build --profile development --platform android
npx eas-cli build --profile development --platform ios
```

Antes do primeiro envio às lojas, confirme a disponibilidade de `com.ninou.app` e gere os ícones definitivos em 1024 × 1024.

O roteiro completo está em [`docs/mobile-migration.md`](../docs/mobile-migration.md).
