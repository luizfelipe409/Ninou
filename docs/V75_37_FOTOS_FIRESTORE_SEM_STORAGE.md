# Ninou v75.37 — Fotos no Firestore sem Storage

Esta versão retrocede a lógica da v75.36 que usava Firebase Storage.

## O que mudou

- Remove a dependência prática do Firebase Storage para fotos.
- Mantém a foto do bebê e a foto pessoal do admin salvas no Firestore/localStorage em base64 otimizado.
- Reduz a foto para 260x260 com qualidade JPEG 0.72 antes de salvar.
- Mantém todas as melhorias da v75.35: central de avisos, lembretes leves, exportação avançada, botões refinados, observações e modo consulta.
- Não é necessário publicar regras de Storage.

## Caminhos principais

Foto do bebê:

```txt
families/{familyId}/profile/main/photo
```

Foto pessoal do admin:

```txt
users/{uid}/account/profile/photo
```

## Observação

Salvar foto em base64 no Firestore é mais simples e evita Storage, mas a imagem precisa continuar pequena. Por isso esta versão comprime mais a foto antes de salvar.
