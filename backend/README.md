# 🖥️ שרת המערכת

שרת Node.js המנהל את כל הנתונים והחיבורים במערכת הנוכחות.

## מה זה עושה
- שומר נתוני עובדים ומחלקות
- מנהל נוכחות אוטומטית עם שירות רקע
- מתחבר ל-ESP32
- מספק API לדשבורד ולאפליקציה הניידת
- מטפל באימות משתמשים
- מעדכן סטטוס נוכחות אוטומטית כל דקה

## התקנה

### 1. התקנת חבילות
```bash
npm install
```

### 2. הגדרת בסיס נתונים
```bash
# יצירת בסיס נתונים
mysql -u root -p
CREATE DATABASE attendance_system;

# ייבוא סכמה
mysql -u root -p attendance_system < ../schema.sql
```

### 3. הגדרת משתני סביבה
צור קובץ `.env` עם:
```env
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_password
DB_NAME=attendance_system
JWT_SECRET=your_jwt_secret
PORT=3000
```

### 4. הפעלה
```bash
npm start
```

## מה תראה
```
✅ Database connected successfully
🚀 Server running on port 3000
📊 Dashboard available at http://localhost:3000
🔌 API endpoints available at http://localhost:3000/api
🔄 Starting presence background service...
🔍 Checking employee presence status...
✅ Updated presence status for 3 employees
```

## API Endpoints

### אימות
- `POST /api/auth/login` - התחברות משתמש
- `POST /api/auth/logout` - התנתקות
- `GET /api/auth/me` - קבלת פרטי משתמש נוכחי

### עובדים
- `GET /api/employees` - קבלת כל העובדים
- `POST /api/employees` - יצירת עובד חדש
- `PUT /api/employees/:id` - עדכון עובד
- `DELETE /api/employees/:id` - מחיקת עובד

### נוכחות
- `GET /api/attendance/history/:employee_code` - היסטוריית נוכחות
- `GET /api/attendance/monthly/:employee_code` - נוכחות חודשית

### מכשירי ESP32
- `POST /api/esp32/beacon` - דופק לב ESP32
- `GET /api/esp32/devices` - קבלת כל המכשירים
- `POST /api/esp32/register` - רישום מכשיר חדש

### דיווח נוכחות
- `POST /api/presence/report` - דיווח נוכחות מהאפליקציה
- `GET /api/presence/status/:employee_id` - סטטוס נוכחות

### שירות רקע לנוכחות
- `GET /api/presence-background/status` - סטטוס השירות
- `POST /api/presence-background/trigger-update` - הפעלת עדכון ידני
- `POST /api/presence-background/start` - הפעלת השירות
- `POST /api/presence-background/stop` - עצירת השירות

## פתרון בעיות

**בסיס נתונים לא מתחבר?**
- בדוק ש-MySQL פועל
- בדוק את פרטי החיבור ב-.env

**פורט תפוס?**
- שנה את PORT ב-.env
- או עצור תהליך אחר שמשתמש בפורט 3000

**שגיאות API?**
- בדוק את הלוגים בקונסול
- ודא שכל החבילות מותקנות

**שירות הרקע לא עובד?**
- בדוק את הלוגים בקונסול
- השתמש ב-`POST /api/presence-background/trigger-update` לבדיקה ידנית

## שירות רקע לנוכחות

השרת כולל שירות רקע שמעדכן אוטומטית את סטטוס הנוכחות:

### ⏰ איך זה עובד:
- **בדיקה כל דקה** - השירות בודק את כל העובדים
- **חוק 10 דקות** - עובדים שלא נראו יותר מ-10 דקות מסומנים כנעדרים
- **עדכון אוטומטי** - מעדכן את שדה `is_present` בבסיס הנתונים
- **לוגים מפורטים** - מציג איזה עובדים עודכנו

### 🔧 API לניהול השירות:
```bash
# בדיקת סטטוס השירות
curl -X GET http://localhost:3000/api/presence-background/status \
  -H "Authorization: Bearer YOUR_TOKEN"

# הפעלת עדכון ידני
curl -X POST http://localhost:3000/api/presence-background/trigger-update \
  -H "Authorization: Bearer YOUR_TOKEN"
```

## קבצים חשובים
- `src/server.js` - השרת הראשי
- `src/config/db.js` - חיבור לבסיס נתונים
- `src/services/presenceBackgroundService.js` - שירות רקע לנוכחות
- `src/services/` - לוגיקה עסקית
- `src/controllers/` - מטפלי API
- `src/routes/` - נתיבי API