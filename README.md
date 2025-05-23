# Open123API 简易strm 302转发工具

## 使用必读

- 该工具仅供学习交流使用，请勿用于商业用途。
- 请遵守相关法律法规，尊重版权和知识产权。
- 使用本工具即表示您同意上述条款。
- 如果您不接受这些条款，请勿使用本工具。

- 必须申请123pan的开发者权限，并获取两个密钥
> [申请地址](https://www.123pan.com/developer)
> 获取到`clientId` 和 `clientSecret`

- 本项目墙依赖`Redis` 和 `mongodb`，是为了后续做增量、缓存、数据迁移留下可用空间。如果觉得麻烦，可以直接使用`sqlite`，但是不推荐。

- 本项目使用`Midwayjs`框架，使用`TypeScript`语言编写，使用`ts-node`运行。需要安装`Node.js`和`npm`。


## 食用方式

### Clone项目到本地

```bash
git clone
cd open123api
```

### 安装依赖

```bash
npm install
```

### 配置各种参数

` config/config.default.ts` 中配置各种参数

```typescript

  panAPI: {
    clientId: '', // 申请的clientId
    clientSecret: '', // 申请的clientSecret
  },
  redis: {
    client: {
      port: 6379, // Redis port
      host: '192.168.0.19', // Redis host
      db: 0,
      password: 'foobared' // 没有密码可以注释掉
    },
  },
  dataSource: {
  default: {
    uri: 'mongodb://192.168.0.19:27017/open123',
    options: {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    },
    entities: [User, FsItem],
  },
},

```



`src/controller/api.controller.ts` 配置自己想要监控的目录，如果是全量，则直接不用动

```typescript
    this.fileService.startScan('0'); // 0就是监控的目录id，可以在web页面中自行拿到路径id
```

`src/service/file.service.ts` 中修改生成的strm外网路径、生成到哪个目录

```typescript
class FileService {
      public WhiteDirs= [] // 不需要扫描的目录，会跳过递归
      private BASE_STRM_URL = 'http://xxxxxx:7001/d/'; // 生成的strm外网路径
      // 生成的strm外网路径
    // ${process.cwd()}/media 关键词搜索，修改这个media为你想要的目录
}
```


### 启动项目

```bash
npm run dev
```
### 如果没有报错

- 访问`http://localhost:7001/`  可以看到 hello midwayjs


#### 初始化令牌

- 访问`http://localhost:7001/api/init`  可以看到初始化成功，此时在mongo中就会有uesr信息了

- 访问`http://localhost:7001/api/start`  此时控制台就开始输出文件信息了～

- 查看文件目录中的strm地址，浏览器访问，如果无误，会直接开始下载


## 后续

- 本项目没有做webui，因为暂时没必要，简单的302和生成而已。
- 有能力的可以自行增加功能
- 后续版本不会发送到git上。。也就是说不会发送更新出来～
