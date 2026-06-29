# v75.40 — Avatar de teste

Objetivo: testar avatares personalizáveis no Ninou antes de remover definitivamente o fluxo de foto.

Campos salvos no perfil do bebê:

```js
avatar: {
  icon: "baby",
  color: "lilac",
  background: "moon",
  accessory: "none"
}
```

Vantagens:

- Não salva base64 como fluxo principal.
- Não usa Firebase Storage.
- Mantém compatibilidade com foto antiga.
- Permite testar ícone, cor, fundo e acessório.

A barra inferior não foi alterada nesta versão.
