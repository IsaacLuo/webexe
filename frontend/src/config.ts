let config;

switch(process.env.NODE_ENV) {
    case 'production':
        const host = 'api.tools.cailab.org';
        config = {
            backendURL: `https://${host}`,
            authServerURL: 'https://api.auth.cailab.org',
            pythonServerURL: `wss://${host}`,
        }
        break;
    default:
        config = {
            backendURL: 'http://local.cailab.org:8001',
            authServerURL: 'http://api.auth.cailab.org',
            pythonServerURL: 'ws://localhost:8001',
        }
}
export default config;
