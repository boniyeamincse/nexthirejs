async function main() {
  const loginRes = await fetch('http://localhost:3001/api/v1/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'admin@nexthire.com', password: 'Password123!' })
  });
  const loginData = await loginRes.json();
  const token = loginData.accessToken;
  
  if (!token) {
    console.log("Failed to login", loginData);
    return;
  }
  console.log("Login successful! Testing endpoints...");
  
  const endpoints = [
    '/admin/dashboard/stats',
    '/admin/dashboard/overview',
    '/admin/analytics/growth/users',
    '/admin/analytics/revenue/trends'
  ];

  for (const ep of endpoints) {
    const res = await fetch(`http://localhost:3001/api/v1${ep}`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    console.log(`[${res.status}] ${ep}`);
    if (res.status === 200) {
      console.log(await res.text().then(t => t.substring(0, 50) + '...'));
    }
  }
}
main().catch(console.error);
