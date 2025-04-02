<div align="center">
<h1>TCard | Premium Access Control System</h1>
  
  ![ezgif-18e4284d54978d](https://github.com/user-attachments/assets/4e7233ed-80b6-4c48-826b-b058e5a7781c)
  
</div>
</div>
<div align="center">
  <img src="https://img.shields.io/badge/College%20Project-UNIFRAN-8E9BAE?style=for-the-badge" alt="UNIFRAN College Project"/>
  <img src="https://img.shields.io/badge/Status-In%20Development-3BB77E?style=for-the-badge" alt="Status: In Development"/>
</div>

## 📋 Overview
**TCard** is a premium RFID access control system developed as a learning project at **UNIFRAN** (Universidade de Franca). It combines Arduino hardware with a modern web interface to create a feature-rich door access management solution.

## 🏗️ System Architecture

### Hardware Layer
The system's hardware component is built around an **Arduino UNO** microcontroller interfaced with an **MFRC522 RFID** reader module. The Arduino continuously polls for RFID card presence and communicates with the server via a serial connection at 9600 baud rate.

### Communication Layer
The system implements a bidirectional serial communication protocol between the Arduino and Node.js server:
- **Arduino → Server**: Sends `CARD:{UID}` messages when cards are scanned
- **Server → Arduino**: Returns `GRANTED` or `DENIED` access commands

### Application Layer
- **Backend**: A Node.js/Express server that:
  - Manages serial communication with Arduino
  - Implements RESTful API endpoints for user management
  - Persists data in SQLite3 through structured SQL queries
  - Broadcasts real-time events using Socket.io

- **Frontend**: A responsive single-page application using:
  - Vanilla JavaScript with event-driven architecture
  - CSS3 with Flexbox/Grid for responsive layouts
  - WebSocket connections for real-time updates
  - Local browser storage for user preferences

### Database Schema
The SQLite database implements a structured user management system:
```sql
CREATE TABLE users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  cardId TEXT UNIQUE NOT NULL,
  role TEXT NOT NULL,
  active INTEGER NOT NULL DEFAULT 1
);
```

## ✨ Features

- 🎨 **Elegant UI** - Beautiful, responsive interface with light/dark modes
- 👤 **Role-based Access** - Different permissions for admins and users
- ⚡ **Real-time Updates** - Instant access notifications via WebSockets
- 📊 **User Management** - Easily add, edit and remove users
- 🔒 **Security** - RFID card-based authentication system
- 💻 **Cross-platform** - Works on any device with a web browser

## 🛠️ Technology Stack

| Component | Technologies |
|-----------|-------------|
| **Frontend** | HTML5, CSS3, JavaScript, Socket.io |
| **Backend** | Node.js, Express, SQLite3, Socket.io |
| **Hardware** | Arduino UNO, RFID-RC522 Module |

## 🔌 Hardware Setup

Connect the RFID-RC522 module to Arduino UNO:

| RFID-RC522 Pin | Arduino UNO Pin |
|----------------|-----------------|
| SDA (SS)       | 10              |
| SCK            | 13              |
| MOSI           | 11              |
| MISO           | 12              |
| IRQ            | Not connected   |
| GND            | GND             |
| RST            | 9               |
| 3.3V           | 3.3V            |

## 💾 Technical Implementation

### RFID Card Detection
The Arduino sketch continuously polls for RFID cards using the MFRC522 library. When a card is detected:
1. The UID is read and formatted as a hexadecimal string
2. A `CARD:{UID}` message is sent via serial to the server
3. The system waits for server response to grant/deny access

### Server-side Authentication
1. Incoming card data is parsed from serial data buffer using string manipulation
2. Card UID is validated against the database with prepared SQL statements
3. Authentication result is transmitted to both:
   - Arduino (for physical access control)
   - Web clients (via Socket.io for real-time updates)

### RESTful API
The server exposes a complete REST API for user management:
- `GET /api/users` - List all users
- `POST /api/users` - Create new user
- `PUT /api/users/:id` - Update user details
- `DELETE /api/users/:id` - Remove a user

## 🚀 Getting Started

### Arduino Setup
1. Upload the sketch to your Arduino:
   ```
   arduino/rfid_access_control/rfid_access_control.ino
   ```

### Server Setup
1. Install dependencies:
   ```bash
   cd server
   npm install
   ```

2. Start the server:
   ```bash
   npm start
   ```

3. Access the web interface:
   ```
   http://localhost:3000
   ```

## 🧑‍💻 Usage

### User Mode
- Scan your RFID card to request access
- View your profile and access history

### Admin Mode
- Manage users (add, edit, deactivate, delete)
- Monitor access logs in real-time
- Configure system settings

## 🎓 Academic Purpose

This project was developed as part of the curriculum at **UNIFRAN** (Universidade de Franca) to demonstrate the integration of hardware and software technologies. It serves as a learning tool for:

- Full-stack web development
- IoT and hardware integration
- User interface design
- Database management
- Real-time communications

## 📄 License

This project is licensed under the Creative Commons CC BY-NC-ND License.

---

<div align="center">
  <p>Developed with ❤️ as a learning project at UNIFRAN</p>
</div> 
