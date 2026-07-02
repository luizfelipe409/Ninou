# Checklist de testes — Ninou v75.57

## Perfil familiar

- [ ] Tela Perfil abre sem erro no console.
- [ ] Card do bebê aparece com nome, nascimento/idade e janela de sono.
- [ ] Card “Cuidador neste aparelho” aparece.
- [ ] Botão “Editar cuidador” fica abaixo da área de perfil/foto.
- [ ] Modal de cuidador abre somente quando clicar no botão.
- [ ] Depois de salvar Felipe/Pai, o modal não reaparece sozinho.
- [ ] Depois de salvar Maria/Mãe em outro aparelho, o app respeita o cuidador local daquele aparelho.

## Registros

- [ ] Nova ação de mamadeira salva `caregiverName`.
- [ ] Nova ação de mamadeira salva `caregiverRelationship`.
- [ ] Nova ação de mamadeira salva `caregiverLabel`.
- [ ] Diário mostra “Registrado por Felipe · Pai” ou “Registrado por Maria · Mãe”.
- [ ] Relatório/PDF não mostra “Francisco adicionou ação”.

## Convite

- [ ] Botão “Convidar cuidador” gera código.
- [ ] Código aparece no card de convite ativo.
- [ ] Copiar código funciona.
- [ ] WhatsApp abre uma única mensagem, sem duplicar texto.
- [ ] “Entrar com código” abre modal.
- [ ] Código inválido mostra mensagem amigável.
- [ ] Código válido grava acesso em `users/{uid}/access/ninou`, quando permitido.

## Configurações

- [ ] Tema mostra somente Claro e Escuro.
- [ ] Não existe opção Automático.
- [ ] Unidade de peso mostra kg e g.
- [ ] Preferências ficam salvas ao recarregar.
- [ ] Notificações visuais ficam salvas, mesmo sem push real.

## Firebase/Firestore

- [ ] Conta `francisco@gmail.com` lê e grava perfil.
- [ ] Admin `luizfelipe.dasilva@gmail.com` lê e grava família.
- [ ] Perfil fica em `families/ninou-family-luizfelipe/profile/main`.
- [ ] Rotina fica em `families/ninou-family-luizfelipe/days/AAAA-MM-DD`.
- [ ] Membros ficam em `families/ninou-family-luizfelipe/members/{uid}`.
- [ ] Convites ficam em `families/ninou-family-luizfelipe/invitations/{code}`.

## iPhone/Safari/PWA

- [ ] App abre no Safari do iPhone sem quebra de layout.
- [ ] Modal encaixa na tela e não corta botões.
- [ ] Cards não quebram margem.
- [ ] WhatsApp abre corretamente no iPhone.
- [ ] Teclado não cobre completamente o campo do código.

## Antes de subir

- [ ] Atualizar versão/cache dos arquivos CSS e JS.
- [ ] Testar em aba anônima ou limpar cache.
- [ ] Fazer commit com mensagem: `v75.57 perfil familiar convite cuidador`.
- [ ] Subir para Vercel.
