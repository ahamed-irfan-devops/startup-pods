FROM node:20-alpine

WORKDIR /app

# Copy package descriptors and install production dependencies
COPY package*.json ./
RUN npm install --omit=dev

# Copy backend source code
COPY . .

# Expose backend port
EXPOSE 5000

# Start production server
CMD ["npm", "start"]
