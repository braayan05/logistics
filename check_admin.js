const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const fs = require('fs');
const p = new PrismaClient();

(async () => {
  const u = await p.usuario.findFirst({ where: { email: 'admin@logisticsworld.com' } });
  const results = [];
  if (!u) { results.push('NO ADMIN FOUND'); }
  else {
    results.push(`Admin found id=${u.id} email=${u.email} rol=${u.rol}`);
    results.push(`Password Admin123! match: ${await bcrypt.compare('Admin123!', u.password)}`);
    results.push(`Password admin123 match: ${await bcrypt.compare('admin123', u.password)}`);
    results.push(`Password Admin1234! match: ${await bcrypt.compare('Admin1234!', u.password)}`);
    results.push(`Hash: ${u.password.substring(0, 20)}...`);
  }
  fs.writeFileSync('admin_check.txt', results.join('\n'));
  console.log('Done, see admin_check.txt');
  await p.$disconnect();
})();
