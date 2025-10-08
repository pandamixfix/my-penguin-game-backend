# Dockerfile

FROM node:18-alpine

WORKDIR /usr/src/app

COPY package*.json ./

COPY prisma ./prisma/

RUN npm install

RUN npx prisma generate

COPY . .

EXPOSE 3001

CMD [ "npm", "start" ]