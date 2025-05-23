import { Provide, Inject } from '@midwayjs/core';
import { ILogger } from '@midwayjs/logger';
import { InjectEntityModel } from '@midwayjs/typegoose';
import { ReturnModelType } from '@typegoose/typegoose';
import { User } from '../entity/user';
import { HttpClient } from '../utils/http';
import { ApiResponse, FileItem, FileListResponse } from '../interface';
import Bottleneck from 'bottleneck';
import { FsItem } from '../entity/fs';
import {
  createWriteStream,
  existsSync,
  mkdirSync,
  unlinkSync,
  writeFileSync,
} from 'fs';
import axios from 'axios';
import { dirname, extname } from 'path';

const limiter = new Bottleneck({
  reservoir: 1, // 初始令牌数
  reservoirRefreshAmount: 3, // 每次刷新令牌数
  reservoirRefreshInterval: 1200, // 刷新令牌的时间间隔
  maxConcurrent: 4, // 最大并发数
});

type GetFileListArgs = [string | -1, string, number?, string?];

@Provide()
export class FileService {
  @InjectEntityModel(User)
  userModel: ReturnModelType<typeof User>;
  @InjectEntityModel(FsItem)
  fsItemModel: ReturnModelType<typeof FsItem>;
  @Inject()
  logger: ILogger;
  @Inject()
  httpClient: HttpClient;
  private BASE_STRM_URL = 'http://xxxx:7001/d';
  public WhiteDirs = [
    '来自：BT磁力链下载',
    '来自：百度网盘',
    '来自：BT种子下载',
    '来自：迅雷下载',
    '等待整理',
    'paod',
    'cherry-studio',
  ];
  public META_DATA_EXT = [
    '.nfo',
    '.jpg',
    '.png',
    '.ass',
    '.ssa',
    '.srt',
    '.sup',
  ];
  public MEDIA_DATA_EXT = [
    '.mp4',
    '.mkv',
    '.ts',
    '.iso',
    '.rmvb',
    '.avi',
    '.mov',
    '.mpeg',
    '.mpg',
    '.wmv',
    '.3gp',
    '.asf',
    '.m4v',
    '.flv',
    '.m2ts',
    '.tp',
    '.f4v',
  ];
  private completedDirs = 0;
  private limit: (
    ...args: GetFileListArgs
  ) => Promise<ApiResponse<FileListResponse>>;

  // 任务中断/互斥相关
  private cancelFlag = false;

  constructor() {
    this.limit = limiter.wrap(
      (dir_id: string | -1, token: string, page = 1, lastFileId = '') =>
        this.getFileListWithRetry(dir_id, token, page, lastFileId)
    );
  }

  async startScan(rootPath = '0') {
    this.completedDirs = 0;
    const user = await this.userModel.findOne({ token: { $exists: true } });
    if (!user?.token) throw new Error('Token not found');
    const startTime = Date.now();
    this.logger.warn(
      `[${new Date().toISOString()}] 开始递归扫描 from rootPath: ${rootPath}`
    );
    await this.do({
      currentPath: rootPath,
      token: user.token,
      parentFileId: 0,
      absPath: '/',
      cnNamepath: '/',
      filename: '',
    });
    this.logger.warn(
      `[${new Date().toISOString()}] 扫描完成，总目录数: ${
        this.completedDirs
      }, 用时: ${Math.round((Date.now() - startTime) / 1000)} 秒`
    );
  }

  private async getFileListWithRetry(
    dir_id: string | -1,
    token: string,
    page = 1,
    lastFileId = '',
    maxRetry = 3,
    retryDelay = 2000
  ): Promise<ApiResponse<FileListResponse>> {
    let attempt = 0;
    while (true) {
      try {
        return await this.getFileList(dir_id, token, page, lastFileId);
      } catch (err) {
        attempt++;
        if (attempt >= maxRetry) {
          throw err;
        }
        await this.delay(retryDelay);
      }
    }
  }

  private delay(ms: number) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  private async fetchAllFiles(currentPath: string, token: string) {
    const allFiles: FileItem[] = [];
    let page = 1;
    let tempId: string | -1 = currentPath;
    do {
      const res = await this.limit(tempId, token, page);
      allFiles.push(...res.data.fileList);
      tempId = res.data.lastFileId;
      page++;
    } while (tempId !== -1);

    return allFiles;
  }

  private async do(job: {
    currentPath: string;
    token: string;
    parentFileId: number | string;
    absPath: string;
    cnNamepath: string;
    filename: string;
  }) {
    if (this.cancelFlag) {
      this.logger.warn('扫描任务收到中断指令，提前退出');
      return;
    }
    try {
      const files = await this.fetchAllFiles(job.currentPath, job.token);
      const dbFilesList = await this.fsItemModel.find({
        parentFileId: job.currentPath,
      });
      // 不存在于结果中的文件
      const differentFiles = dbFilesList.filter(
        file =>
          !files.some(v => v.fileId === file.fileId) &&
          this.WhiteDirs.every(dir => !file.filename.includes(dir))
      );
      if (differentFiles.length > 0) {
        this.logger.warn(
          `删除不存在的文件: ${differentFiles.map(file => file.cnNamepath)}`
        );
        // 删除parentFileId为当前目录的文件 以及子集
        for (const file of differentFiles) {
          this.fsItemModel.deleteMany({
            absPath: { $regex: `^${file.absPath}` },
          });
          this.fsItemModel.deleteMany({ fileId: file.fileId });
          const filePath = `${process.cwd()}/media/${file.cnNamepath}`;
          try {
            unlinkSync(filePath);
          } catch (err) {
            this.logger.error(
              `Failed to delete file: ${filePath}, Error: ${err.message}`
            );
          }
        }
      }
      const subPromises: Promise<void>[] = [];
      for (const item of files) {
        if (this.cancelFlag) {
          this.logger.warn('扫描任务收到中断指令，提前退出');
          return;
        }
        // 拼接路径（始终以 / 开头）
        const childAbsPath = job.absPath.endsWith('/')
          ? `${job.absPath}${item.fileId}`
          : `${job.absPath}/${item.fileId}`;
        const childCnNamepath = job.cnNamepath.endsWith('/')
          ? `${job.cnNamepath}${item.filename}`
          : `${job.cnNamepath}/${item.filename}`;
        // 过滤掉白名单目录
        // 例如: 来自：BT磁力链下载/xxx/xxx
        const isInWhiteDir = this.WhiteDirs.some(dir =>
          childCnNamepath.includes(dir)
        );
        if (isInWhiteDir) {
          this.logger.warn(
            `跳过白名单目录: ${item.fileId}, cnName: ${childCnNamepath}`
          );
          continue;
        }
        this.fsItemModel.updateOne(
          {
            fileId: item.fileId,
          },
          {
            $set: {
              ...item,
              absPath: childAbsPath,
              cnNamepath: childCnNamepath,
            },
          },
          {
            upsert: true,
          }
        );
        if (item.type === 1) {
          // 目录类型
          // 创建目录
          mkdirSync(`${process.cwd()}/media/${childCnNamepath}`, {
            recursive: true,
          });
          // 递归扫描子目录
          subPromises.push(
            this.do({
              currentPath: String(item.fileId),
              token: job.token,
              parentFileId: item.parentFileId,
              absPath: childAbsPath,
              cnNamepath: childCnNamepath,
              filename: item.filename,
            })
          );
        } else if (item.type === 0) {
          const extName = extname(item.filename);
          const { fileId } = item;
          const filePath = `${process.cwd()}/media${childCnNamepath}`;

          if (this.META_DATA_EXT.includes(extName) && !existsSync(filePath)) {
            this.downloadFile(fileId, job.token, childCnNamepath);
          } else if (this.MEDIA_DATA_EXT.includes(extName)) {
            const strmPath = filePath.replace(extName, '.strm');
            const id = fileId;
            const filename = item.filename;
            const dirName = dirname(strmPath);
            const url = `${this.BASE_STRM_URL}?id=${id}&fileName=${filename}`;
            // const encodedUrl = encodeURIComponent(url);
            if (existsSync(strmPath)) {
              // writeFileSync(strmPath, encodedUrl);
              continue;
            } else {
              mkdirSync(dirName, { recursive: true });
              writeFileSync(strmPath, url);
            }
            this.logger.warn(`创建文件成功: filePath: ${strmPath}`);
          }
          // 文件类型
        }
      }
      await Promise.all(subPromises);
      this.completedDirs++;
    } catch (error) {
      this.logger.error(
        `[${new Date().toISOString()}] 扫描失败: ${
          job.currentPath
        }，错误信息: ${error}`
      );
    }
  }

  async getFileList(
    dir_id: string | -1,
    token: string,
    _page = 1,
    lastFileId = ''
  ) {
    return this.httpClient.makeHttpRequest<FileListResponse>(
      '/api/v2/file/list',
      {
        limit: 100,
        parentFileId: dir_id,
        lastFileId,
        trashed: 0,
      },
      {
        method: 'GET',
        headers: { Authorization: `Bearer ${token}` },
        timeout: 20000,
      }
    );
  }
  async getFileLinkById(fileId: number, token: string) {
    return this.httpClient.makeHttpRequest<{ downloadUrl: string }>(
      '/api/v1/file/download_info',
      {
        fileId,
      },
      {
        method: 'GET',
        headers: { Authorization: `Bearer ${token}` },
      }
    );
  }

  async downloadFile(fileId: number, token: string, cnName: string) {
    this.logger.warn(
      `开始下载文件: ${fileId}, cnName: ${cnName}, token: ${token}`
    );
    const MAX_RETRY = 3;
    const RETRY_DELAY = 1000;

    for (let attempt = 1; attempt <= MAX_RETRY; attempt++) {
      try {
        const res = await this.getFileLinkById(fileId, token);
        if (res.code !== 0) {
          throw new Error(`获取下载链接失败: ${res.message}`);
        }
        const downloadUrl = res.data.downloadUrl;
        const filePath = `${process.cwd()}/media${cnName}`;
        const dir = dirname(filePath);
        mkdirSync(dir, { recursive: true });

        const writer = createWriteStream(filePath);
        const response = await axios({
          url: downloadUrl,
          method: 'GET',
          responseType: 'stream',
          headers: { Authorization: `Bearer ${token}` },
        });
        response.data.pipe(writer);

        await new Promise((resolve, reject) => {
          writer.on('finish', resolve);
          writer.on('error', reject);
        });

        this.logger.warn(
          `文件下载完成: ${fileId}, cnName: ${cnName}, filePath: ${filePath}`
        );
        return true;
      } catch (error) {
        this.logger.error(
          `下载文件失败: ${fileId}, cnName: ${cnName}, 第${attempt}次, 错误信息: ${error.message}`
        );
        if (attempt < MAX_RETRY) {
          await new Promise(r => setTimeout(r, RETRY_DELAY));
          this.logger.warn(`准备进行第${attempt + 1}次重试...`);
        } else {
          this.logger.warn('下载最终失败！');
        }
      }
    }
  }
}
