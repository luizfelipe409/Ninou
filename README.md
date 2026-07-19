# Ninou v82.1.0 — Mobile como referência do produto

Projeto completo para publicação na Vercel. A experiência mobile é a fonte principal de produto e o web app acompanha os mesmos fluxos, regras e acabamento.

## O que mudou

- Web app espelhado com a versão mobile, mantendo a adaptação responsiva para telas maiores.
- Centro de Operação premium para o admin global, sem família pessoal ou card técnico.
- Gestão de famílias clientes, usuários, convites, planos, suporte, auditoria e integridade.
- Login inválido permanece na mesma tela e informa “E-mail ou senha incorretos”.
- Confirmação moderna depois de registrar ou atualizar um cuidado.
- Sonecas antigas não aparecem na órbita atual; sono atravessando a meia-noite é recortado a partir de 00:00.
- Contas bloqueadas exibem o mesmo portal de acesso suspenso do mobile.
- Tema claro do relógio com céu azul suave, nuvens, brilho solar e raios animados.
- Tema escuro com céu cósmico, nebulosas, lua crescente e estrelas com movimento discreto.
- As artes são arquivos SVG leves do próprio projeto; não dependem de serviços externos.
- Sol e marcador continuam usando a hora local do aparelho.
- A órbita mantém o mapeamento 00 no topo, 06 à direita, 12 embaixo e 18 à esquerda.
- Menu +, amamentação, Perfil, painel de eventos e correções da v80.1.1 foram preservados.

## Instalação

Preserve apenas a pasta `.git` do projeto atual, remova os demais arquivos e copie o conteúdo desta pasta para a raiz do repositório.

## Validação

```bash
npm test
npm run build
```

A Vercel deve usar `npm run build` e publicar a pasta `dist`.


## Correções preservadas da v82.0.0

Esta versão remove o sol HTML duplicado, corrige o X residual do painel de eventos, restaura o botão + no Perfil, compacta a barra inferior e reforça a visibilidade dos ícones no tema claro.
