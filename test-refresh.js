async function test() {
  const loginRes = await fetch('http://localhost:3001/api/v1/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'candidate@example.com', password: 'Password123!' }),
  });
  console.log('Login Status:', loginRes.status);
  const cookies = loginRes.headers.get('set-cookie');
  console.log('Set-Cookie:', cookies);

  const refreshRes = await fetch('http://localhost:3001/api/v1/auth/refresh', {
    method: 'POST',
    headers: { Cookie: cookies ? cookies.split(';')[0] : '' },
  });
  console.log('Refresh Status:', refreshRes.status);
  const text = await refreshRes.text();
  console.log('Refresh Body:', text);
}
test();
