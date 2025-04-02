#include <SPI.h>
#include <MFRC522.h>

#define RST_PIN 9
#define SS_PIN 10

MFRC522 mfrc522(SS_PIN, RST_PIN);  // Create MFRC522 instance

void setup() {
  Serial.begin(9600);   // Initialize serial communications
  while (!Serial);      // Wait for serial port to connect
  
  SPI.begin();          // Init SPI bus
  mfrc522.PCD_Init();   // Init MFRC522
  
  Serial.println("RFID Access Control Ready");
  printDetails();
}

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

String getCardUID() {
  String cardID = "";
  for (byte i = 0; i < mfrc522.uid.size; i++) {
    cardID += (mfrc522.uid.uidByte[i] < 0x10 ? "0" : "");
    cardID += String(mfrc522.uid.uidByte[i], HEX);
  }
  cardID.toUpperCase();
  return cardID;
}

void printDetails() {
  Serial.println(F("RFID-RC522 Access Control"));
  Serial.print(F("Card Reader: "));
  mfrc522.PCD_DumpVersionToSerial();
} 