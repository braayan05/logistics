async function runTest() {
  const baseUrl = 'http://127.0.0.1:3001/api';
  
  try {
    // 1. Login as B2B Cliente 
    console.log('Logging in as Cliente B2B...');
    let res = await fetch(`${baseUrl}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'maria_b2b@empresa.com', password: 'cliente123' })
    });
    let data = await res.json();
    const b2bToken = data.token;
    
    // 2. Fetch their quotes
    res = await fetch(`${baseUrl}/cotizaciones`, {
      headers: { 'Authorization': `Bearer ${b2bToken}` }
    });
    const quotes = await res.json();
    const pQuote = quotes.find(q => q.estado === 'PENDIENTE');

    if (!pQuote) {
      console.log('No PENDIENTE quotes for B2B. Trying B2C (juan)...');
      res = await fetch(`${baseUrl}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: 'juan@correo.com', password: 'cliente123' })
      });
      data = await res.json();
      const b2cToken = data.token;

      res = await fetch(`${baseUrl}/cotizaciones`, {
        headers: { 'Authorization': `Bearer ${b2cToken}` }
      });
      const juanQuotes = await res.json();
      const juanPQuote = juanQuotes.find(q => q.estado === 'PENDIENTE');
      if (!juanPQuote) return console.log('NO PENDIENTE QUOTES FOUND AT ALL TO TEST.');
      
      console.log('Accepting Quote #', juanPQuote.id);
      res = await fetch(`${baseUrl}/cotizaciones/${juanPQuote.id}/aceptar`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${b2cToken}` }
      });
      const result = await res.json();
      return console.log('Result:', result);
    }

    console.log('Accepting B2B Quote #', pQuote.id);
    res = await fetch(`${baseUrl}/cotizaciones/${pQuote.id}/aceptar`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${b2bToken}` }
    });
    const result = await res.json();
    console.log('Result:', result);

  } catch (error) {
    console.error('❌ TEST FAILED:', error.message);
  }
}

runTest();
