# Use Node.js LTS
FROM node:20-alpine

WORKDIR /app

# Install dependencies
COPY package.json ./
COPY prisma ./prisma/

# Install dependencies including Prisma
RUN npm install

# Copy source code
COPY . .

# Generate Prisma Client
RUN npx prisma generate

# Build TypeScript code
RUN npm run build

# Expose the port the app runs on
EXPOSE 3000

# Start the application
CMD ["npm", "start"]
