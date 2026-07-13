# Ninou v78.1.0 — Consolidação técnica

## Objetivo
A v78 inicia a consolidação da base técnica sem redesenhar a interface aprovada nem alterar a estrutura dos dados no Firebase.

## Alterações
- camada central de armazenamento local com leitura segura, retorno de sucesso e quarentena de JSON corrompido;
- diagnósticos de boot, conectividade, modo PWA e saúde do armazenamento;
- utilitários comuns para texto, HTML, URLs externas e nomes de arquivo;
- captura de erros migrada para a camada segura de armazenamento;
- Service Worker versionado e atualizado com os novos módulos;
- cabeçalhos de segurança e política de permissões revisados;
- pacote de produção limpo, sem `.vercel`, `.env` ou centenas de notas históricas;
- teste estrutural automático para sintaxe, IDs duplicados, arquivos obrigatórios, referências antigas e itens sensíveis;
- versão unificada em HTML, módulos, manifesto, cache e pacote npm.

## Preservado
- registros existentes e chaves locais;
- autenticação e estrutura do Firebase;
- regras do Firestore;
- órbita, linha do tempo e visual das versões 77;
- fluxo familiar, perfil, relatórios e exportações.

## 78.1.0 — Fundação arquitetural

- adiciona barramento de eventos desacoplado;
- adiciona estado central observável;
- adiciona logger estruturado com proteção de campos sensíveis;
- adiciona contratos de repositório para rotina e perfil;
- integra a arquitetura ao boot antes do núcleo legado;
- adiciona testes unitários da nova fundação;
- mantém a interface e o comportamento funcional da v78.0.0.
