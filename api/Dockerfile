FROM node:12
WORKDIR /app
EXPOSE 8000
ADD ./package.json .
ADD ./yarn.lock .
RUN yarn install
ADD . .
RUN yarn run build
ADD .env build/.env
CMD ["yarn", "run production"]

