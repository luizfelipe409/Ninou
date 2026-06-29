# Ninou v75.12 — Dados familiares restauráveis

Esta versão mantém o Admin limpo da v75.11 e adiciona uma proteção importante para a transição para família compartilhada.

## Correções

- Ao entrar como admin, o Ninou procura dados antigos salvos neste aparelho e pode importar perfil, foto, janela de despertar, pesos e rotina de hoje para a família principal.
- Se a família no Firebase estiver vazia, o app tenta restaurar automaticamente o melhor cache local encontrado.
- O painel Admin ganhou a seção **Dados da família**, com botão **Importar dados encontrados** para restaurar manualmente se necessário.
- Quando um convidado aceita convite, se a família ainda estiver vazia e a conta tiver dados locais, o app também tenta preservar esses dados na família.
- Mantém convites, usuários autorizados e regras v75.10/v75.11.

## Regras Firestore

Use as regras completas já atualizadas para v75.11/v75.12.
