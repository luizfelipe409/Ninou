# Ninou v75.31 — PDF bonito e WhatsApp personalizado

Esta versão parte da v75.30 e mantém as melhorias do assistente de rotina e crescimento.

## Melhorias

- Relatório em PDF/HTML com visual mais profissional, capa, cards de resumo, tabela de rotina e seção de crescimento.
- Exportação para PDF abre uma página pronta para imprimir/salvar como PDF no navegador.
- Campo para escolher o número de WhatsApp de destino.
- Campo para escrever mensagem personalizada antes do resumo do Ninou.
- Validação simples do número: aceita DDD + número e adiciona Brasil (55) automaticamente quando necessário.
- Fallback: se o navegador bloquear a janela do PDF, baixa um HTML pronto para abrir e salvar como PDF.

## Regras

As regras Firestore não mudaram em relação à regra corrigida da v75.30. Use `docs/FIRESTORE_RULES_ADMIN_GLOBAL_V75_31.md`.
