import { MidwayConfig } from '@midwayjs/core';
import { User } from '../entity/user';
import { FsItem } from '../entity/fs';
export default {
  // use for cookie sign key, should change to your own and keep security
  keys: '1747624527334_4784',
  koa: {
    port: 7001,
  },
  midwayLogger: {
    default: {
      consoleLevel: 'warn', // 只记录 info、warn、error
    },
  },
  mongoose: {
    dataSource: {
      default: {
        uri: 'mongodb://localhost:27017/open123',
        options: {
          useNewUrlParser: true,
          useUnifiedTopology: true,
        },
        entities: [User, FsItem],
      },
    },
  },
  panAPI: {
    clientId: '',
    clientSecret: '',
  },
  redis: {
    client: {
      port: 6379, // Redis port
      host: 'localhost', // Redis host
      db: 0,
      // password: 'foobared',
    },
  },
  cors: {
    origin: '*',
  },
} as MidwayConfig;
