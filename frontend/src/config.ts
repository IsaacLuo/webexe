let config;

switch(process.env.NODE_ENV) {
    case 'production':
        const host = 'api.tools.cailab.org';
        config = {
            backendURL: `https://${host}`,
            pythonServerURL: `wss://${host}`,
        }
        break;
    default:
        config = {
            backendURL: 'http://local.cailab.org:8000',
            pythonServerURL: 'ws://localhost:8000',
        }
}
export default config;
