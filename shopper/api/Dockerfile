FROM node:20-alpine
WORKDIR /app

# Для безопасности
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001

# Для лучшего кэширования
COPY package*.json ./
RUN npm install --only=production --omit=dev

# Копируем код с правильными правами
COPY --chown=nodejs:nodejs . .

# Переключаем пользователя
USER nodejs

EXPOSE 4000
CMD ["node", "index.js"]
