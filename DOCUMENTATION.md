# TCard | Premium Access Control System

<div align="center">
  <img src="https://img.shields.io/badge/College%20Project-UNIFRAN-8E9BAE?style=for-the-badge" alt="UNIFRAN College Project"/>
  <img src="https://img.shields.io/badge/Status-In%20Development-3BB77E?style=for-the-badge" alt="Status: In Development"/>
</div>

## 📋 Visão Geral

**TCard** é um sistema premium de controle de acesso baseado em RFID, desenvolvido como um projeto acadêmico na **UNIFRAN** (Universidade de Franca). O sistema combina hardware Arduino com uma interface web moderna para criar uma solução completa de gerenciamento de acesso.

## 🧠 Ideia do Projeto

A ideia por trás do TCard surgiu da necessidade de criar um sistema de controle de acesso moderno, elegante e de fácil utilização para ambientes educacionais e corporativos. O projeto foi concebido como uma alternativa aos sistemas tradicionais de controle de acesso, oferecendo:

1. **Experiência de usuário premium** - Interface elegante e intuitiva
2. **Integração de hardware e software** - Combinando Arduino e tecnologias web
3. **Gerenciamento simplificado** - Administração fácil de usuários e permissões
4. **Feedback em tempo real** - Notificações instantâneas de eventos de acesso
5. **Arquitetura escalável** - Projetado para crescer conforme as necessidades

O TCard demonstra como tecnologias de hardware e software podem ser integradas para criar soluções práticas e elegantes para problemas do mundo real, servindo como um excelente projeto de aprendizado para estudantes de tecnologia.

## 🏗️ Arquitetura do Sistema

### Camada de Hardware
O componente de hardware do sistema é construído em torno de um microcontrolador **Arduino UNO** conectado a um módulo leitor RFID **MFRC522**. O Arduino monitora continuamente a presença de cartões RFID e se comunica com o servidor através de uma conexão serial a 9600 baud.

### Camada de Comunicação
O sistema implementa um protocolo de comunicação serial bidirecional entre o Arduino e o servidor Node.js:
- **Arduino → Servidor**: Envia mensagens `CARD:{UID}` quando cartões são escaneados
- **Servidor → Arduino**: Retorna comandos de acesso `GRANTED` ou `DENIED`

### Camada de Aplicação
- **Backend**: Um servidor Node.js/Express que:
  - Gerencia a comunicação serial com o Arduino
  - Implementa endpoints de API RESTful para gerenciamento de usuários
  - Persiste dados em SQLite3 através de consultas SQL estruturadas
  - Transmite eventos em tempo real usando Socket.io

- **Frontend**: Uma aplicação de página única responsiva usando:
  - JavaScript vanilla com arquitetura orientada a eventos
  - CSS3 com Flexbox/Grid para layouts responsivos
  - Conexões WebSocket para atualizações em tempo real
  - Armazenamento local do navegador para preferências do usuário

### Esquema do Banco de Dados
O banco de dados SQLite implementa um sistema estruturado de gerenciamento de usuários:
```sql
CREATE TABLE users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  cardId TEXT UNIQUE NOT NULL,
  role TEXT NOT NULL,
  active INTEGER NOT NULL DEFAULT 1
);
```

## ✨ Funcionalidades

- 🎨 **UI Elegante** - Interface bonita e responsiva com modos claro/escuro
- 👤 **Acesso Baseado em Funções** - Diferentes permissões para administradores e usuários
- ⚡ **Atualizações em Tempo Real** - Notificações instantâneas de acesso via WebSockets
- 📊 **Gerenciamento de Usuários** - Adicione, edite e remova usuários facilmente
- 🔒 **Segurança** - Sistema de autenticação baseado em cartões RFID
- 💻 **Multiplataforma** - Funciona em qualquer dispositivo com um navegador web

## 🛠️ Stack Tecnológica

| Componente | Tecnologias |
|-----------|-------------|
| **Frontend** | HTML5, CSS3, JavaScript, Socket.io |
| **Backend** | Node.js, Express, SQLite3, Socket.io |
| **Hardware** | Arduino UNO, Módulo RFID-RC522 |

## 🔌 Configuração do Hardware

Conecte o módulo RFID-RC522 ao Arduino UNO:

| Pino RFID-RC522 | Pino Arduino UNO |
|----------------|-----------------|
| SDA (SS)       | 10              |
| SCK            | 13              |
| MOSI           | 11              |
| MISO           | 12              |
| IRQ            | Não conectado   |
| GND            | GND             |
| RST            | 9               |
| 3.3V           | 3.3V            |

## 💾 Implementação Técnica

### Detecção de Cartão RFID
O sketch do Arduino monitora continuamente cartões RFID usando a biblioteca MFRC522. Quando um cartão é detectado:
1. O UID é lido e formatado como uma string hexadecimal
2. Uma mensagem `CARD:{UID}` é enviada via serial para o servidor
3. O sistema aguarda a resposta do servidor para conceder/negar acesso

O código do Arduino implementa um loop contínuo que verifica a presença de cartões RFID:
```cpp
void loop() {
  // Check for incoming commands
  if (Serial.available() > 0) {
    String command = Serial.readStringUntil('\n');
    command.trim();

    if (command == "SCAN") {
      Serial.println("Place a card to scan...");
    } else if (command == "GRANTED") {
      // You could trigger a green LED or relay here
      Serial.println("Access granted!");
    } else if (command == "DENIED") {
      // You could trigger a red LED here
      Serial.println("Access denied!");
    }
  }

  // Look for new cards
  if (!mfrc522.PICC_IsNewCardPresent()) {
    return;
  }

  // Select one of the cards
  if (!mfrc522.PICC_ReadCardSerial()) {
    return;
  }

  // Show card UID
  String cardID = getCardUID();
  Serial.print("CARD:");
  Serial.println(cardID);

  delay(1000); // Prevent multiple reads of same card
}
```

### Autenticação no Servidor
1. Os dados do cartão recebidos são analisados do buffer de dados serial usando manipulação de strings
2. O UID do cartão é validado no banco de dados com instruções SQL preparadas
3. O resultado da autenticação é transmitido para:
   - Arduino (para controle de acesso físico)
   - Clientes web (via Socket.io para atualizações em tempo real)

O processo de verificação de acesso no servidor é implementado da seguinte forma:
```javascript
function checkCardAccess(cardId) {
  console.log('Checking access for card:', cardId);
  db.get('SELECT * FROM users WHERE cardId = ? AND active = 1', [cardId], (err, user) => {
    if (err) {
      console.error('Database error:', err);
      sendAccessResponse(false, 'Database error');
      return;
    }

    if (user) {
      console.log(`Access granted to ${user.name}`);
      sendAccessResponse(true, user);
    } else {
      console.log(`Access denied for card ${cardId} - User not found or not active`);
      sendAccessResponse(false, { cardId });
    }
  });
}
```

### Fluxo de Comunicação Completo
O fluxo de comunicação entre o Arduino, servidor e cliente web segue estas etapas:

1. **Inicialização**:
   - O servidor Node.js inicia e configura o banco de dados SQLite
   - O servidor detecta e se conecta ao Arduino via porta serial
   - O cliente web se conecta ao servidor via WebSocket

2. **Escaneamento de Cartão**:
   - O usuário apresenta o cartão RFID ao leitor
   - O Arduino lê o UID do cartão e envia `CARD:{UID}` para o servidor
   - O servidor processa a mensagem e extrai o UID do cartão

3. **Verificação de Acesso**:
   - O servidor consulta o banco de dados para verificar se o cartão está registrado
   - O servidor determina se o acesso deve ser concedido ou negado

4. **Resposta**:
   - O servidor envia `GRANTED` ou `DENIED` para o Arduino
   - O servidor emite um evento WebSocket para todos os clientes web conectados
   - O Arduino pode acionar um LED ou relé com base na resposta
   - A interface web exibe o resultado da autenticação e os detalhes do usuário

### API RESTful
O servidor expõe uma API REST completa para gerenciamento de usuários:
- `GET /api/users` - Lista todos os usuários
- `POST /api/users` - Cria novo usuário
- `PUT /api/users/:id` - Atualiza detalhes do usuário
- `DELETE /api/users/:id` - Remove um usuário
- `GET /api/scan-card` - Envia uma solicitação de escaneamento para o Arduino

Cada endpoint implementa validação de entrada e tratamento de erros adequado:
```javascript
app.post('/api/users', (req, res) => {
  const { name, cardId, role = 'user' } = req.body;

  if (!name || !cardId) {
    return res.status(400).json({ error: 'Name and cardId are required' });
  }

  db.run('INSERT INTO users (name, cardId, role, active) VALUES (?, ?, ?, 1)',
    [name, cardId, role],
    function(err) {
      if (err) {
        if (err.message.includes('UNIQUE constraint failed')) {
          return res.status(409).json({ error: 'Card ID already exists' });
        }
        console.error(err);
        return res.status(500).json({ error: 'Database error' });
      }

      res.status(201).json({
        id: this.lastID,
        name,
        cardId,
        role,
        active: 1
      });
    }
  );
});
```

## 🚀 Começando

### Configuração do Arduino
1. Faça upload do sketch para o seu Arduino:
   ```
   arduino/rfid_access_control/rfid_access_control.ino
   ```

### Configuração do Servidor
1. Instale as dependências:
   ```bash
   cd server
   npm install
   ```

2. Inicie o servidor:
   ```bash
   npm start
   ```

3. Acesse a interface web:
   ```
   http://localhost:3000
   ```

## 🧑‍💻 Uso

### Modo Usuário
- Escaneie seu cartão RFID para solicitar acesso
- Visualize seu perfil e histórico de acesso
- Receba feedback visual imediato sobre o status do acesso

O fluxo de trabalho do modo usuário é simples e intuitivo:
1. O usuário apresenta seu cartão RFID ao leitor
2. O sistema processa a solicitação e verifica as credenciais
3. Feedback visual é fornecido (verde para acesso concedido, vermelho para negado)
4. Os detalhes do usuário são exibidos na interface quando o acesso é concedido

### Modo Administrador
- Gerencie usuários (adicionar, editar, desativar, excluir)
- Monitore logs de acesso em tempo real
- Configure as configurações do sistema

O modo administrador oferece funcionalidades avançadas de gerenciamento:

#### Adição de Usuários
1. Clique no botão "Add New User"
2. Preencha o nome do usuário
3. Escaneie um novo cartão RFID ou insira o ID manualmente
4. Selecione a função do usuário (usuário ou administrador)
5. Salve as informações

#### Edição de Usuários
1. Clique no ícone de edição ao lado do usuário desejado
2. Modifique as informações necessárias
3. Salve as alterações

#### Exclusão de Usuários
1. Clique no ícone de exclusão ao lado do usuário desejado
2. Confirme a ação na caixa de diálogo de confirmação

#### Pesquisa de Usuários
- Use a barra de pesquisa para filtrar usuários por nome ou ID do cartão
- Os resultados são atualizados em tempo real conforme você digita

## 📂 Estrutura do Projeto

```
TCard/
├── arduino/
│   └── rfid_access_control/
│       └── rfid_access_control.ino  # Código do Arduino
├── client/
│   ├── index.html                   # Página principal da interface
│   ├── styles.css                   # Estilos CSS
│   └── app.js                       # Lógica JavaScript do cliente
├── server/
│   ├── index.js                     # Servidor Node.js principal
│   ├── package.json                 # Dependências do projeto
│   └── users.db                     # Banco de dados SQLite (gerado)
└── README.md                        # Documentação do projeto
```

## 🔍 Detalhes de Implementação

### Comunicação Serial
O servidor Node.js estabelece uma conexão serial com o Arduino usando a biblioteca SerialPort. O sistema:
1. Detecta automaticamente portas seriais disponíveis
2. Conecta-se à primeira porta disponível
3. Mantém um buffer para processar dados recebidos
4. Analisa comandos específicos como `CARD:{UID}`

O código implementa um sistema robusto de processamento de buffer para garantir que nenhuma informação seja perdida durante a comunicação serial:
```javascript
port.on('data', (data) => {
  buffer += data.toString();

  // Process buffer if it contains a newline or if it contains CARD:
  if (buffer.includes('\n') || buffer.includes('CARD:')) {
    let lines = [];

    if (buffer.includes('\n')) {
      lines = buffer.split('\n');
      buffer = lines.pop(); // Keep the incomplete line
    } else {
      // If no newline but contains CARD:, treat the whole buffer as a line
      lines = [buffer];
      buffer = '';
    }

    lines.forEach(line => {
      if (line.includes('CARD:')) {
        const cardId = line.substring(line.indexOf('CARD:') + 5).trim();
        checkCardAccess(cardId);
      }
    });
  }
});
```

### Autenticação de Administrador
O sistema implementa dois métodos de autenticação para acesso administrativo:
1. **Autenticação por senha** - Senha simples "admin" para fins de demonstração
2. **Autenticação por cartão** - Verificação de cartões com função de administrador

A autenticação por cartão utiliza o mesmo fluxo de verificação de acesso regular, mas com uma verificação adicional da função do usuário:
```javascript
function handleAccessEvent(event) {
  if (isAuthenticating) {
    // Handle authentication with admin card
    if (event.userData && event.userData.role === 'admin') {
      isAuthenticating = false;
      authenticationSuccess();
    } else {
      isAuthenticating = false;
      showAuthError('Invalid admin card. Please use an authorized admin card.');
    }
    return;
  }

  // Regular access handling...
}
```

### Interface Responsiva
A interface do usuário é projetada para funcionar em dispositivos de todos os tamanhos:
1. Layout flexível que se adapta a diferentes tamanhos de tela
2. Elementos de UI otimizados para interação por toque
3. Animações suaves para melhorar a experiência do usuário
4. Tema escuro para reduzir o cansaço visual

O CSS utiliza variáveis personalizadas para facilitar a manutenção e a troca entre temas:
```css
:root {
  --primary-color: #8E9BAE;
  --primary-dark: #667A94;
  --primary-gradient: linear-gradient(135deg, #A8B2C1, #667A94);
  /* Outras variáveis... */
}

body.dark-mode {
  --bg-color: #1A202C;
  --card-bg: #2D3748;
  --text-primary: #E5E9F0;
  /* Outras variáveis para o tema escuro... */
}
```

### Notificações em Tempo Real
O sistema utiliza WebSockets (Socket.io) para fornecer atualizações instantâneas:
1. Eventos de acesso são transmitidos para todos os clientes conectados
2. Notificações visuais informam sobre eventos importantes
3. A interface do usuário é atualizada dinamicamente sem necessidade de recarregar

O servidor emite eventos de acesso para todos os clientes conectados:
```javascript
function sendAccessResponse(granted, userData) {
  const response = granted ? 'GRANTED' : 'DENIED';

  if (port && port.isOpen) {
    port.write(`${response}\n`);
  }

  io.emit('access-event', {
    granted,
    userData,
    timestamp: new Date().toISOString()
  });
}
```

## 🔒 Considerações de Segurança

O TCard foi desenvolvido como um projeto educacional e, embora implemente várias práticas de segurança, existem considerações importantes para implementações em ambientes reais:

### Implementado
- **Validação de entrada** - Todos os inputs são validados antes do processamento
- **Consultas SQL parametrizadas** - Prevenção contra injeção SQL
- **Autenticação de administrador** - Acesso restrito às funcionalidades administrativas
- **Feedback visual limitado** - Informações de erro genéricas para usuários não autorizados

### Melhorias Recomendadas para Ambientes de Produção
- **Criptografia de dados** - Implementar criptografia para IDs de cartão armazenados
- **HTTPS** - Configurar SSL/TLS para comunicação segura
- **Autenticação robusta** - Implementar autenticação de dois fatores para administradores
- **Logs de auditoria** - Registrar todas as ações administrativas e tentativas de acesso
- **Backup automático** - Configurar backups regulares do banco de dados

## 🔮 Melhorias Futuras

O TCard tem potencial para expansão com várias funcionalidades adicionais:

### Funcionalidades Planejadas
1. **Histórico de Acesso** - Registro e visualização completa do histórico de acessos
2. **Agendamento de Acesso** - Definir horários específicos para permissões de acesso
3. **Grupos de Usuários** - Criar grupos com diferentes níveis de acesso
4. **Notificações por Email** - Alertas para tentativas de acesso não autorizadas
5. **Integração com Câmera** - Captura de imagem quando o acesso é concedido/negado
6. **Aplicativo Móvel** - Interface dedicada para dispositivos móveis
7. **Múltiplos Dispositivos** - Suporte para vários leitores RFID em diferentes locais
8. **Relatórios Analíticos** - Estatísticas e visualizações de dados de acesso

### Melhorias Técnicas
1. **Arquitetura de Microsserviços** - Dividir o sistema em serviços independentes
2. **API GraphQL** - Implementar uma API GraphQL para consultas mais flexíveis
3. **Testes Automatizados** - Adicionar testes unitários e de integração
4. **CI/CD** - Configurar pipeline de integração e entrega contínua
5. **Containerização** - Empacotar a aplicação em contêineres Docker

## 🎓 Propósito Acadêmico

Este projeto foi desenvolvido como parte do currículo da **UNIFRAN** (Universidade de Franca) para demonstrar a integração de tecnologias de hardware e software. Ele serve como uma ferramenta de aprendizado para:

- Desenvolvimento web full-stack
- Integração de IoT e hardware
- Design de interface de usuário
- Gerenciamento de banco de dados
- Comunicações em tempo real
- Segurança de aplicações
- Experiência do usuário (UX)

## 📄 Licença

Este projeto está licenciado sob a Licença Creative Commons CC BY-NC-ND.

---

<div align="center">
  <p>Desenvolvido com ❤️ como um projeto de aprendizado na UNIFRAN</p>
</div>
