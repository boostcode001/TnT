FROM node:20-alpine AS builder

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

COPY . .

ENV VITE_API_URL=/api/v1
RUN npm run build

# 빌드 결과물은 /app/dist에 생성됨
