# Ninou v74.16 — revisão final do roadmap estável

Esta versão consolida a base v74 com foco em estabilidade, preservação dos dados locais, revisão do sono, Diário, Dados, Perfil, Sons e cache do PWA.

## Principais pontos revisados

- Tela Inicial, Diário, Dados, Perfil e Sons preservados.
- Timers de acordado/dormindo revisados.
- Registro `Acordou` mantido como evento real.
- Soneca, sono noturno e despertar noturno com início/fim manual.
- Janela acordado salva nos registros de sono quando há despertar anterior válido.
- Amamentação mista preserva E, D e Total.
- Últimos registros e últimos 5 dias validados.
- Dados locais preservados mesmo sem login ou ao desconectar do Firebase.
- Service Worker atualizado para `ninou-v74-16-revisao-final`.

## Importante após publicar

Depois de subir no Vercel/GitHub, faça hard refresh. No iPhone, caso esteja usando como PWA instalado na Tela de Início, remova o atalho antigo e adicione novamente para garantir que o cache antigo foi descartado.
