#!/bin/bash
TOKEN=$(curl -s -X POST http://localhost:3001/api/v1/auth/login -H "Content-Type: application/json" -d '{"email":"ui-dashboard-test@example.com","password":"UiTest#2026"}' | jq -r .accessToken)
echo "Token: $TOKEN"
echo "89504e470d0a1a0a0000000d49484452000000010000000108060000001f15c4890000000a49444154789c63000100000500010d0a2db40000000049454e44ae426082" | xxd -r -p > test.png
curl -v -X PUT http://localhost:3001/api/v1/candidates/me/profile/photo \
  -H "Authorization: Bearer $TOKEN" \
  -F "file=@test.png;type=image/png"
