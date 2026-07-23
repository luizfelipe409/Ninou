# Validação — Ninou v84.0.0

## Novo Cluster Inteligente

### Mobile
- marcador de 56 px com dois ícones representativos;
- contador numérico legível, sem prefixo `×`;
- primeiro toque expande até cinco ações radialmente;
- cada ação expandida mostra horário e abre seus detalhes;
- segundo toque no cluster abre a lista completa;
- marcador de estado atual permanece separado;
- componente TSX transpilado sem erros sintáticos.

### Web
- marcador equivalente com dois ícones e contador;
- primeiro clique expande radialmente;
- segundo clique abre o painel de detalhes existente;
- somente um grupo permanece expandido por vez;
- suporte a `prefers-reduced-motion`;
- build de produção e testes estruturais aprovados.

## Testes executados
- `npm test` na aplicação web: aprovado;
- `npm run build`: aprovado;
- `node --check` no núcleo web: aprovado;
- transpilação isolada do componente `routine-orbit.tsx`: aprovada;
- instalação completa das dependências mobile não foi concluída neste ambiente; a validação final deve ser feita no Development Build/Expo em aparelho físico.
