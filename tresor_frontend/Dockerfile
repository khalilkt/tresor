FROM node:21-alpine3.18 as build

WORKDIR /react

COPY ./package*.json ./

RUN npm install

COPY . .

RUN npm run build