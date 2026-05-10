FROM node:20-alpine

WORKDIR /app
COPY package*.json ./
RUN npm ci --omit=dev
COPY . .
RUN npm run build

EXPOSE 8649
ENV PORT=8649
ENV ADMIN_PASSWORD=admin123

CMD ["node", "dist/server/index.js"]
