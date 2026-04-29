FROM node:18-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm install --production

# Copy all backend files
COPY . .

# Your uploads folder (if needed at runtime)
RUN mkdir -p uploads

# Expose port (match your index.js PORT)
EXPOSE 3210

CMD ["npm", "start"]