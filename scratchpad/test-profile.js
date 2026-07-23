async function main() {
  const loginRes = await fetch('http://localhost:3001/api/v1/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'ui-dashboard-test@example.com', password: 'UiTest#2026' }),
  });
  const loginData = await loginRes.json();
  const token = loginData.accessToken;

  const res = await fetch('http://localhost:3001/api/v1/candidates/me/profile', {
    headers: { Authorization: `Bearer ${token}` },
  });
  console.log('Profile response status:', res.status);
}
main().catch(console.error);
