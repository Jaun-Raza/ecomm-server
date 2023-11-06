# Use an official Node.js runtime as the base image
FROM node

# Create a working directory for your application
WORKDIR /usr/app

# Copy only the package.json and package-lock.json files to leverage Docker layer caching
COPY package*.json ./

# Install dependencies (you don't need 'npm install' separately as 'npm install' is included in 'npm ci')
RUN npm ci

# Copy the rest of the application source code into the container
COPY . .

# Expose the port your application will run on (adjust as needed)
EXPOSE 1000

# Start your application (modify the entry point based on your project structure)
CMD ["node", "index.js"]
