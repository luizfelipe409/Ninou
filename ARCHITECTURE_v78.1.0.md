# Ninou v78.1.0 — Fundação de arquitetura

Esta versão preserva a interface e o núcleo funcional, mas adiciona uma camada interna para a migração progressiva e segura do monólito.

## Novos limites

- `js/core/event-bus.js`: comunicação desacoplada entre domínios.
- `js/core/app-state.js`: estado central observável e imutável por atualização.
- `js/core/logger.js`: logs estruturados com remoção de campos sensíveis.
- `js/repositories/`: acesso a dados por contratos, sem dependência da interface.
- `js/runtime/architecture-v78.1.0.mjs`: inicialização única e API interna `window.NinouArchitecture`.

## Estratégia de migração

O núcleo legado continua sendo a fonte funcional nesta versão. Novos recursos devem usar a arquitetura acima. Domínios existentes serão migrados um por vez, com testes, evitando uma reescrita completa e regressões.

## Contratos públicos internos

```js
NinouArchitecture.state
NinouArchitecture.bus
NinouArchitecture.logger
NinouArchitecture.storage
NinouArchitecture.repositories
```

Não inserir dados sensíveis em logs. Não acessar diretamente `localStorage` em módulos novos. Não atualizar interface e Firebase no mesmo módulo.
