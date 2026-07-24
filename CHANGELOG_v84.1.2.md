# Ninou v84.1.2 — integração final web, iOS e Android

- Corrige o cronômetro truncado da órbita no web/PWA.
- Abre ações agrupadas diretamente em um painel com ícones nítidos, data completa, horário, duração e autoria, sem expansão cortada dentro da órbita.
- Redefine a rota após o login para impedir a abertura indevida da tela de novo registro.
- Refina a entrada com wallpaper em toda a viewport e formulário premium nos temas claro e escuro.
- Adiciona manifesto, ícone Apple Touch e metadados completos para instalação na tela inicial.
- Reduz o tempo de entrada carregando conta e família em paralelo e reparando o ponteiro familiar em segundo plano.
- Restringe PDF, WhatsApp, CSV e JSON a responsáveis e cuidadores.
- Implementa impressão em PDF e downloads CSV/JSON compatíveis com navegador.
- Adiciona `expo-system-ui` e alinha os pacotes ao Expo SDK 57.
- Atualiza as regras do Firestore para v84.1.2, usando o membro familiar canônico como única fonte de autorização.
- Protege o cadastro inicial com um lote atômico validado por `getAfter()` e impede índices pessoais de concederem acesso a outra família.
- Torna a aceitação de convite atômica para não deixar vínculos incompletos em caso de queda de rede.
- Valida papel, família, data, autoria e timestamps nas gravações da rotina.
- Adiciona testes reais no emulador para cadastro, convites, isolamento familiar e permissões de responsável, cuidador e visualização.
- Atualiza a versão para 84.1.2 e os builds iOS/Android para 93.
