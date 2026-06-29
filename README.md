# Ninou v75.37 — fotos no Firestore sem Storage

Esta versão retrocede a v75.36 porque o Firebase Storage pode gerar custo.

Você pode instalar direto esta versão para manter as melhorias até a v75.35 e voltar a salvar fotos no Firestore/localStorage.

## Alterações principais

- Remove a dependência da lógica de Firebase Storage.
- Foto do bebê volta a salvar no documento `families/{familyId}/profile/main`, campo `photo`.
- Foto pessoal do admin volta a salvar em `users/{uid}/account/profile`, campo `photo`.
- A imagem agora é reduzida para 260x260 em JPEG 0.72 para ocupar menos espaço no Firestore.
- Não precisa publicar regras de Storage.

## Instalação

1. Suba esta versão no Vercel.
2. Publique apenas as regras Firestore em `docs/FIRESTORE_RULES_ADMIN_GLOBAL_V75_37.md`.
3. Não publique regras de Storage.
4. Limpe o cache/PWA no iPhone depois do deploy.
