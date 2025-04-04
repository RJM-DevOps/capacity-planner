# Use official Node.js LTS image
FROM chainguard/openjdk:17

# Create app directory
WORKDIR /usr/src/app

# Copy package files and install dependencies
COPY package*.json ./
RUN npm install

# Copy the rest of the app
COPY . .

# Expose app port
EXPOSE 3000

# Start the app
CMD ["npm", "start"]
