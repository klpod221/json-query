# Use Node.js LTS version as the base image
FROM node:20-alpine

# Set working directory
WORKDIR /usr/src/app

# Create data directory
RUN mkdir -p ./data

# Copy package.json and package-lock.json
COPY package*.json ./

# Install dependencies
RUN npm install --production

# Copy the rest of the application
COPY . .

# Set environment variables
ENV NODE_ENV=production
ENV PORT=3000

# Expose the port the app runs on
EXPOSE 3000

# Run the application
CMD ["node", "index.js"]
