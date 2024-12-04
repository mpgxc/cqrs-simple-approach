# Requisitos Funcionais do Desafio

1. **Cadastro de Usuários e Lojistas**
   - Cada usuário (comum ou lojista) deve possuir nome completo, CPF/CNPJ, e-mail e senha, com CPF/CNPJ e e-mail únicos no sistema.
   - Lojistas apenas recebem transferências, enquanto usuários comuns podem enviar e receber.

2. **Operação de Transferência**
   - Usuários comuns podem realizar transferências para outros usuários comuns ou lojistas.
   - Antes de efetuar a transferência:
     - Verificar se o usuário pagador tem saldo suficiente.
     - Consultar um serviço externo para autorização da transação (mock fornecido: `https://util.devi.tools/api/v2/authorize`).
   - A transferência deve ser feita como uma **transação atômica**:
     - Em caso de falha em qualquer etapa, o valor é revertido para a carteira do pagador.

3. **Notificação de Recebimento**
   - Após a transferência, o destinatário (usuário comum ou lojista) deve receber uma notificação (e-mail ou SMS) via serviço externo.
   - Este serviço de notificação pode ser instável, então o sistema deve lidar com eventuais falhas.
   - Mock do serviço de notificação: `https://util.devi.tools/api/v1/notify`.

4. **API RESTful**
   - O serviço deve ser exposto via uma API REST, incluindo o endpoint de transferência:
     - `POST /transfer` que recebe um JSON com `value`, `payer`, e `payee`.

---

# Casos de Uso

1. **Registrar Usuário Comum**
   - O sistema registra o usuário, verificando a unicidade do CPF/CNPJ e e-mail.

2. **Registrar Lojista**
   - Semelhante ao registro de usuário comum, mas lojistas apenas recebem transferências.

3. **Realizar Transferência de Usuário Comum para Usuário Comum**
   - Verificar saldo do pagador.
   - Consultar o serviço autorizador externo para aprovar a transação.
   - Completar a transferência e enviar notificação para o destinatário.

4. **Realizar Transferência de Usuário Comum para Lojista**
   - Mesmo fluxo de verificação e autorização da transferência.
   - Completar a transação e enviar notificação ao lojista.

5. **Lidar com Falhas na Transferência**
   - Em caso de erro na autorização ou notificação, reverter a transação, garantindo a integridade dos saldos.

6. **Notificar o Destinatário Após Transferência**
   - Enviar uma notificação ao destinatário usando o serviço externo, com tratamento de possíveis falhas na comunicação.

# CQRS - Diferença entre Command e Evento

## Command

- Um **command** é uma **ordem para executar uma ação** no sistema.
- Expressa **intenção** e solicita que algo aconteça.
- É direcionado a um destinatário específico (ex.: uma entidade, serviço ou agregate) que deve processá-lo.
- **Imperativo**: representa uma instrução direta para o que o sistema deve fazer.
- **Sincronicidade**: geralmente processado de forma síncrona, retornando um resultado ou erro.
- **Exemplo**: `TransferirDinheiro`, `CriarConta`, `CancelarPedido`.

**Exemplo de Command:**

```typescript
type TransferirDinheiroCommand = {
    type: 'TransferirDinheiro';
    fromAccountId: string;
    toAccountId: string;
    amount: number;
}
```

## Event

- Um **evento** representa uma **mudança de estado** que **já aconteceu** no sistema.
- Expressa um fato consumado, usado para notificar outros componentes sobre algo ocorrido.
- **Declarativo**: descreve algo que aconteceu, sem exigir uma resposta direta.
- **Assincronicidade**: processado de maneira assíncrona; vários componentes podem reagir ao evento.
- **Exemplo**: `DinheiroTransferido`, `ContaCriada`, `PedidoCancelado`.

**Exemplo de Evento:**

```typescript
type DinheiroTransferidoEvent = {
    type: 'DinheiroTransferido';
    fromAccountId: string;
    toAccountId: string;
    amount: number;
    timestamp: Date;
}
```

---

## Quando Cada Um Acontece

1. **Command** – **No início do processo**:
   - O command inicia uma ação de negócio. É recebido, validado e processado por uma entidade ou serviço.
   - Se for bem-sucedido, muda o estado do sistema.
   - É o **primeiro passo** na cadeia de execução de uma operação.

2. **Evento** – **Após o processamento do command**:
   - Após o command ser processado e o estado alterado, um evento é criado para representar a mudança.
   - O evento é armazenado (em um Event Store, por exemplo) e distribuído para que outros componentes reajam a ele.
   - É uma **notificação** de que uma ação foi concluída.

---

## Exemplo Prático: Transferência de Dinheiro

Exemplo de processo de uma transferência entre contas:

1. **Recebimento do Command**:
   - O cliente envia o command `TransferirDinheiro` com detalhes sobre as contas e o valor da transferência.
   
2. **Processamento do Command**:
   - O sistema valida o command e, se aprovado, executa a transferência, alterando o saldo das contas.

3. **Geração do Evento**:
   - Após a transferência, o sistema gera um evento `DinheiroTransferido` para indicar o sucesso da operação.

4. **Reação ao Evento**:
   - Componentes reagem ao evento:
     - Serviço de notificação envia confirmação ao cliente.
     - Serviço de auditoria registra a transferência.
     - Modelo de leitura é atualizado para refletir o novo saldo.

---

## Resumo

| Aspecto               | Command                       | Evento                          |
|-----------------------|-------------------------------|---------------------------------|
| **Definição**         | Ordem para realizar uma ação | Notificação de uma ação concluída |
| **Objetivo**          | Iniciar uma operação         | Informar sobre uma mudança de estado |
| **Momento**           | Início do processo           | Após a execução de um command  |
| **Exemplo**           | `TransferirDinheiro`         | `DinheiroTransferido`            |
| **Assincronicidade**  | Normalmente síncrono         | Normalmente assíncrono           |
| **Destino**           | Destinatário específico      | Todos os interessados             |

---

Em resumo, **commands** iniciam uma ação específica e direcionada, enquanto **eventos** notificam a mudança de estado resultante, permitindo que o sistema e seus componentes reajam a essas mudanças.



## Comandos vs Events

| **Características**                          | **Commands**                                                                                      | **Events**                                                                                                    |
|----------------------------------------------|---------------------------------------------------------------------------------------------------|---------------------------------------------------------------------------------------------------------------|
| Representação                                | Intenção de realizar uma ação                                                                     | Fatos que já ocorreram                                                                                        |
| Estado                                       | Objeto que quer executar uma ação                                                                 | Informação imutável                                                                                           |
| Possibilidade de falha                       | Solicita uma ação, falhas podem ocorrer                                                           | Não pode ser alterado                                                                                         |
| Tratamento                                   | Pode ser rejeitado                                                                               | Consumidores podem ignorar eventos                                                                            |
| Consumidores                                 | Um consumidor                                                                                     | Muitos consumidores                                                                                           |
| Forma verbal                                 | Verbo                                                                                             | Passado                                                                                                       |
| Utilização                                   | Exemplo: "PlaceOrder" enviado para o SQS                                                          | Exemplo: "OrderCreated" enviado para o EventBridge                                                            |
| Finalidade                                   | Pedir que algo seja feito                                                                        | Pode ser usado para determinar o histórico de uma transação                                                   |


# CQRS - Command, Query , Event e seus Handlers
### Message Bus - Barramento de mensagens
- O Message Bus é responsável por transportar uma mensagem até o destino correto. Ele serve como base para o transporte de Commands, Queries e Events. Essas mensagens são entregues aos seus respectivos Handlers, que são responsáveis por executar alguma ação com base na mensagem recebida.

### **Command**
- **O que é:** Uma instrução explícita para realizar uma ação que **muda o estado** do sistema.
- **Exemplo:** `CreateUserCommand`, `TransferMoneyCommand`.
- **Quando usar:** Sempre que você quiser **modificar o estado**. Commands são geralmente ações **imperativas**: "Faça X".

### **Query**
- **O que é:** Uma solicitação de **leitura de dados** que **não muda o estado** do sistema.
- **Exemplo:** `GetUserDetailsQuery`, `FindOrdersByCustomerQuery`.
- **Quando usar:** Sempre que você quiser **obter informações** do sistema. Queries são **declarativas**: "Diga-me X".

### **Event**
- **O que é:** Algo que **já aconteceu** no sistema, usado para comunicar a outros componentes que uma ação foi concluída.
- **Exemplo:** `UserCreatedEvent`, `MoneyTransferredEvent`.
- **Quando usar:** Para **notificar mudanças** no sistema ou para **desencadear comportamentos reativos**. Eventos descrevem um fato no passado: "X aconteceu".

---

## 2. Handlers e Buses

### **Command Handler**
- **O que faz:** Processa um `Command` e executa a lógica necessária para realizar a ação solicitada.
- **Responsabilidade:** Recebe o command, valida e chama o domínio para alterar o estado.

### **Query Handler**
- **O que faz:** Processa uma `Query` e retorna os dados solicitados.
- **Responsabilidade:** Consulta os dados do sistema (geralmente de um banco otimizado para leitura ou cache).

### **Event Handler**
- **O que faz:** Processa um `Event` e executa uma ação reativa.
- **Responsabilidade:** Reage a eventos, como atualizar um sistema secundário, enviar uma notificação ou emitir outro evento.

### **Command Bus**
- **O que faz:** Encaminha `Commands` para o respectivo `Command Handler`.
- **Responsabilidade:** Atuar como um intermediário entre quem emite um command e o handler que o processa.

### **Query Bus**
- **O que faz:** Encaminha `Queries` para o respectivo `Query Handler`.
- **Responsabilidade:** Centralizar o acesso às consultas.

### **Event Bus**
- **O que faz:** Encaminha `Events` para um ou mais `Event Handlers`.
- **Responsabilidade:** Garantir que eventos sejam entregues a todos os handlers interessados.

---

## 3. Quando Usar o Que?

### **Commands**
- Use quando o sistema precisa realizar uma **ação de negócio** que muda o estado.
- Exemplos:
  - Criar um pedido (`CreateOrderCommand`).
  - Atualizar os detalhes de um usuário (`UpdateUserCommand`).

### **Queries**
- Use quando você precisa **buscar dados**, sem alterar o estado do sistema.
- Exemplos:
  - Obter detalhes de um pedido (`GetOrderDetailsQuery`).
  - Listar transações recentes (`ListRecentTransactionsQuery`).

### **Events**
- Use para **notificar** que algo aconteceu, especialmente em arquiteturas orientadas a eventos.
- Exemplos:
  - Pedido foi criado (`OrderCreatedEvent`).
  - Dinheiro foi transferido (`MoneyTransferredEvent`).

---

## 4. Fluxo Típico de CQRS

### **Command Flow (Gravação)**
1. Uma ação de negócio é disparada (ex.: API recebe um `CreateOrderCommand`).
2. O `Command Bus` direciona o `Command` para o `Command Handler`.
3. O `Command Handler` executa a lógica (ex.: validações e chamadas ao domínio).
4. O estado do sistema é alterado (ex.: pedido é salvo no banco de gravação).
5. Um ou mais `Events` são publicados para o `Event Bus`.

### **Query Flow (Leitura)**
1. Uma solicitação de dados é disparada (ex.: API recebe um `GetOrderDetailsQuery`).
2. O `Query Bus` direciona a `Query` para o `Query Handler`.
3. O `Query Handler` consulta o banco de leitura ou cache e retorna os dados.

### **Event Flow (Reatividade)**
1. Um `Event` é publicado no `Event Bus` (ex.: `OrderCreatedEvent`).
2. O `Event Bus` encaminha o evento para os `Event Handlers` interessados.
3. Cada `Event Handler` realiza ações específicas (ex.: enviar um e-mail, atualizar um banco de leitura).

---


### Obs: **Não use eventos para disparar commands diretamente.**
- O papel de um evento é notificar que algo aconteceu, não instruir diretamente outra ação.
- Se um evento gera outro comando, isso deve ser explicitamente modelado por um **Event Handler**, que cria e envia o comando.
