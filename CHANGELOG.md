# Ninou v79.0.0 — correção do loading infinito

- removido o ciclo de MutationObserver causado pelas próprias classes de animação;
- boot deixa de depender de camadas visuais complementares para abrir;
- erro de inicialização agora aparece dentro do loading, em vez de ficar oculto;
- watchdog visível após 15 segundos, com reparo e abertura controlada;
- migração de cache sem recarga forçada ou Promise que nunca termina;
- configuração de build Vercel consolidada em `vercel.json`;
- dados locais, Firebase e estrutura familiar preservados.

# Changelog — Ninou v79.0.0

## Estabilidade percebida no iPhone

- preserva o último perfil e a última rotina válidos enquanto o Firebase reconfirma a mesma conta;
- impede que “Bebê”, família vazia ou conteúdo comercial apareçam durante a retomada;
- mantém a composição da órbita protegida mesmo se alguma classe de sessão for atualizada;
- adiciona loading inicial visível por no mínimo 1,5 segundo;
- adiciona loading curto e controlado ao retornar do segundo plano;
- mantém dados locais utilizáveis quando a conexão falha durante a sincronização.

## Home e componentes

- atalhos “Registre em poucos toques” corrigidos com grade 2×2, ícones inteiros e textos centralizados;
- ícone de medicamento normalizado em relação aos PNGs;
- espaço inferior ampliado para a barra flutuante não impedir a leitura do conteúdo;
- faixa de tipos de registro mostra quatro opções completas e continua rolável;
- formulário de registro possui margem segura antes do rodapé de salvamento;
- regras de segurança impedem relógio, horários e órbita de transbordarem.

## Infraestrutura

- scripts, manifesto, cache e Service Worker atualizados para 79.0.0;
- testes de regressão específicos para loading, retomada, sessão, órbita, atalhos e formulário;
- validação de sintaxe de 55 scripts e análise estrutural dos sete módulos CSS;
- dados locais, Firebase, famílias, cuidadores e regras do Firestore preservados.
