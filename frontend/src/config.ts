let config;
switch(process.env.NODE_ENV) {
    case 'production':
        config = {
            backendURL: 'http://localhost:8000',
            pythonServerURL: 'ws://localhost:8000',
        }
        break;
    default:
        config = {
            backendURL: 'http://xps.cailab.org:8000',
            pythonServerURL: 'ws://xps.cailab.org:8000',
        }
}
export default config;