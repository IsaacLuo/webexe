let config;

switch(process.env.NODE_ENV) {
    case 'production':
        const host = process.env.BACKEND_HOST ? process.env.BACKEND_HOST : 'localhost:8000';
        config = {
            backendURL: `http://${host}`,
            pythonServerURL: `ws://${host}`,
        }
        break;
    default:
        config = {
            backendURL: 'http://localhost:8000',
            pythonServerURL: 'ws://localhost:8000',
        }
}
export default config;