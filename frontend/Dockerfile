# Stage 1: Build the app
FROM node:20-alpine AS builder

WORKDIR /app

# Install dependencies using Yarn
COPY package.json yarn.lock ./
RUN yarn install --frozen-lockfile

# Copy the rest of the project
COPY . .

# Build the application
RUN yarn build

# Stage 2: Serve with Nginx
FROM nginx:alpine

# Copy built assets
COPY --from=builder /app/dist /usr/share/nginx/html

# Add custom Nginx config for SPA routing
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
