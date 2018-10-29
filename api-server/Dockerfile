FROM codingpeon/node-python:latest

WORKDIR /app

RUN pip3 install pipenv 

ADD ./package.json .
RUN yarn install
ADD . .
RUN yarn build

WORKDIR /app/scripts
RUN pipenv install --system --deploy --ignore-pipfile

WORKDIR /app
CMD ["yarn", "run production"]

