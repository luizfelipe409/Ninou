# Ninou v82.0.3 — Céu Vivo com navegação corrigida

Projeto completo para publicação na Vercel, criado sobre a v80.1.1.

## O que mudou

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


## Correções da v82.0.3

Esta versão remove o sol HTML duplicado, corrige o X residual do painel de eventos, restaura o botão + no Perfil, compacta a barra inferior e reforça a visibilidade dos ícones no tema claro.
## Ajuste específico da v82.0.3

A tela Perfil mantém o avatar principal e os cartões em suas posições originais. Apenas a barra superior com avatar pequeno, nome do diário e status de sincronização recebeu o mesmo acabamento das demais telas.

