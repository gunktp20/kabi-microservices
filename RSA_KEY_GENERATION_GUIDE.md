# 🔐 RSA Key Generation Guide

คู่มือการสร้าง RSA Key Pair สำหรับ JWT Authentication ใน Microservices

## 📋 Table of Contents
- [Prerequisites](#prerequisites)
- [Generate Keys](#generate-keys)
- [Verify Keys](#verify-keys)
- [Security Best Practices](#security-best-practices)
- [Production Deployment](#production-deployment)
- [Key Rotation](#key-rotation)
- [Troubleshooting](#troubleshooting)

## Prerequisites

### Required Tools
- **OpenSSL** (มาพร้อม Git Bash, WSL, หรือ Linux)
- **Node.js** (สำหรับ testing)

### Check OpenSSL Installation
```bash
# ตรวจสอบ version
openssl version

# ถ้าไม่มี ให้ติดตั้ง:
# Windows: ใช้ Git Bash หรือ WSL
# macOS: brew install openssl
# Linux: apt-get install openssl
```

## Generate Keys

### Step 1: สร้าง Directory สำหรับ Keys
```bash
# สร้างโฟลเดอร์ keys
mkdir -p ./keys
cd ./keys

# กำหนด permissions (Linux/macOS)
chmod 700 ./keys
```

### Step 2: Generate RSA Private Key (2048-bit)
```bash
# สร้าง private key
openssl genrsa -out private_key.pem 2048

# หรือแบบ secure มากขึ้น (4096-bit)
openssl genrsa -out private_key.pem 4096
```

### Step 3: Generate Public Key จาก Private Key
```bash
# Extract public key จาก private key
openssl rsa -in private_key.pem -pubout -out public_key.pem
```

### Step 4: กำหนด File Permissions
```bash
# Linux/macOS only
chmod 600 private_key.pem  # Private key - อ่านได้เฉพาะ owner
chmod 644 public_key.pem   # Public key - อ่านได้ทุกคน
```

## Verify Keys

### Check Key Format
```bash
# ตรวจสอบ private key
openssl rsa -in private_key.pem -text -noout

# ตรวจสอบ public key
openssl rsa -pubin -in public_key.pem -text -noout
```

### Check Key Content
```bash
# แสดง private key
cat private_key.pem

# แสดง public key  
cat public_key.pem
```

### Test with Node.js
```javascript
// test-keys.js
const jwt = require('jsonwebtoken');
const fs = require('fs');

const privateKey = fs.readFileSync('./private_key.pem', 'utf8');
const publicKey = fs.readFileSync('./public_key.pem', 'utf8');

// Test signing
const token = jwt.sign({ test: 'data' }, privateKey, { algorithm: 'RS256' });
console.log('Token created:', token.substring(0, 50) + '...');

// Test verifying
const decoded = jwt.verify(token, publicKey, { algorithms: ['RS256'] });
console.log('Token verified:', decoded);
```

```bash
# Run test
node test-keys.js
```

## Security Best Practices

### 🔒 File Permissions
```bash
# Linux/macOS - ตั้งค่า permissions ที่ปลอดภัย
chmod 600 private_key.pem    # rw-------
chmod 644 public_key.pem     # rw-r--r--
chown root:root *.pem        # เปลี่ยน owner เป็น root
```

### 🚫 What NOT to do
- ❌ **NEVER** commit private keys ใน Git
- ❌ **NEVER** share private keys ระหว่าง services  
- ❌ **NEVER** เก็บ private keys ใน plaintext config files
- ❌ **NEVER** ใช้ weak keys (< 2048 bits)

### ✅ What TO do
- ✅ เก็บ private key ใน secure storage (Vault, AWS Secrets Manager)
- ✅ ใช้ environment variables สำหรับ production
- ✅ ใช้ separate keys สำหรับแต่ละ environment (dev/staging/prod)
- ✅ Implement key rotation strategy
- ✅ Monitor key usage

### 📝 .gitignore
```gitignore
# RSA Keys
keys/
*.pem
*.key
private_key*
public_key*

# Environment files
.env
.env.local
.env.production
```

## Production Deployment

### Option 1: Environment Variables
```bash
# Convert PEM to single line
PRIVATE_KEY=$(cat private_key.pem | base64 -w 0)
PUBLIC_KEY=$(cat public_key.pem | base64 -w 0)

# Set environment variables
export JWT_PRIVATE_KEY_BASE64="$PRIVATE_KEY"
export JWT_PUBLIC_KEY_BASE64="$PUBLIC_KEY"
```

```javascript
// ใน application config
const JWT_PRIVATE_KEY = process.env.JWT_PRIVATE_KEY_BASE64 
  ? Buffer.from(process.env.JWT_PRIVATE_KEY_BASE64, 'base64').toString('utf8')
  : fs.readFileSync('./keys/private_key.pem', 'utf8');
```

### Option 2: Docker Secrets
```dockerfile
# Dockerfile
COPY keys/public_key.pem /app/keys/
# ไม่ copy private key - ใช้ secrets

# docker-compose.yml
version: '3.8'
services:
  user-service:
    secrets:
      - jwt_private_key
secrets:
  jwt_private_key:
    file: ./keys/private_key.pem
```

### Option 3: Kubernetes Secrets
```yaml
# Create secret
apiVersion: v1
kind: Secret
metadata:
  name: jwt-keys
type: Opaque
data:
  private-key: <base64-encoded-private-key>
  public-key: <base64-encoded-public-key>
```

### Option 4: AWS Secrets Manager / Azure Key Vault
```javascript
// Example with AWS SDK
const AWS = require('aws-sdk');
const secretsManager = new AWS.SecretsManager();

const getPrivateKey = async () => {
  const result = await secretsManager.getSecretValue({
    SecretId: 'jwt-private-key'
  }).promise();
  return result.SecretString;
};
```

## Key Rotation

### 1. Generate New Key Pair
```bash
# สร้าง key pair ใหม่
openssl genrsa -out private_key_new.pem 2048
openssl rsa -in private_key_new.pem -pubout -out public_key_new.pem
```

### 2. Deploy New Public Key
```bash
# Deploy public key ใหม่ไปยัง services ทั้งหมดก่อน
# รอให้ services restart และ load key ใหม่
```

### 3. Update Auth Service
```bash
# เปลี่ยน private key ใน auth service
# JWT ที่สร้างใหม่จะใช้ private key ใหม่
```

### 4. Grace Period
```bash
# เก็บ public key เก่าไว้ 1-2 สัปดาห์
# เพื่อให้ JWT ที่ยังไม่หมดอายุ verify ได้
```

### 5. Cleanup
```bash
# ลบ key เก่าออก
rm private_key_old.pem public_key_old.pem
```

## Troubleshooting

### ❌ Error: "secretOrPrivateKey must be an asymmetric key"
```bash
# สาเหตุ: Key format ไม่ถูกต้อง
# แก้ไข: สร้าง key ใหม่
openssl genrsa -out private_key.pem 2048
openssl rsa -in private_key.pem -pubout -out public_key.pem
```

### ❌ Error: "invalid algorithm"
```javascript
// ต้องระบุ algorithm ใน verify
jwt.verify(token, publicKey, { algorithms: ['RS256'] })
```

### ❌ Error: "ENOENT: no such file or directory"
```javascript
// ตรวจสอบ path ให้ถูกต้อง
const path = require('path');
const keyPath = path.join(__dirname, '../../../keys/private_key.pem');
```

### ❌ Error: "PEM_read_bio:no start line"
```bash
# Key file เสียหาย ให้สร้างใหม่
head -1 private_key.pem  # ต้องขึ้นต้นด้วย -----BEGIN
tail -1 private_key.pem  # ต้องจบด้วย -----END
```

## Key Size Recommendations

| Key Size | Security Level | Performance | Use Case |
|----------|---------------|-------------|----------|
| 1024-bit | ❌ Weak | ⚡ Fast | ❌ Not recommended |
| 2048-bit | ✅ Good | ✅ Balanced | ✅ Standard |
| 4096-bit | ✅ Strong | 🐌 Slow | 🏢 High security |

## Example Commands Summary

```bash
# Quick setup
mkdir keys && cd keys
openssl genrsa -out private_key.pem 2048
openssl rsa -in private_key.pem -pubout -out public_key.pem
chmod 600 private_key.pem
chmod 644 public_key.pem

# Verify
openssl rsa -in private_key.pem -text -noout
openssl rsa -pubin -in public_key.pem -text -noout

# Test with Node.js
node -e "
const jwt=require('jsonwebtoken'),fs=require('fs');
const priv=fs.readFileSync('private_key.pem','utf8');
const pub=fs.readFileSync('public_key.pem','utf8');
const token=jwt.sign({test:1},priv,{algorithm:'RS256'});
console.log('✅ Token:',token.slice(0,50)+'...');
console.log('✅ Verified:',jwt.verify(token,pub,{algorithms:['RS256']}));
"
```

---

**💡 Tips:**
- สร้าง key ใหม่ทุก 6-12 เดือน
- ใช้ monitoring เพื่อตรวจสอบการใช้งาน key
- เก็บ backup ของ public keys
- Test key rotation process ใน staging ก่อน production

**📚 References:**
- [OpenSSL Documentation](https://www.openssl.org/docs/)
- [JWT.io - JSON Web Tokens](https://jwt.io/)
- [RFC 7518 - JWA (JSON Web Algorithms)](https://tools.ietf.org/html/rfc7518)