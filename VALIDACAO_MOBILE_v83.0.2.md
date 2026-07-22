# Validação mobile — Ninou 83.0.2

## Cenários cobertos

1. **Nascimento**
   - seletor visual com colunas DIA, MÊS e ANO;
   - limite máximo na data atual;
   - confirmação explícita em “Usar esta data”;
   - sem uso de DateTimePicker no campo de nascimento.

2. **Relação com o bebê**
   - oito opções específicas: Pai, Mãe, Avó, Avô, Babá, Cuidador(a), Tia e Tio;
   - “Responsável” não aparece na lista;
   - campo de relação personalizada permanece disponível.

3. **Primeiro acesso**
   - etapa 1 pergunta o horário do primeiro despertar do dia;
   - etapa 2 pergunta o estado atual;
   - etapa 3 pergunta desde quando o estado atual começou;
   - o despertar inicial fica registrado na linha do tempo.

4. **Proteção de alternância**
   - sono iniciado menos de 2 minutos após o despertar é bloqueado;
   - despertar menos de 2 minutos após o início do sono é bloqueado;
   - a mesma proteção vale para horários manuais;
   - registros históricos completos inferiores a 2 minutos são rejeitados.

5. **Órbita**
   - ações próximas são agrupadas sem encadeamento ilimitado;
   - agrupamento funciona ao redor da meia-noite;
   - contador ×N fica visível;
   - toque no grupo abre cada ação com horário, duração, detalhe e cuidador;
   - estado atual entra no mesmo agrupamento quando ocupa a mesma posição.

## Comandos executados

```bash
cd mobile
npm run test:source

cd ..
npm test
```

Resultados: testes de domínio, sincronização, permissões, UX, prontidão para loja, arquitetura, regressões e build web aprovados.

## Limite da validação

O ambiente não possui as dependências Expo instaladas, portanto esta revisão não substitui a instalação da versão em um iPhone físico. O preview entregue é uma representação visual baseada nos componentes finais.
