# Use the official Node.js image as the base image
FROM node:20 as builder

# Set the working directory in the container
WORKDIR /app

# Copy the package.json and package-lock.json files to the container
COPY package*.json ./

# Install the dependencies
RUN npm install --save --legacy-peer-deps

# Copy the source code to the container
COPY . .

# Build the Angular app
RUN npm run build --configuration=production

# Use a lightweight image for the production environment
FROM nginx:alpine as production

# Copy the built app from the builder stage to the nginx server
COPY --from=builder /app/dist/frontend /app
# Copy the nginx.conf file to the container
COPY nginx.conf /etc/nginx/nginx.conf

EXPOSE 80
