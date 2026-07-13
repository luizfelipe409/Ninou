# Ninou v78.1.0

Aplicativo familiar para acompanhamento da rotina do bebê.

## Validação antes do deploy

```bash
npm test
```

O comando verifica a sintaxe de todos os scripts, IDs duplicados no HTML, referências de versão, arquivos do Service Worker, arquivos obrigatórios e possíveis arquivos sensíveis no pacote.

## Deploy
Publique a pasta completa na Vercel. Não reutilize arquivos isolados de versões anteriores, pois HTML, Service Worker e módulos usam o mesmo identificador de versão.
