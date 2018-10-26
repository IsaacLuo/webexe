FROM node:10
# install python
RUN apt-get update \
    && apt-get install -y python3-pip python3-dev \
    && cd /usr/local/bin \
    && ln -s /usr/bin/python3 python \
    && pip3 install --upgrade pip

WORKDIR /app
ADD ./package.json .
RUN yarn install
ADD . .
RUN yarn build
CMD ["yarn", "run production"]

