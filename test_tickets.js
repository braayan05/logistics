async function runTest() {
  const baseUrl = 'http://localhost:3001/api';
  
  try {
    // 1. Login as Cliente
    console.log('Logging in as Cliente B2C...');
    let res = await fetch(\`\${baseUrl}/auth/login\`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'juan@correo.com', password: 'cliente123' })
    });
    let data = await res.json();
    const clienteToken = data.token;
    
    // 2. Create Ticket
    console.log('Creating a new support ticket...');
    res = await fetch(\`\${baseUrl}/tickets\`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': \`Bearer \${clienteToken}\` },
      body: JSON.stringify({ asunto: 'Problema de prueba backend', descripcion: 'Detalle simulado', prioridad: 'ALTA' })
    });
    data = await res.json();
    const ticketId = data.id;
    console.log('Created Ticket ID:', ticketId, 'Numero:', data.numero);

    // 3. Add Message
    console.log('Adding a message...');
    await fetch(\`\${baseUrl}/tickets/\${ticketId}/mensajes\`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': \`Bearer \${clienteToken}\` },
      body: JSON.stringify({ mensaje: 'Este es un mensaje de prueba desde el script.' })
    });
    console.log('Message added.');

    // 4. Get Tickets List
    console.log('Fetching tickets for client...');
    res = await fetch(\`\${baseUrl}/tickets\`, {
      headers: { 'Authorization': \`Bearer \${clienteToken}\` }
    });
    data = await res.json();
    console.log(\`Found \${data.length} tickets for the client.\`);

    // 5. Login as Admin
    console.log('Logging in as Admin...');
    res = await fetch(\`\${baseUrl}/auth/login\`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'admin@logisticsworld.com', password: 'admin123' })
    });
    data = await res.json();
    const adminToken = data.token;

    // 6. Change Status
    console.log('Changing ticket status to EN_PROCESO as Admin...');
    res = await fetch(\`\${baseUrl}/tickets/\${ticketId}/estado\`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', 'Authorization': \`Bearer \${adminToken}\` },
      body: JSON.stringify({ estado: 'EN_PROCESO' })
    });
    data = await res.json();
    console.log('Status updated to:', data.estado);

    console.log('✅ BACKEND TICKETS TEST PASSED!');
  } catch (error) {
    console.error('❌ TEST FAILED:', error.message);
  }
}

runTest();
