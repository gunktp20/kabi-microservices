# Kabi Infrastructure Setup

Infrastructure services (MySQL, phpMyAdmin, Redis) สำหรับ Kabi microservices

## Services ที่รวมอยู่

### 📊 Database & Storage
- **MySQL 8.0** (port 3306) - ฐานข้อมูลหลักพร้อม 4 databases
- **Redis 7** (port 6379) - Cache และ Pub/Sub

### 🖥️ Management UI
- **phpMyAdmin** (port 8080) - MySQL Web UI

## Databases ที่สร้างอัตโนมัติ

เมื่อรัน docker-compose ครั้งแรก จะสร้าง databases และ users ดังนี้:

### 🗄️ Databases:
- `kabi_user` - สำหรับ User Service
- `kabi_board` - สำหรับ Board Service  
- `kabi_task` - สำหรับ Task Service
- `kabi_notification` - สำหรับ Notification Service

### 👤 Database Users:
- `kabi_user` / `kabi_password` - เข้าถึง kabi_user database
- `kabi_board` / `kabi_password` - เข้าถึง kabi_board database
- `kabi_task` / `kabi_password` - เข้าถึง kabi_task database  
- `kabi_notification` / `kabi_password` - เข้าถึง kabi_notification database

## การรัน Infrastructure

### 🚀 การรันครั้งแรก (หรือหากต้องการ reset ฐานข้อมูล)

```bash
cd kabi-microservices

# ลบ containers และ volumes เก่า (ถ้ามี)
docker-compose down -v
docker volume rm kabi_mysql_data kabi_redis_data 2>/dev/null || true

# รัน infrastructure services ใหม่
docker-compose up -d

# ตรวจสอบว่า databases ถูกสร้าง
docker-compose logs mysql
```

### 📊 การรันครั้งถัดไป

```bash
# รัน infrastructure services
docker-compose up -d

# ดู status ของ services
docker-compose ps

# ดู logs
docker-compose logs -f

# หยุด services
docker-compose down
```

### ⚠️ สำคัญ: การสร้าง Databases

**MySQL init script จะทำงานแค่ครั้งเดียวเมื่อ volume ว่างเปล่า** 

หากคุณเคยรัน `docker-compose up` มาก่อน และไม่มี databases ที่ต้องการ ให้ทำ:

```bash
# ลบทุกอย่างและเริ่มใหม่
docker-compose down -v
docker volume rm kabi_mysql_data kabi_redis_data
docker-compose up -d
```

## การเข้าถึง Web UIs

### phpMyAdmin (MySQL Management)
- **URL**: http://localhost:8080

**Login Options:**
- **Root Access**: `root` / `root_password` (เห็นทุก databases)
- **User Service**: `kabi_user` / `kabi_password`
- **Board Service**: `kabi_board` / `kabi_password`  
- **Task Service**: `kabi_task` / `kabi_password`
- **Notification Service**: `kabi_notification` / `kabi_password`

## การเชื่อมต่อจาก Services

### MySQL Connection Strings
```bash
# User Service
mysql://kabi_user:kabi_password@localhost:3306/kabi_user

# Board Service  
mysql://kabi_board:kabi_password@localhost:3306/kabi_board

# Task Service
mysql://kabi_task:kabi_password@localhost:3306/kabi_task

# Notification Service
mysql://kabi_notification:kabi_password@localhost:3306/kabi_notification
```

### Redis Connection String  
```
redis://localhost:6379
```

## Environment Variables สำหรับแต่ละ Service

### User Service
```env
DB_HOST=localhost
DB_PORT=3306
DB_NAME=kabi_user
DB_USERNAME=kabi_user
DB_PASSWORD=kabi_password
```

### Board Service
```env
DB_HOST=localhost
DB_PORT=3306
DB_NAME=kabi_board
DB_USERNAME=kabi_board
DB_PASSWORD=kabi_password
```

### Task Service
```env
DB_HOST=localhost
DB_PORT=3306
DB_NAME=kabi_task
DB_USERNAME=kabi_task
DB_PASSWORD=kabi_password
```

### Notification Service
```env
DB_HOST=localhost
DB_PORT=3306
DB_NAME=kabi_notification
DB_USERNAME=kabi_notification
DB_PASSWORD=kabi_password
```

### Redis (ทุก Services)
```env
REDIS_HOST=localhost
REDIS_PORT=6379
```

## Database Credentials

### Root User (สำหรับ admin)
- **Username**: root
- **Password**: root_password

### Service Users
- **kabi_user** / `kabi_password` → kabi_user database
- **kabi_board** / `kabi_password` → kabi_board database  
- **kabi_task** / `kabi_password` → kabi_task database
- **kabi_notification** / `kabi_password` → kabi_notification database

## Data Persistence

ข้อมูลจะถูกเก็บใน Docker volumes:
- `kabi_mysql_data` - MySQL data
- `kabi_redis_data` - Redis data

## Network

Services ทั้งหมดรันบน `kabi-network` สามารถสื่อสารกันได้

## การ Reset ข้อมูล

```bash
# หยุดและลบ containers พร้อม volumes
docker-compose down -v

# ลบ volumes ทั้งหมด (ระวัง! จะลบข้อมูลทั้งหมด)
docker volume rm kabi_mysql_data kabi_redis_data
```

## การ Development

หลังจากรัน infrastructure แล้ว คุณสามารถ:

1. **เข้า phpMyAdmin** ที่ http://localhost:8080 เพื่อจัดการ database
2. **Connect จาก services** ด้วย connection string ข้างต้น  
3. **ใช้ Redis** สำหรับ caching และ real-time features

## Ports ที่ใช้งาน

- **3306** - MySQL Database
- **6379** - Redis
- **8080** - phpMyAdmin Web UI

## 🔧 Troubleshooting

### ปัญหา: ไม่มี databases ที่ต้องการถูกสร้าง

**สาเหตุ:** MySQL init script ทำงานแค่ครั้งแรกเมื่อ volume ว่างเปล่า

**วิธีแก้:**
```bash
# 1. หยุดและลบทุกอย่าง
docker-compose down -v

# 2. ลบ volumes เก่า
docker volume rm kabi_mysql_data kabi_redis_data

# 3. รันใหม่
docker-compose up -d

# 4. ตรวจสอบ logs ว่า init script ทำงาน
docker-compose logs mysql | grep -E "(database|user|CREATE)"
```

### ตรวจสอบว่า Databases ถูกสร้างแล้ว

```bash
# เข้าไปใน MySQL container
docker exec -it kabi-mysql mysql -u root -proot_password

# แสดง databases ทั้งหมด
SHOW DATABASES;

# แสดง users ทั้งหมด  
SELECT user, host FROM mysql.user WHERE user LIKE 'kabi_%';
```

### ตรวจสอบ Permissions

```bash
# ตรวจสอบ permissions ของ user
SHOW GRANTS FOR 'kabi_user'@'%';
SHOW GRANTS FOR 'kabi_board'@'%';
SHOW GRANTS FOR 'kabi_task'@'%';
SHOW GRANTS FOR 'kabi_notification'@'%';
```