FROM node:18-alpine
WORKDIR /usr/src/app
COPY package*.json ./
RUN npm install
COPY . .
COPY prisma ./prisma/
RUN npx prisma generate
RUN npm run build
RUN echo "--- Listing contents of current directory before checking dist ---" && \
    ls -la && \
    echo "--- Checking dist directory ---" && \
    (ls -R dist || echo "Dist directory NOT FOUND")
EXPOSE 3001
CMD [ "npm", "start" ]