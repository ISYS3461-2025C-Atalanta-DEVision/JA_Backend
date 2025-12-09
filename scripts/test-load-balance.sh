#!/bin/bash
echo "🧪 Docker Swarm Verification Tests"
echo "==================================="

GATEWAY=$(docker ps -q -f name=ja-core_api-gateway | head -1)

echo ""
echo "1️⃣ DNS Resolution Test"
echo "-----------------------"
docker exec $GATEWAY sh -c "getent hosts applicant-service"

echo ""
echo "2️⃣ TCP Connection Test"
echo "-----------------------"
docker exec $GATEWAY sh -c "wget -qO- --timeout=2 http://applicant-service:3012/health 2>/dev/null || echo 'Testing TCP port...'"
docker exec $GATEWAY sh -c "(echo > /dev/tcp/applicant-service/3002) 2>/dev/null && echo '✓ TCP port 3002 is open' || echo '✗ TCP port 3002 failed'"

echo ""
echo "3️⃣ Load Balancing Test (10 requests)"
echo "-------------------------------------"
for i in {1..10}; do
  RESP=$(curl -s http://localhost:3000/health | grep -o '"uptime":[0-9]*' | head -1)
  echo "Request $i: $RESP"
done

echo ""
echo "✅ Tests complete!"
