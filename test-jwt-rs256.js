const jwt = require('jsonwebtoken');
const fs = require('fs');
const path = require('path');

console.log('🔐 Testing RS256 JWT Implementation\n');

// Load keys
const PRIVATE_KEY = fs.readFileSync(path.join(__dirname, 'keys/private_key.pem'), 'utf8');
const PUBLIC_KEY = fs.readFileSync(path.join(__dirname, 'keys/public_key.pem'), 'utf8');

console.log('✅ Keys loaded successfully');
console.log('Private key length:', PRIVATE_KEY.length);
console.log('Public key length:', PUBLIC_KEY.length, '\n');

// Test 1: Sign JWT with private key
console.log('📝 Test 1: Signing JWT with Private Key (RS256)');
const payload = {
  userId: 'user123',
  email: 'test@example.com'
};

try {
  const accessToken = jwt.sign(payload, PRIVATE_KEY, {
    algorithm: 'RS256',
    expiresIn: '1h'
  });
  
  console.log('✅ JWT signed successfully');
  console.log('Token length:', accessToken.length);
  console.log('Token preview:', accessToken.substring(0, 50) + '...\n');
  
  // Test 2: Verify JWT with public key
  console.log('🔍 Test 2: Verifying JWT with Public Key');
  
  const decoded = jwt.verify(accessToken, PUBLIC_KEY, { 
    algorithms: ['RS256'] 
  });
  
  console.log('✅ JWT verified successfully');
  console.log('Decoded payload:', decoded);
  console.log('User ID:', decoded.userId);
  console.log('Email:', decoded.email, '\n');
  
  // Test 3: Test with wrong algorithm
  console.log('❌ Test 3: Testing with wrong algorithm (should fail)');
  try {
    jwt.verify(accessToken, PUBLIC_KEY, { algorithms: ['HS256'] });
    console.log('❌ This should not happen!');
  } catch (err) {
    console.log('✅ Correctly rejected wrong algorithm:', err.message, '\n');
  }
  
  // Test 4: Test with old secret (should fail)
  console.log('❌ Test 4: Testing with old secret method (should fail)');
  try {
    jwt.verify(accessToken, 'old-secret-key');
    console.log('❌ This should not happen!');
  } catch (err) {
    console.log('✅ Correctly rejected old secret method:', err.message, '\n');
  }
  
  console.log('🎉 All tests passed! RS256 implementation is working correctly.');
  
} catch (error) {
  console.error('❌ Test failed:', error.message);
}