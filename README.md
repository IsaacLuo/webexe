# webexe
web interface to run a shell program

## sub projects

### api
It provides RESTful APIs, socket.io, and graphQL interfaces which allows the clients from browser, native apps, and other services, to run some programs originally written for CLI locally.
It uses a "webexe.py" module to convert the stdout and stderr of the native executables to JSON objects and send them as response of http to clients.

### frontend
it provides a simple html interface if users just want to call the service directly. It allows user to upload the source file, set parameters, and download result in a GUI. this sub project is not a neccesary part to run this service.

## dependencies
It uses JWT to verify the user permissions. cailab-auth is needed unless the "localMode" switch is on
It uses some conf.json

This is a developing project for building a chromsome on webpages by dragging and dropping features blocks.

this service uses cailab-conf project(private) to generate conf.json and .env files, however handwriting conf.json is also OK according conf.default.json

## Run projects by Docker

### `docker-compose up --build -d`

when all container starts successfully, goto the address you set in conf.json (http://localhost:10301 by default) to access the website

## Run projects indivisually in production

### frontend
```
cd frontend
yarn install
yarn run build
```
html and javascript files are built and generated in build folder, then use nginx or other software to deploy it.

### api
```
cd api
yarn install
yarn run production
```

the node.js server will listen on the port (default 10302), is OK to use nginx as reverse proxy if SSL is required.

## debug projects

### frontend
```
cd frontend
yarn install
yarn start
```

### api
```
cd api
yarn install
yarn run dev
```
