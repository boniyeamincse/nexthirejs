const fs = require('fs');

async function main() {
  const loginRes = await fetch('http://localhost:3001/api/v1/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'ui-dashboard-test@example.com', password: 'UiTest#2026' }),
  });

  if (!loginRes.ok) {
    console.error('Login failed', await loginRes.text());
    return;
  }

  const loginData = await loginRes.json();
  const token = loginData.accessToken;
  console.log('Logged in!');

  const pngHex =
    '89504e470d0a1a0a0000000d49484452000000010000000108060000001f15c4890000000a49444154789c63000100000500010d0a2db40000000049454e44ae426082';
  const buffer = Buffer.from(pngHex, 'hex');
  fs.writeFileSync('test.png', buffer);

  const { File, FormData } = require('undici');
  const file = new File([buffer], 'test.png', { type: 'image/png' });
  const formData = new FormData();
  formData.append('file', file);

  const uploadRes = await fetch('http://localhost:3001/api/v1/candidates/me/profile/photo', {
    method: 'PUT',
    headers: { Authorization: `Bearer ${token}` },
    body: formData,
  });

  console.log('Upload response status:', uploadRes.status);
  console.log('Upload response text:', await uploadRes.text());
}

main().catch(console.error);
