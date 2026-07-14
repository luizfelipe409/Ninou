# Ninou v82.0.1 — Ícones de cuidado padronizados

Projeto completo para publicação na Vercel, criado sobre a v80.1.1.

## O que mudou

- Ícones de cuidado agora usam a mesma moldura circular do menu “Novo cuidado” na Home, no formulário, no Diário e na órbita.
- O painel “Novo registro” voltou a exibir um X real e visível para fechar.
- O marcador de ação da órbita não possui mais fundo ou sombra quadrada.
- O conteúdo da ação principal “Iniciar soneca/noite” fica centralizado como um único grupo.
- As cinco abas e o botão “+” ocupam seis colunas iguais, com a mesma altura e o mesmo espaçamento — inclusive no Perfil.
- Cache do PWA renovado para que o iPhone receba os novos estilos imediatamente após a atualização.
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
