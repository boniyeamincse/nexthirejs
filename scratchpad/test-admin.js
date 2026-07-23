async function main() {
  await new Promise((r) => setTimeout(r, 20000));

  const loginRes = await fetch('http://localhost:3001/api/v1/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'ui-dashboard-test@example.com', password: 'UiTest#2026' }),
  });
  const loginData = await loginRes.json();
  const token = loginData.accessToken;

  if (!token) {
    console.log('Failed to login', loginData);
    return;
  }

  const res = await fetch('http://localhost:3001/api/v1/admin/dashboard/stats', {
    headers: { Authorization: `Bearer ${token}` },
  });
  console.log('Admin stats response status:', res.status);

  if (res.status === 200 || res.status === 403) {
    console.log('Response text:', await res.text());
  } else {
    console.log('Failed. Status:', res.status, await res.text());
  }
}
main().catch(console.error);
