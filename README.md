# Ninou v79.1.0 — ajustes visuais após validação real

Versão construída sobre a v79.0.0, usando como referência a gravação e as capturas de 13/07/2026.

## Alterações desta revisão

- atalhos “Registre em poucos toques” passam a usar composição vertical centralizada;
- labels do gráfico de peso deixam de usar contorno grosso;
- cada gráfico de peso recebe seu próprio gradiente SVG e a linha não depende mais de filtro compartilhado;
- registros do Diário recebem contraste explícito no tema escuro;
- filtros do Diário passam a quebrar naturalmente em mais de uma linha, sem `diaryChipsMoreButton`;
- a tela Perfil volta a usar o acabamento anterior do projeto;
- apenas os avatares do card “Minha família” permanecem limitados e alinhados;
- dados locais, Firebase, famílias, registros e regras do Firestore não foram alterados.

## Validação disponível no pacote

```bash
npm test
npm run build
```

A pasta `dist/` é gerada pelo build e pode ser usada como saída da Vercel.
