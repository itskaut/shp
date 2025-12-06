#!/bin/bash

echo "========================================"
echo "     Остановка Docker Swarm стека"
echo "========================================"

echo "1. Останавливаем стек..."
docker stack rm shop

echo "2. Ожидаем остановку сервисов..."
sleep 10

echo "3. Удаляем сеть..."
docker network rm shop-network 2>/dev/null || echo "Сеть уже удалена"

echo "4. Выходим из Swarm..."
docker swarm leave --force 2>/dev/null || echo "Уже вышли из Swarm"

echo ""
echo "========================================"
echo "         ОСТАНОВЛЕНО!"
echo "========================================"
echo "Все сервисы остановлены и удалены."
echo ""
echo "Для запуска заново:"
echo "  ./swarm-init.sh"
echo "========================================"
