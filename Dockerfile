# Use an official, lightweight Node.js runtime as the base image
FROM node:20-alpine

# Set the working directory inside the container
WORKDIR /app

# Copy package.json and package-lock.json (if available) first to leverage Docker cache
COPY package*.json ./

# Install only production dependencies
RUN npm install --production

# Copy the rest of your application's source code into the container
COPY . .

# Expose both ports used by your application
EXPOSE 3001
EXPOSE 8080

# Command to run both backend and frontend servers
CMD ["npm", "start"]
