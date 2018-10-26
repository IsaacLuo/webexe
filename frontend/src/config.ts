let config;

switch(process.env.NODE_ENV) {
    case 'production':
        const host = process.env.npm_backend_host ? process.env.npm_backend_host : 'localhost';
        const port = process.env.npm_backend_port ? process.env.npm_backend_port : '8000';
        config = {
            backendURL: `http://${host}:${port}`,
            pythonServerURL: `ws://${host}:${port}`,
        }
        break;
    default:
        config = {
            backendURL: 'http://localhost:8000',
            pythonServerURL: 'ws://localhost:8000',
        }
}
export default config;