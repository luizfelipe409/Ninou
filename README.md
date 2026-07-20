# Ninou v82.1.8 — Mobile corrigido, web comercial preservada

Projeto completo do Ninou com:

- aplicação web/PWA para famílias;
- painel administrativo web;
- aplicação mobile v82.1.8, com correção de sono atravessando a meia-noite e órbita de 24 horas;
- Firebase/Firestore como camada de autenticação e sincronização.

## Fluxo para uma nova família adquirente

1. No painel administrativo, abra **Nova família cliente**.
2. Informe família, bebê e e-mail do responsável.
3. Escolha o plano e a validade.
4. Crie a família e envie ao cliente a mensagem de ativação copiada pelo painel.
5. O cliente abre o Ninou, toca em **Ativar meu acesso** e usa o e-mail autorizado e o código recebido.

O cliente não consegue criar uma família comercial sem convite. Cuidadores adicionais entram por convites da família.

## Controle de acesso

- **Teste:** validade configurável, inicialmente 14 dias.
- **Premium:** validade configurável, inicialmente 30 dias.
- **Cortesia:** validade configurável.
- **Suspenso:** bloqueia a entrada preservando os dados.
- **Legado:** famílias antigas sem metadados comerciais continuam funcionando.

Não há checkout ou cobrança automática nesta versão. Pagamento, renovação e liberação são administrados pelo painel.

## Publicação na Vercel

```bash
npm test
npm run build
```

Configuração esperada:

- Build Command: `npm run build`
- Output Directory: `dist`

Publique também as regras atualizadas do Firestore quando houver alteração nelas.

## Verificação após publicar

Use uma família piloto para validar:

1. criação no painel;
2. recebimento/cópia do código;
3. criação de conta com o e-mail autorizado;
4. ativação da família;
5. login em outro aparelho;
6. recuperação de senha;
7. expiração e renovação do plano;
8. páginas de privacidade, termos e suporte;
9. instalação como PWA.

Consulte `VALIDACAO_WEB_CLIENTES_v82.1.7.md` para a camada web e `mobile/VALIDACAO_SONECA_ORBITA_v82.1.8.md` para a correção mobile.
