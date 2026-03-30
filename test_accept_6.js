async function runTest() {
  const baseUrl = 'http://127.0.0.1:3001/api';
  
  try {
    // 1. Login as Admin
    console.log('Logging in as Admin...');
    let res = await fetch(`${baseUrl}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'admin@logisticsworld.com', password: 'admin123' })
    });
    let data = await res.json();
    const adminToken = data.token;
    
    // 2. Accept Quote 6
    console.log('Accepting Quote #6...');
    res = await fetch(`${baseUrl}/cotizaciones/6/aceptar`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${adminToken}` }
    });
    data = await res.json();
    console.log('Response status:', res.status);
    console.log('Result:', data);

  } catch (error) {
    console.error('❌ TEST FAILED:', error.message);
  }
}

runTest();
