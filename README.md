# Ninou v75.38 — correções de relatório, WhatsApp, peso e autoria

Correções aplicadas sobre a v75.37, mantendo fotos no Firestore sem Firebase Storage.

- WhatsApp sem resumo duplicado quando a mensagem personalizada já contém o resumo.
- Peso exibido corretamente em kg quando dados antigos vieram em gramas, ex.: 4300 → 4,300 kg.
- Diferença de peso exibida em gramas quando fizer mais sentido.
- Gráfico de peso trocado para linha simples, mais realista que barras.
- Identificação de quem registra: Pai, Mãe, Cuidador(a), Responsável ou nome escolhido.
- Registros antigos com nome igual ao bebê aparecem como “Responsável”.
- Relatório/PDF com tabela mais compacta e sem estourar margem no iPhone.
- Título do relatório diferencia rotina do dia e rotina do período.
- Botão “Preparar para consulta” respeita o período selecionado, sem forçar últimos 30 dias.

Regras Firestore permanecem as mesmas da v75.37. Não usa Firebase Storage.
