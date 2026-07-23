# Ninou v84.1.1 — web, iOS e Android universais

- Removida a aplicação web legada independente.
- Web agora é exportada diretamente do aplicativo Expo/React Native Web.
- Mesmos menus, telas, wallpapers, efeitos, órbita e opções nas três plataformas.
- Mesmo Firebase Authentication, Firestore e regras de segurança.
- Família ativa resolvida pelo ponteiro canônico `users/{uid}/access/ninou`.
- Autorreparo do ponteiro quando existem vínculos antigos ou duplicados.
- Perfil canônico em `families/{familyId}/profile/main`.
- Rotina canônica em `families/{familyId}/days/{dayId}`.
- Caches locais renomeados e isolados por família.
- Atualização de dados quando o app volta ao primeiro plano.
- Service Worker e runtime web legados removidos, eliminando mistura de implementações e módulos.
- Vercel configurada para publicar `mobile/dist`.
