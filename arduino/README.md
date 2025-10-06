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

### **שרת Heartbeat**
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
- לוח  ESP32S3
- **כבל USB** (Micro-USB או USB-C, תלוי בדגם)
- **ספק כוח** (5V, 1A מינימום)


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
2. חפש ןהתקן " ESP32S3 Dev moudle"

### 3. התקנת ספריות נדרשות
עבור ל: **Sketch → Include Library → Manage Libraries**

התקן את הספריות הבאות:
- ** ESP32 BLE Arduino** (מובנה עם חבילת ESP32)
- **HTTPClient** (מובנה)
- **WiFi** (מובנה)
- **ArduinoJson** (אופציונלי, אם נדרש)

## ⚙️ הגדרה

### 1. פתח את הקוד
פתח את הקובץ `ESP32_Attendance_Beacon/ESP32_Attendance_Beacon.ino` ב-Arduino IDE

### 2. ערוך את ההגדרות
מצא ועדכן את השורות הבאות בקוד:

```cpp
#define WIFI_SSID ""
#define WIFI_PASSWORD ""
#define SERVER_URL "http://my_server_ip:3000/api/esp32/beacon"
#define ESP32_ID "ESP32_MINI"
```

### 3. רשום את המכשיר במסד הנתונים
ודא שהמכשיר רשום במערכת , תשתהש באתר להוסיף אותן אם צריך, נשם שלו יהי זהה לשם של ה ESP32_ID.


## 📤 העלאה ל-ESP32

### 1. חבר את המכשיר
- חבר את ה-ESP32 למחשב דרך כבל USB
- המתן לזיהוי המכשיר (LED אדום אמור להידלק)

### 2. בחר את הלוח
1. עבור ל: **Tools → Board → ESP32 Arduino**
2. בחר את דגם הלוח שלך (לדוגמה: "ESP32S3 Dev Module")

### 3. בחר את הפורט
1. עבור ל: **Tools → Port**
2. בחר את הפורט שבו ה-ESP32 מחובר

### 4. העלה את הקוד
1. לחץ על כפתור **Upload** 
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
1. ה ESP32 מופעל
2. מתחבר לרשת WiFi
3. מאתחל שירות Bluetooth BLE
4. מתחיל לשדר כמשואה (Beacon)
5. שולח Heartbeat לשרת כל 30 שניות
6. אפליקציות נייד מזהות את המשואה
7. אפליקציות מדווחות על נוכחות לשרת
```

### שידור Bluetooth
- **שם מכשיר**: `ESP32_MINI` (או כפי שהוגדר)
- **מצב**: Advertising (שידור רציף)
- **טווח**: ~10-30 מטר
- **צריכת חשמל**: ~100mA

### שידור Heartbeat לשרת
- **תדירות**: כל 30 שניות
- **נקודת קצה**: `POST /api/esp32/heartbeat`
- **נתונים**: `{ esp32_id, timestamp }`

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
## 🛠️ פתרון בעיות

### ה WiFi לא מתחבר
**בעיה**: `WiFi connection failed`

**פתרונות**:
1. ✅ בדוק ששם הרשת והסיסמה נכונים
2. ✅ ודא שהרשת היא 2.4GHz (ESP32 לא תומך ב-5GHz)
3. ✅ בדוק שהרשת פעילה ובטווח
4. ✅ נסה לאפס את ה-ESP32 (לחץ על כפתור RESET)
5. ✅ בדוק שאין תווים מיוחדים בסיסמה

### ה Bluetooth לא עובד
**בעיה**: `BLE initialization failed`

**פתרונות**:
1. ✅ אפס את ה-ESP32
2. ✅ בדוק שהקוד קומפל בהצלחה
3. ✅ ודא שהספרייה "ESP32 BLE Arduino" מותקנת
4. ✅ נסה לשנות את שם המכשיר לשם פשוט יותר
5. ✅ העלה את הקוד מחדש

### ה Heartbeat נכשל
**בעיה**: `Heartbeat sent - Response Code: 401` או `403`

**פתרונות**:
1. ✅ ודא שהמכשיר רשום במסד הנתונים
2. ✅ בדוק שה-`esp32_id` תואם למסד הנתונים
3. ✅ אמת שהשרת Backend פועל
4. ✅ בדוק את כתובת IP והפורט של השרת

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



# 📁 מבנה הקוד

```
arduino/
├── ESP32_Attendance_Beacon/
│   └── ESP32_Attendance_Beacon.ino   # קוד ראשי
└── README.md                          # מסמך זה
```


### ניתוב API Endpoints
| Endpoint               | Method  | תיאור           |
|------------------------|---------|-----------------|
| `/api/esp32/heartbeat` | POST    | שליחת heartbeat |
| `/api/esp32/status`    | GET     | קבלת סטטוס      |

## 🚀 שדרוגים עתידיים

### תכונות מתוכננות
- [ ] תמיכה ב-WiFi 5GHz
- [ ] מצב חיסכון בחשמל
- [ ] תצוגת LCD לסטטוס
- [ ] תמיכה במספר רשתות WiFi


