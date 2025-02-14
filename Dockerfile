FROM node:18
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm install
COPY . .
EXPOSE 8080
CMD ["node", "dist/index.js"]  # Update this if your main entry file is different
# Use Node.js LTS version
