let config;
switch(process.env.NODE_ENV) {
    case 'production':
        break;
    default:
        config = {
            backendURL: 'http://localhost:8000',
        }
}
export default config;