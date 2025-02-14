FROM node:18

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm install

COPY . .

RUN npm run build  # This compiles TypeScript

EXPOSE 8080

CMD ["node", "dist/index.js"]
