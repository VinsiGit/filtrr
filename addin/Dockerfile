FROM node:20 as builder

WORKDIR /app

COPY package*.json ./

RUN npm install

COPY . .

RUN npm run build

# Use the Nginx image from Docker Hub as the base image
FROM nginx:alpine as production

# Copy the sttic files to the Nginx document root
COPY --from=builder /app/dist /app

COPY nginx.conf /etc/nginx/nginx.conf

# Expose port 80
EXPOSE 80