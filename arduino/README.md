# 🔧 משואת נוכחות ESP32

מכשיר ESP32 שמשמש כמשואת Bluetooth (Beacon) לזיהוי אוטומטי של נוכחות עובדים. המכשיר משדר את עצמו ברציפות ושולח heartbeat לשרת.

## 🎯 סקירה כללית

ה-ESP32 משמש כנקודת ייחוס קבועה במשרד. כאשר אפליקציית הנייד של עובד מזהה את המשואה, היא מדווחת על נוכחות לשרת. זהו הפתרון האופטימלי לזיהוי נוכחות אוטומטי ללא צורך בהתערבות משתמש.

## ✨ תכונות

### 📡 **משואת Bluetooth**
- **שידור רציף**: משדר את שם המכשיר ברציפות
- **זיהוי קל**: אפליקציות הנייד יכולות לזהות את המשואה בקלות
- **טווח**: עד 30 מטר (תלוי בסביבה)
- **צריכת חשמל נמוכה**: מתאים לפעולה 24/7

### 💓 **Heartbeat לשרת**
- **דיווח תקופתי**: שולח heartbeat כל 30 שניות
- **ניטור מצב**: השרת יודע אם המכשיר פעיל
- **עדכון סטטוס**: מעדכן את מסד הנתונים שהמכשיר online
- **אבטחה**: כולל JWT token לאימות

### 🌐 **חיבור WiFi**
- **חיבור אוטומטי**: מתחבר ל-WiFi בהפעלה
- **תמיכה ב-2.4GHz**: עובד עם רשתות WiFi סטנדרטיות
- **ניסיון חוזר אוטומטי**: מנסה להתחבר מחדש במקרה של ניתוק

## 🔧 חומרה נדרשת

### רכיבים
- **לוח פיתוח ESP32** (כל דגם)
  - ESP32-WROOM-32
  - ESP32-DevKitC
  - ESP32-MINI
- **כבל USB** (Micro-USB או USB-C, תלוי בדגם)
- **ספק כוח** (5V, 1A מינימום)

### מפרט טכני
- **WiFi**: 802.11 b/g/n (2.4GHz בלבד)
- **Bluetooth**: BLE 4.2
- **זיכרון**: 520KB SRAM
- **מתח הזנה**: 5V דרך USB או 3.3V ישיר

## 💻 התקנת תוכנה

### 1. התקנת Arduino IDE
1. הורד והתקן [Arduino IDE](https://www.arduino.cc/en/software)
2. פתח את Arduino IDE
3. עבור ל: **File → Preferences**
4. ב-"Additional Board Manager URLs" הוסף:
   ```
   https://raw.githubusercontent.com/espressif/arduino-esp32/gh-pages/package_esp32_index.json
   ```
5. לחץ OK

### 2. התקנת לוח ESP32
1. עבור ל: **Tools → Board → Boards Manager**
2. חפש "ESP32"
3. התקן את "ESP32 by Espressif Systems"
4. המתן לסיום ההתקנה

### 3. התקנת ספריות נדרשות
עבור ל: **Sketch → Include Library → Manage Libraries**

התקן את הספריות הבאות:
- **ESP32 BLE Arduino** (מובנה עם חבילת ESP32)
- **HTTPClient** (מובנה)
- **WiFi** (מובנה)
- **ArduinoJson** (אופציונלי, אם נדרש)

## ⚙️ הגדרה

### 1. פתח את הקוד
פתח את הקובץ `ESP32_Attendance_Beacon/ESP32_Attendance_Beacon.ino` ב-Arduino IDE

### 2. ערוך את ההגדרות
מצא ועדכן את השורות הבאות בקוד:

```cpp
// הגדרות WiFi
const char* WIFI_SSID = "שם_הרשת_שלך";        // שם רשת WiFi
const char* WIFI_PASSWORD = "סיסמת_הרשת_שלך";  // סיסמת WiFi

// הגדרות שרת
const char* SERVER_IP = "10.0.0.4";             // IP של שרת Backend
const int SERVER_PORT = 3000;                   // פורט של שרת Backend

// הגדרות מכשיר
const char* DEVICE_NAME = "ESP32_MINI";         // שם המכשיר (חייב להיות רשום במסד הנתונים)
const char* JWT_TOKEN = "your_jwt_token_here";  // JWT token לאימות
```

### 3. קבל JWT Token
1. התחבר לשרת Backend כמנהל
2. צור JWT token למכשיר ESP32
3. העתק את ה-token והדבק בקוד

### 4. רשום את המכשיר במסד הנתונים
ודא שהמכשיר רשום בטבלת `esp32_devices`:
```sql
INSERT INTO esp32_devices (esp32_id, location, status) 
VALUES ('ESP32_MINI', 'Office Center', 'active');
```

## 📤 העלאה ל-ESP32

### 1. חבר את המכשיר
- חבר את ה-ESP32 למחשב דרך כבל USB
- המתן לזיהוי המכשיר (LED אדום אמור להידלק)

### 2. בחר את הלוח
1. עבור ל: **Tools → Board → ESP32 Arduino**
2. בחר את דגם הלוח שלך (לדוגמה: "ESP32 Dev Module")

### 3. בחר את הפורט
1. עבור ל: **Tools → Port**
2. בחר את הפורט שבו ה-ESP32 מחובר
   - **Mac**: `/dev/cu.usbserial-*` או `/dev/cu.SLAB_USBtoUART`
   - **Windows**: `COM3`, `COM4`, וכו'
   - **Linux**: `/dev/ttyUSB0` או `/dev/ttyACM0`

### 4. העלה את הקוד
1. לחץ על כפתור **Upload** (חץ ימינה)
2. המתן לקומפילציה והעלאה
3. תראה הודעה: "Hard resetting via RTS pin..."
4. ההעלאה הושלמה!

### 5. פתח Serial Monitor
1. לחץ על **Tools → Serial Monitor**
2. הגדר baud rate ל-**115200**
3. תראה את לוגי ההפעלה

## 📊 איך זה עובד

### תהליך הפעולה

```
1. ESP32 מופעל
   ↓
2. מתחבר לרשת WiFi
   ↓
3. מאתחל שירות Bluetooth BLE
   ↓
4. מתחיל לשדר כמשואה (Beacon)
   ↓
5. שולח Heartbeat לשרת כל 30 שניות
   ↓
6. אפליקציות נייד מזהות את המשואה
   ↓
7. אפליקציות מדווחות על נוכחות לשרת
```

### שידור Bluetooth
- **שם מכשיר**: `ESP32_MINI` (או כפי שהוגדר)
- **מצב**: Advertising (שידור רציף)
- **טווח**: ~10-30 מטר
- **צריכת חשמל**: ~100mA

### Heartbeat לשרת
- **תדירות**: כל 30 שניות
- **נקודת קצה**: `POST /api/esp32/heartbeat`
- **נתונים**: `{ esp32_id, timestamp }`
- **אימות**: JWT token בכותרות

## 🖥️ פלט Serial Monitor

### הפעלה תקינה
```
Starting ESP32 Attendance Beacon...
WiFi connecting...
WiFi connected!
IP address: 10.0.0.12
Initializing BLE...
BLE initialized successfully!
Starting beacon advertising...
Beacon started successfully!
Device Name: ESP32_MINI

Sending heartbeat...
Heartbeat sent - Response Code: 200

Free heap: 140932
```

### הסברים
- **WiFi connected**: חיבור WiFi הצליח
- **IP address**: כתובת IP שהתקבלה
- **BLE initialized**: Bluetooth הופעל בהצלחה
- **Beacon started**: המשואה משדרת
- **Heartbeat sent - 200**: השרת קיבל את ה-heartbeat
- **Free heap**: זיכרון פנוי (לניטור)

## 🛠️ פתרון בעיות

### WiFi לא מתחבר
**בעיה**: `WiFi connection failed`

**פתרונות**:
1. ✅ בדוק ששם הרשת והסיסמה נכונים
2. ✅ ודא שהרשת היא 2.4GHz (ESP32 לא תומך ב-5GHz)
3. ✅ בדוק שהרשת פעילה ובטווח
4. ✅ נסה לאפס את ה-ESP32 (לחץ על כפתור RESET)
5. ✅ בדוק שאין תווים מיוחדים בסיסמה

### Bluetooth לא עובד
**בעיה**: `BLE initialization failed`

**פתרונות**:
1. ✅ אפס את ה-ESP32
2. ✅ בדוק שהקוד קומפל בהצלחה
3. ✅ ודא שהספרייה "ESP32 BLE Arduino" מותקנת
4. ✅ נסה לשנות את שם המכשיר לשם פשוט יותר
5. ✅ העלה את הקוד מחדש

### Heartbeat נכשל
**בעיה**: `Heartbeat sent - Response Code: 401` או `403`

**פתרונות**:
1. ✅ בדוק שה-JWT token נכון ותקף
2. ✅ ודא שהמכשיר רשום במסד הנתונים
3. ✅ בדוק שה-`esp32_id` תואם למסד הנתונים
4. ✅ אמת שהשרת Backend פועל
5. ✅ בדוק את כתובת IP והפורט של השרת

### אפליקציה לא מזהה את המכשיר
**בעיה**: האפליקציה לא רואה את ה-ESP32

**פתרונות**:
1. ✅ בדוק ש-Bluetooth מופעל בטלפון
2. ✅ ודא שהטלפון בטווח (עד 30 מטר)
3. ✅ אמת ששם המכשיר ב-ESP32 תואם למסד הנתונים
4. ✅ בדוק ב-Serial Monitor שהמשואה משדרת
5. ✅ נסה לאפס את ה-ESP32 ולהפעיל מחדש את האפליקציה

### זיכרון נמוך
**בעיה**: `Free heap` יורד מתחת ל-50000

**פתרונות**:
1. ✅ אפס את ה-ESP32 מעת לעת
2. ✅ בדוק אם יש דליפות זיכרון בקוד
3. ✅ הפחת את תדירות ה-heartbeat
4. ✅ שקול שדרוג לדגם ESP32 עם יותר זיכרון

## 📋 תחזוקה

### תחזוקה שוטפת
- **בדיקה יומית**: בדוק ב-Dashboard שהמכשיר online
- **ניקוי**: נקה את המכשיר מאבק מעת לעת
- **עדכון**: שמור על הקוד מעודכן
- **גיבוי**: שמור עותק של ההגדרות

### החלפת JWT Token
אם צריך לעדכן את ה-token:
1. צור token חדש בשרת
2. עדכן את `JWT_TOKEN` בקוד
3. העלה את הקוד מחדש ל-ESP32

### שינוי מיקום
אם מעבירים את המכשיר למיקום אחר:
1. עדכן את `location` במסד הנתונים
2. עדכן את `DEVICE_NAME` אם נדרש
3. ודא שיש כיסוי WiFi במיקום החדש

## 🔒 אבטחה

### שיקולי אבטחה
- **JWT Token**: שמור את ה-token בסוד
- **WiFi**: השתמש ברשת מאובטחת (WPA2/WPA3)
- **גישה פיזית**: שמור את המכשיר במקום מאובטח
- **עדכונים**: עדכן את הקוד כשיש תיקוני אבטחה

### המלצות
- 🔐 אל תשתף את ה-JWT token
- 🔐 החלף את ה-token מעת לעת
- 🔐 השתמש ברשת WiFi ייעודית למכשירי IoT
- 🔐 נטר את לוגי ה-Serial Monitor לפעילות חשודה

## 📁 מבנה הקוד

```
arduino/
├── ESP32_Attendance_Beacon/
│   └── ESP32_Attendance_Beacon.ino   # קוד ראשי
└── README.md                          # מסמך זה
```

### קובץ הקוד הראשי
- **הגדרות WiFi ושרת**: שורות 1-20
- **אתחול**: `setup()` - שורות 30-80
- **לולאה ראשית**: `loop()` - שורות 90-120
- **פונקציות עזר**: שורות 130-200

## 🎯 מפרט טכני מלא

### פרמטרים
| פרמטר | ערך | הערות |
|-------|-----|-------|
| תדירות WiFi | 2.4GHz | לא תומך ב-5GHz |
| Bluetooth | BLE 4.2 | Low Energy |
| טווח BLE | 10-30m | תלוי בסביבה |
| מתח הזנה | 5V / 3.3V | דרך USB או ישיר |
| צריכת זרם | ~100mA | בזמן שידור |
| Heartbeat | 30 שניות | ניתן להגדרה |
| Baud Rate | 115200 | Serial Monitor |

### API Endpoints
| Endpoint | Method | תיאור |
|----------|--------|--------|
| `/api/esp32/heartbeat` | POST | שליחת heartbeat |
| `/api/esp32/status` | GET | קבלת סטטוס |

## 🚀 שדרוגים עתידיים

### תכונות מתוכננות
- [ ] תמיכה ב-WiFi 5GHz
- [ ] מצב חיסכון בחשמל
- [ ] OTA (Over-The-Air) updates
- [ ] תצוגת LCD לסטטוס
- [ ] כפתור reset פיזי
- [ ] LED לאינדיקציית סטטוס
- [ ] תמיכה במספר רשתות WiFi
- [ ] מצב AP (Access Point) להגדרה

## 📞 תמיכה

לתמיכה טכנית:
1. בדוק את Serial Monitor ללוגים
2. עיין בקטע פתרון הבעיות
3. בדוק את חיבור הרשת
4. אמת הגדרות בקוד
5. צור קשר עם מנהל המערכת

## 📚 משאבים נוספים

- [תיעוד ESP32](https://docs.espressif.com/projects/esp-idf/en/latest/esp32/)
- [Arduino IDE](https://www.arduino.cc/en/software)
- [ESP32 BLE](https://github.com/nkolban/ESP32_BLE_Arduino)
- [פורום ESP32](https://www.esp32.com/)

---

**נבנה עם ❤️ עבור מערכת נוכחות אוטומטית**

זהו! ה-ESP32 שלך מוכן לשמש כמשואת נוכחות! 🎉