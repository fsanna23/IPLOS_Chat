# Use the official lightweight Node.js image
FROM node:20-alpine

# Set the working directory directly inside the container
WORKDIR /usr/src/app

# Copy package dependency files to the container image
COPY package*.json ./

# Install only production dependencies for a smaller, faster container
RUN npm ci --only=production

# Copy local code to the container image
COPY . .

# Ensure the container listens on the port set by Cloud Run (process.env.PORT)
EXPOSE 8080

# Run the web service on container startup
CMD [ "npm", "start" ]
