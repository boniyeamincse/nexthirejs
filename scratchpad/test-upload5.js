async function main() {
  const loginRes = await fetch('http://localhost:3001/api/v1/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'ui-dashboard-test@example.com', password: 'UiTest#2026' }),
  });

  const loginData = await loginRes.json();
  const token = loginData.accessToken;

  const res = await fetch('http://localhost:3001/api/v1/candidates/me/profile/photo/status', {
    headers: { Authorization: `Bearer ${token}` },
  });
  console.log('Status response status:', res.status);
  console.log('Status response text:', await res.text());
}
main().catch(console.error);
