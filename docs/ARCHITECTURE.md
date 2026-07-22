# Arquitetura da base de lançamento

## Web

### Inicialização

`index.html` carrega `styles/app.css` e `js/bootstrap.mjs`. O bootstrap inicializa o núcleo, o shell da interface e os módulos de diagnóstico.

### Núcleo

`js/app-core.mjs` mantém os fluxos principais de autenticação, família, rotina, relatórios e sincronização. Recursos especializados continuam separados em `domain/`, `services/`, `repositories/` e `ui/`.

### Shell

`js/ui/app-shell.mjs` concentra a experiência transversal da web: barra inferior, menu do avatar, live wallpaper, refinamentos de validade, exclusão e primeiro acesso.

### Administração

O painel usa `js/admin-runtime.mjs`, `js/services/admin-service.js` e `styles/admin.css`. Esses recursos são carregados condicionalmente somente para a conta administrativa.

## Mobile

O aplicativo nativo está dividido em:

- `src/app/`: rotas e telas;
- `src/components/`: componentes visuais reutilizáveis;
- `src/domain/`: regras puras;
- `src/services/`: Firebase e operações administrativas;
- `src/state/`: estado de autenticação, perfil, preferências e rotina;
- `src/config/release.ts`: versão central do runtime mobile.

Não existe WebView: web e mobile compartilham comportamento e linguagem visual, mas têm implementações próprias.
