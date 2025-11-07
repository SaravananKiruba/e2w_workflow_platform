import bcrypt from 'bcrypt';

async function testPassword() {
  const password = 'demo@123';
  const hashed = await bcrypt.hash(password, 10);
  console.log('Password:', password);
  console.log('Hashed:', hashed);
  
  const isValid = await bcrypt.compare(password, hashed);
  console.log('Valid:', isValid);
}

testPassword().catch(console.error);
