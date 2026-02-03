FROM node:20-alpine

WORKDIR /app

COPY package*.json ./

RUN npm install

COPY . .

RUN mkdir -p /app/uploads/avatars

COPY uploads/avatars/ /app/uploads/avatars

EXPOSE 3000

CMD npx prisma migrate deploy && npx prisma generate && npm run dev
