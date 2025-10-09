FROM node:18-alpine
WORKDIR /usr/src/app
COPY package*.json ./
RUN npm install
COPY . .
COPY prisma ./prisma/
RUN npx prisma generate
RUN npm run build
RUN ls -R dist
EXPOSE 3001
CMD [ "npm", "start" ]