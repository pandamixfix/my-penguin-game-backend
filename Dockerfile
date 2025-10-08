FROM node:18-alpine
WORKDIR /usr/src/app
COPY my-penguin-game-backend/package*.json ./
RUN npm install
COPY my-penguin-game-backend/prisma ./prisma/
RUN npx prisma generate
COPY my-penguin-game-backend/ .
COPY packages/ ./packages/
EXPOSE 3001

CMD [ "npm", "start" ]