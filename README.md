# LINE LIFF Multi-Platform App

แอปพลิเคชัน LINE LIFF ที่รองรับ multi-platform (Facebook & LINE) พร้อมระบบ redirect และ tracking parameters

## คุณสมบัติ

- 🚀 Express.js server พร้อม CommonJS
- 📱 LIFF v2 SDK integration
- 🔀 แยกหน้า LIFF สำหรับ Facebook และ LINE
- 🎨 UI ที่สวยงามและ responsive (แยกสีตาม platform)
- 📋 อ่านและแสดง URL parameters ทั้งหมด
- 📤 ส่งต่อ parameters ระหว่าง platforms
- 🌐 Auto-redirect ไป external browser เมื่อเปิดใน LINE app
- ⏱️ Countdown timer สำหรับ auto-redirect

## การติดตั้ง

1. **Install dependencies:**
```bash
npm install
```

2. **เริ่มต้น development server:**
```bash
npm run dev
```

3. **เริ่มต้น production server:**
```bash
npm start
```

Server จะรันที่ `http://localhost:3000`

## การตั้งค่า LINE LIFF

### 1. สร้าง LINE Login Channel
1. เข้าไปที่ [LINE Developers Console](https://developers.line.biz/)
2. สร้าง Provider หรือใช้ Provider ที่มีอยู่
3. สร้าง Channel ประเภท "LINE Login"

### 2. สร้าง LIFF App
1. ในหน้า Channel Settings ของ LINE Login
2. ไปที่แท็บ "LIFF"
3. คลิค "Add" เพื่อสร้าง LIFF App ใหม่
4. กรอกข้อมูล:
   - **LIFF App Name:** ชื่อแอปของคุณ
   - **Size:** Full
   - **Endpoint URL:** `https://yourdomain.com` (URL ที่แอปจะรัน)
   - **Scope:** `profile openid`
   - **Bot Link Feature:** เปิดใช้งาน (ถ้าต้องการ)

### 3. อัพเดต Configuration

1. **สร้างไฟล์ `.env`** จาก `.env.example`:
```bash
cp .env.example .env
```

2. **แก้ไขไฟล์ `.env`** ใส่ค่า configuration:
```env
# LINE LIFF Configuration
LIFF_ID=1234567890-AbCdEfGh              # LIFF ID ใช้ทั้ง initialization และ redirect

# External URL for redirect
EXTERNAL_URL=https://example.com         # URL ที่จะ redirect ไปเมื่อเปิดใน LINE app

# Server Configuration
PORT=8080
```

**หมายเหตุ:** 
- LIFF ID จะถูกอ่านจาก environment variables และส่งไปยัง frontend อัตโนมัติ
- เมื่อเปิดใน LINE app จะ auto-redirect ไป EXTERNAL_URL พร้อม parameters

### 4. Deploy แอปพลิเคชัน

แอปต้องรันบน HTTPS เพื่อให้ LIFF ทำงานได้ คุณสามารถใช้:

- **Heroku:**
  ```bash
  git init
  git add .
  git commit -m "Initial commit"
  heroku create your-app-name
  git push heroku main
  ```

- **Vercel:**
  ```bash
  npm install -g vercel
  vercel
  ```

- **Ngrok (สำหรับ development):**
  ```bash
  npm install -g ngrok
  ngrok http 3000
  ```

## โครงสร้างโปรเจค

```
├── package.json          # Dependencies และ scripts
├── server.js            # Express server หลัก
├── .env                 # Configuration (ไม่ commit ลง git)
├── .env.example         # ตัวอย่าง configuration
├── public/
│   ├── liff-facebook.html  # Facebook LIFF page
│   └── liff-line.html      # LINE LIFF page
├── README.md           # เอกสารคู่มือ
└── CLAUDE.md           # Development log
```

## API Endpoints

### Pages
- `GET /` - redirect ไป `/facebook`
- `GET /facebook` - Facebook LIFF page (redirect to `https://liff.line.me/{LIFF_ID}/line`)
- `GET /line` - LINE LIFF page (auto-redirect to external browser)
- `GET /seed` - Set all query parameters as cookies และ redirect ไปเพิ่มเพื่อน LINE (ถ้ามี line_id parameter)
- `GET /go` - อ่าน cookies หรือ query params และ redirect ไป rurl พร้อมข้อมูลเป็น parameters

### API
- `GET /api/health` - ตรวจสอบสถานะ server
- `GET /api/config` - ดึงค่า LIFF configuration
- `GET /api/params` - รับและ log URL parameters

## ฟีเจอร์ LIFF ที่ใช้

- `liff.init()` - เริ่มต้น LIFF app
- `liff.isLoggedIn()` - ตรวจสอบสถานะ login
- `liff.getProfile()` - ดึงข้อมูลโปรไฟล์ผู้ใช้
- `liff.getFriendship()` - ตรวจสอบสถานะเพื่อน
- `liff.openWindow()` - เปิดหน้าต่างเพิ่มเพื่อน

## การแก้ไขปัญหา

### LIFF init failed
- ตรวจสอบว่า LIFF ID ถูกต้อง
- ตรวจสอบว่า URL ในการตั้งค่า LIFF ตรงกับ URL ที่แอปรัน

### ปุ่มเพิ่มเพื่อนไม่ทำงาน
- ตรวจสอบว่า Bot Basic ID ถูกต้อง
- ตรวจสอบว่าผู้ใช้ล็อกอินแล้ว

### แอปไม่เปิดใน LINE
- ตรวจสอบว่าใช้ HTTPS
- ตรวจสอบ Endpoint URL ใน LIFF settings

## Development

```bash
# ติดตั้ง dependencies
npm install

# รัน development server
npm run dev

# รัน production server
npm start
```

## License

ISC