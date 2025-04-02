const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const { SerialPort } = require('serialport');
const http = require('http');
const socketIo = require('socket.io');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');

// Initialize Express
const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST']
  }
});

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, '../client')));

// Initialize Database
const db = new sqlite3.Database('./users.db');
db.serialize(() => {
  db.run(`CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    cardId TEXT UNIQUE NOT NULL,
    role TEXT NOT NULL,
    active INTEGER NOT NULL DEFAULT 1
  )`);
});

// Arduino Serial Connection
let port;
let availablePorts = [];

async function listPorts() {
  try {
    availablePorts = await SerialPort.list();
    console.log('Available ports:', availablePorts.map(p => p.path));
    
    if (availablePorts.length > 0) {
      connectToArduino(availablePorts[0].path);
    } else {
      console.log('No Arduino detected. Please connect Arduino and restart server.');
    }
  } catch (err) {
    console.error('Error listing serial ports:', err);
  }
}

function connectToArduino(portPath) {
  port = new SerialPort({
    path: portPath,
    baudRate: 9600
  });

  let buffer = '';
  
  port.on('open', () => {
    console.log('Serial port opened at', portPath);
  });

  port.on('data', (data) => {
    const dataString = data.toString().trim();
    buffer += dataString;
    
    if (buffer.includes('\n')) {
      const lines = buffer.split('\n');
      buffer = lines.pop(); // Keep the incomplete line
      
      lines.forEach(line => {
        if (line.startsWith('CARD:')) {
          const cardId = line.replace('CARD:', '').trim();
          checkCardAccess(cardId);
        }
      });
    }
  });

  port.on('error', (err) => {
    console.error('Serial port error:', err.message);
  });
}

function checkCardAccess(cardId) {
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
      console.log(`Access denied for card ${cardId}`);
      sendAccessResponse(false, { cardId });
    }
  });
}

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

// API Routes
app.get('/api/users', (req, res) => {
  db.all('SELECT * FROM users ORDER BY name', (err, rows) => {
    if (err) {
      console.error(err);
      return res.status(500).json({ error: 'Database error' });
    }
    res.json(rows);
  });
});

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

app.put('/api/users/:id', (req, res) => {
  const { id } = req.params;
  const { name, cardId, role, active } = req.body;
  
  db.run(
    'UPDATE users SET name = ?, cardId = ?, role = ?, active = ? WHERE id = ?',
    [name, cardId, role, active ? 1 : 0, id],
    function(err) {
      if (err) {
        console.error(err);
        return res.status(500).json({ error: 'Database error' });
      }
      
      if (this.changes === 0) {
        return res.status(404).json({ error: 'User not found' });
      }
      
      res.json({ id, name, cardId, role, active });
    }
  );
});

app.delete('/api/users/:id', (req, res) => {
  const { id } = req.params;
  
  db.run('DELETE FROM users WHERE id = ?', [id], function(err) {
    if (err) {
      console.error(err);
      return res.status(500).json({ error: 'Database error' });
    }
    
    if (this.changes === 0) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    res.status(204).send();
  });
});

app.get('/api/scan-card', (req, res) => {
  if (port && port.isOpen) {
    port.write('SCAN\n');
    res.json({ message: 'Scan request sent to Arduino' });
  } else {
    res.status(500).json({ error: 'Arduino not connected' });
  }
});

// Serve client app
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../client/index.html'));
});

// WebSocket Events
io.on('connection', (socket) => {
  console.log('Client connected');
  
  socket.on('request-scan', () => {
    if (port && port.isOpen) {
      port.write('SCAN\n');
    }
  });
  
  socket.on('disconnect', () => {
    console.log('Client disconnected');
  });
});

// Start server
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  listPorts();
});

// Handle graceful shutdown
process.on('SIGINT', () => {
  console.log('Shutting down server...');
  if (port && port.isOpen) {
    port.close();
  }
  db.close();
  server.close(() => {
    process.exit(0);
  });
}); 