#include "BLEDevice.h"
#include "BLEUtils.h"
#include "BLEServer.h"
#include "BLEBeacon.h"
#include <WiFi.h>
#include <HTTPClient.h>
#include <ArduinoJson.h>

// Configuration
#define WIFI_SSID ""
#define WIFI_PASSWORD ""
#define SERVER_URL "http://my_server_ip:3000/api/esp32/beacon"
#define ESP32_ID "ESP32_MINI"
#define BEACON_UUID "12345678-1234-1234-1234-123456789ABC"

// Global variables
BLEAdvertising *pAdvertising;
bool isAdvertising = false;
unsigned long lastHeartbeat = 0;
const unsigned long HEARTBEAT_INTERVAL = 30000; // 30 seconds

void setup() {
  Serial.begin(115200);
  delay(2000);
  Serial.println("Starting ESP32 Attendance Beacon...");
  
  // Connect to WiFi first
  connectToWiFi();
  delay(3000);
  
  Serial.println("Initializing BLE...");
  
  // Initialize BLE
  BLEDevice::init("ESP32_MINI");
  delay(2000);
  
  Serial.println("Creating advertising object...");
  
  // Create advertising object
  pAdvertising = BLEDevice::getAdvertising();
  delay(2000);
  
  Serial.println("Configuring advertisement...");
  
  // Configure advertisement
  BLEAdvertisementData oAdvertisementData = BLEAdvertisementData();
  oAdvertisementData.setFlags(0x1A);
  oAdvertisementData.setShortName("ESP32_MINI");
  oAdvertisementData.setCompleteServices(BLEUUID(BEACON_UUID));
  
  pAdvertising->setAdvertisementData(oAdvertisementData);
  pAdvertising->setMinInterval(0x20);
  pAdvertising->setMaxInterval(0x40);
  
  delay(2000);
  
  Serial.println("Starting advertising...");
  
  // Start advertising
  pAdvertising->start();
  isAdvertising = true;
  
  delay(2000);
  
  Serial.println("Beacon started successfully!");
  Serial.println("Device Name: OfficeBeacon");
  Serial.println("MAC Address: " + String(BLEDevice::getAddress().toString().c_str()));
  Serial.println("UUID: " + String(BEACON_UUID));
  Serial.println("Beacon is now advertising...");
}

void loop() {
  // Check if advertising is still active
  if (!isAdvertising) {
    Serial.println("Advertising stopped, restarting...");
    pAdvertising->start();
    isAdvertising = true;
  }
  
  // Send heartbeat to server every 30 seconds
  if (millis() - lastHeartbeat > HEARTBEAT_INTERVAL) {
    sendHeartbeat();
    lastHeartbeat = millis();
  }
  
  // Keep the beacon running
  delay(1000);
  
  // Print status every 60 seconds
  static unsigned long lastPrint = 0;
  if (millis() - lastPrint > 60000) {
    Serial.println("Beacon still advertising...");
    Serial.print("Free heap: ");
    Serial.println(ESP.getFreeHeap());
    lastPrint = millis();
  }
}

void connectToWiFi() {
  WiFi.begin(WIFI_SSID, WIFI_PASSWORD);
  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
  }
  Serial.println("WiFi connected!");
  Serial.print("IP address: ");
  Serial.println(WiFi.localIP());
}

void sendHeartbeat() {
  if (WiFi.status() == WL_CONNECTED) {
    HTTPClient http;
    http.begin(SERVER_URL);
    http.addHeader("Content-Type", "application/json");
    http.addHeader("X-ESP32-ID", ESP32_ID);
    
    DynamicJsonDocument doc(256);
    doc["esp32_id"] = ESP32_ID;
    doc["beacon_uuid"] = BEACON_UUID;
    doc["mac_address"] = String(BLEDevice::getAddress().toString().c_str());
    doc["timestamp"] = millis();
    doc["is_advertising"] = isAdvertising;
    
    String payload;
    serializeJson(doc, payload);
    
    int httpResponseCode = http.POST(payload);
    
    if (httpResponseCode > 0) {
      String response = http.getString();
      Serial.println("Heartbeat sent - Response Code: " + String(httpResponseCode));
    } else {
      Serial.println("Heartbeat failed - Error: " + String(httpResponseCode));
    }
    
    http.end();
  } else {
    Serial.println("WiFi not connected. Cannot send heartbeat.");
  }
}