import secret from './secret'
declare interface IConf {
  serverDomain: string;
  port:number;
  serverAddress: string;
  allowGuest?: boolean;
  secret: any;
  attachmentPath: string;
}

let exportDefault:IConf;

if (process.env.NODE_ENV === 'development') {
  const serverDomain = 'local.cailab.org';
  const port = 8001;

  exportDefault = {
    serverDomain,
    port,
    serverAddress: `http://${serverDomain}:${port}`,
    allowGuest: true,
    secret,
    attachmentPath: './uploads',
  }
} else {
  const serverDomain = 'vm3.cailab.org';
  const port = 8001;

  exportDefault = {
    serverDomain,
    port,
    serverAddress: `http://${serverDomain}:${port}`,
    secret,
    attachmentPath: '/tmp/uploads',
  }
}

export default exportDefault;