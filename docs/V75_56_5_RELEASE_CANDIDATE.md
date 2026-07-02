# Ninou v75.56.5 — Release Candidate

## Correções técnicas

- Tombstones de exclusão preservados e enviados ao Firestore mesmo quando o dia fica sem eventos.
- Bloqueio de duplicidade de “Acordou” dentro da janela acordada ativa.
- Cache persistente do Firestore ativado quando o navegador suporta IndexedDB.
- Timeline do Diário e timeline inteligente com espaçamento e quebra de texto revisados.
- Cache busting corrigido no `index.html`, `styles.css`, `app.js` e `sw.js`.

## Antes de publicar publicamente

1. Publicar regras Firestore compatíveis com famílias, membros, convites e dias.
2. Testar em dois celulares reais: pai e mãe, mesma família.
3. Testar offline: criar, editar e excluir item; reconectar; confirmar que não reaparece.
4. Testar PWA instalado no iPhone e Android.
5. Criar página de política de privacidade e termos de uso.
6. Confirmar domínio final e HTTPS.
