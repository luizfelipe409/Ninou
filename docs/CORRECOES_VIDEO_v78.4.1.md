# Correções baseadas na gravação — Ninou v81.0.1

## Loading ausente

A classe de boot agora é aplicada no primeiro script do `<head>`. Na primeira abertura da v81.0.1, o aplicativo remove uma única vez os caches `ninou-*` e o Service Worker anterior, preserva o armazenamento local e recarrega com a versão correta. O app principal permanece oculto até o boot liberar a primeira pintura.

## Relógio lento e fora do centro

A liberação não depende mais apenas de status genéricos como “Off-line”. O boot aguarda:

- resolução do estado de acesso;
- recuperação do nome salvo do bebê quando existente;
- relógio preenchido;
- módulos de UX e consistência carregados;
- centro da órbita medido dentro de tolerância de 3 px.

A composição da órbita também recebe uma regra final e um guardião em tempo de execução para impedir que seletores legados alterem posição, margem ou transformação do centro.

## Atalhos cortados ou desalinhados

O grupo ganhou o identificador estável `quickActions`. A definição final estabelece:

- grade fixa 2 × 2;
- quatro cards com a mesma altura;
- ícones em posição normal, sem deslocamento negativo;
- dimensões iguais e `object-fit: contain`;
- textos centralizados;
- verificação automática de que cada ícone permanece dentro do card.

## Dados preservados

A atualização não altera chaves de registros, perfil, família, Firebase ou regras do Firestore. A limpeza inicial atinge somente Service Workers e caches com prefixo `ninou-`.
