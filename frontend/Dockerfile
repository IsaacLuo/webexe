FROM node:12 as builder
WORKDIR /app
ADD ./package.json ./
RUN yarn install
ADD . .
RUN yarn build

FROM nginx
COPY --from=builder /app/build /app
COPY --from=builder /app/nginx.conf /etc/nginx/nginx.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
