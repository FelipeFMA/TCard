# Arduino RFID Access Control System

A modern web interface for managing RFID card access control using Arduino UNO and RFID-RC522 module.

## Features

- Beautiful and responsive web interface
- Two user roles: ADMIN and USER
- Real-time access events via WebSockets
- User management (add, edit, delete)
- SQLite database for user storage
- Arduino integration via Serial port

## Hardware Requirements

- Arduino UNO
- RFID-RC522 module
- Connection wires

## Hardware Setup

Connect the RFID-RC522 module to Arduino UNO as follows:

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

## Software Setup

### Arduino

1. Upload the provided Arduino sketch (`arduino/rfid_access_control.ino`) to your Arduino UNO.

### Server

1. Make sure Node.js is installed on your computer.
2. Navigate to the server directory:
   ```
   cd arduino-rfid-access/server
   ```
3. Install dependencies:
   ```
   npm install
   ```
4. Start the server:
   ```
   node index.js
   ```

### Access the Web Interface

Open your browser and go to http://localhost:3000

## Usage

### USER Mode

- Shows "Entrance allowed" or "Entrance not allowed" when a card is scanned
- Displays user information for authorized users
- Click "Scan Card" button to manually trigger a scan

### ADMIN Mode

- View all registered users
- Add new users with associated RFID cards
- Edit existing user information
- Activate/deactivate user access
- Delete users

## Adding New Users

1. Switch to ADMIN mode
2. Click "Add New User" button
3. Fill in user details
4. To scan a card for the ID, click the "Scan" button next to the Card ID field
5. Click "Save" to add the user

## Troubleshooting

- If the Arduino is not detected, ensure it's properly connected via USB
- The server automatically detects available serial ports
- Check the console for error messages

## License

This project is licensed under the MIT License - see the LICENSE file for details. 