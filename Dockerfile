# Use Node.js as base image
FROM node:18

# Set working directory
WORKDIR /app

# Copy package.json and install dependencies
COPY package.json package-lock.json ./
RUN npm install

# Copy all project files
COPY . .

# Build TypeScript files (creates the missing dist/ folder)
RUN npm run build  

# Expose the required port
EXPOSE 8080

# Start the app
CMD ["node", "dist/index.js"]
