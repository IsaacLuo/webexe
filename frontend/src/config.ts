let config;

switch(process.env.NODE_ENV) {
    case 'production':
        const host = 'api.tools.cailab.org:12800';
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