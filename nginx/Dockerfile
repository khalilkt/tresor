FROM node:21-alpine3.18 as build

WORKDIR /react

COPY ./tresor_frontend/package*.json ./

RUN npm install

COPY ./tresor_frontend .

RUN npm run build

FROM nginx:latest

COPY --from=build /react/build /var/www/react
