# Ninou v78.3.0 — Premium estável

Esta versão corrige as regressões vistas na gravação feita no iPhone, mantendo a identidade visual e a estrutura de dados atual.

## Principais proteções

- a mesma conta não perde visualmente o perfil durante a reconexão;
- a órbita não aparece desmontada durante boot ou retomada;
- telas de visitante não aparecem para uma conta já autenticada;
- loading inicial e loading de retomada possuem estados separados;
- atalhos, barra inferior e formulário foram ajustados para telas móveis reais.

## Validar antes de publicar

```bash
npm test
npm run build
```

O projeto completo deve ser mantido no GitHub. A pasta `dist/`, gerada pelo build, contém somente o pacote de publicação.

Depois de publicar uma nova versão do PWA, abra o site conectado à internet e recarregue uma vez para o Service Worker substituir o cache anterior.
