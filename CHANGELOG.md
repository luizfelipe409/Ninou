# Ninou v82.1.11 — paridade dos menus web com o mobile

- Barra inferior da web alinhada ao componente mobile.
- Menu do avatar da web alinhado ao mobile.
- Mobile v82.1.9 preservado integralmente.

Detalhes em `CHANGELOG_v82.1.11.md`.

---

# Ninou v82.1.10 — estabilidade de toque na web app

- Botão principal sem escala ou deslocamento do ícone/texto.
- Barra inferior com ícones e legendas geometricamente estáveis.
- Tela de sons sem animação vertical ou cards que diminuem ao clicar.
- Indicador de seleção dos sons com largura fixa.
- Mobile v82.1.9 preservado integralmente.

Detalhes em `CHANGELOG_v82.1.10.md`.

---

# Ninou v82.1.9 — Recorte progressivo da órbita noturna

- Sono herdado continua visível no horário real em que ocorreu.
- Ao alcançar novamente o trecho noturno, somente a parte futura que se sobreporia é ocultada.
- Às 23:15, um sono de 21:34 a 02:00 permanece como 21:34–23:15 e 00:00–02:00.
- Colisões não removem mais o registro inteiro.
- Web comercial v82.1.7 preservada.

Detalhes em `CHANGELOG_v82.1.9.md`.

---

# Ninou v82.1.8 — Soneca atravessando a meia-noite

- Sono manual com fim no dia seguinte salvo como intervalo concluído.
- Confirmação não exibe mais “Timer iniciado” quando há término.
- Diário mostra início, fim e duração completos.
- Sono herdado de ontem permanece na órbita do dia atual e cede espaço somente em caso de colisão com uma barra mais recente.
- Estado em andamento e histórico do dia anterior preservados na virada do dia.
- Web comercial v82.1.7 preservada.

Detalhes em `CHANGELOG_v82.1.8.md`.

---

# Ninou v82.1.7 — Web pronta para famílias adquirentes

- Ativação por código após aquisição.
- Planos e validade controlados pelo painel administrativo.
- Bloqueio de acesso vencido/suspenso com preservação dos dados.
- Recuperação de senha, instalação PWA e páginas públicas legais.
- Cadastro autônomo de famílias removido da experiência do cliente.
- Mobile v82.1.6 preservado.

Detalhes em `CHANGELOG_v82.1.7.md`.

---

# Ninou v82.0.0 — Polimento visual e experiência de registro

Baseada na v80.1.4, preservando o relógio Céu Vivo e as correções de estabilidade.

## Melhorias

- Menu **+** com cards mais leves e ícones sem fundo duplicado.
- Botão de fechar circular, flutuante e com maior contraste.
- Ícones ampliados sem cortes, preservando suas cores no tema claro e escuro.
- Títulos e descrições com alturas estáveis para reduzir saltos de texto.
- Formulários de registro com maior respiro entre rótulos, campos e ações.
- Cabeçalho do registro selecionado com hierarquia mais clara.
- Botão **Registrar** reforçado com indicador visual de confirmação.
- Números de relógios e timers configurados com largura tabular.
- Relógio Céu Vivo, raios solares, estrelas e correções do Perfil preservados.

## 82.0.0
- Menu de registros redesenhado com botões no estilo dos itens do Diário.
- Ícones agora usam avatares circulares, sem quinas brancas ou cortes aparentes.
- Botão X reconstruído integralmente em CSS para permanecer visível em Safari, PWA e Chrome.
- Cabeçalho do modal fixado durante a rolagem.
- Separadores, espaçamentos e contraste do launcher refinados.
