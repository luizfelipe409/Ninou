# Ninou v75.42 — Conta isolada, acesso familiar e avatar limpo

Esta versão corrige os pontos observados na gravação de tela de 29/06/2026.

## Correções principais

- Sem conta logada, o app não deve reaproveitar dados familiares da última conta.
- Ao trocar de usuário, o contexto visível é separado por conta e a tela volta para dados da conta atual.
- A identificação nos registros é isolada por conta e não deve mostrar Maria/Mãe em outra conta.
- Se a conta já existir como membro da família principal, o app tenta reconhecer o acesso por `families/{familyId}/members/{uid}`, além do legado `users/{uid}/access/ninou`.
- O texto de acesso sem vínculo ficou menos confuso e não deve parecer que a conta perdeu o convite quando a verificação ainda está acontecendo.
- O avatar foi simplificado: apenas rostinhos infantis e cor de fundo, sem foto, sem acessórios e sem grade poluída.

## Teste recomendado

1. Abrir sem login e confirmar que não há dados da última conta.
2. Logar com Francisco e verificar se o acesso familiar é resolvido.
3. Logar com Maria e salvar Maria/Mãe.
4. Sair e logar com outra conta; confirmar que Maria/Mãe não aparece indevidamente.
5. Testar avatar com rostinho + cor de fundo.
6. Confirmar que nenhuma foto antiga aparece.
