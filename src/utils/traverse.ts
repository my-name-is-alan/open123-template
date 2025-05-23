// import { FileListResponse } from '../interface';
// import { httpClient } from './http';

// /**
//  * 获取目录下的文件列表
//  * @param dir_id
//  * @param token
//  * @param lastFileId
//  * @returns
//  */
// export function traverseDirectory(
//   dir_id = '0',
//   token,
//   lastFileId = '',
//   page = 1
// ) {
//   return httpClient.makeHttpRequest<FileListResponse>(
//     '/api/v1/file/list',
//     {
//       limit: 100,
//       parentFileId: dir_id,
//       lastFileId: lastFileId,
//       page,
//       trashed: 0,
//       orderDirection: 'asc',
//       orderBy: 'file_name',
//     },
//     {
//       method: 'GET',
//       headers: {
//         Authorization: `Bearer ${token}`,
//       },
//     }
//   );
// }

// // src/utils/traverse.ts
// export class GlobalRateLimiter {
//   private readonly minDelay: number;
//   private lastCallTime = 0;
//   private queue: Array<() => void> = [];
//   private isProcessing = false;

//   constructor(qps: number) {
//     this.minDelay = 1000 / qps; // 计算最小间隔(ms)
//   }

//   async acquire(): Promise<() => void> {
//     return new Promise(resolve => {
//       const releaseFunc = () => {
//         this.lastCallTime = Date.now();
//         resolve(() => this.processNext());
//       };

//       this.queue.push(releaseFunc);
//       if (!this.isProcessing) this.processQueue();
//     });
//   }

//   private processQueue() {
//     if (this.queue.length === 0) {
//       this.isProcessing = false;
//       return;
//     }

//     this.isProcessing = true;
//     const now = Date.now();
//     const nextCallTime = Math.max(now, this.lastCallTime + this.minDelay);
//     const delay = nextCallTime - now;

//     setTimeout(() => {
//       const nextJob = this.queue.shift()!;
//       nextJob(); // 触发releaseFunc
//     }, delay);
//   }

//   private processNext() {
//     this.processQueue();
//   }
// }

// // limiter.js
// class RateLimiter {
//   private qps: number; // 每秒允许多少次
//   private tokens: number; // 当前可用的令牌数
//   private lastRefill: number; // 上次补充令牌的时间
//   constructor(qps) {
//     this.qps = qps; // 每秒允许多少次
//     this.tokens = qps;
//     this.lastRefill = Date.now();
//   }

//   async wait() {
//     while (!this._consumeToken()) {
//       // 等待 10ms 后再次尝试
//       await new Promise(res => setTimeout(res, 10));
//     }
//   }

//   _refillTokens() {
//     const now = Date.now();
//     const elapsed = (now - this.lastRefill) / 1000;
//     const refill = Math.floor(elapsed * this.qps);
//     if (refill > 0) {
//       this.tokens = Math.min(this.qps, this.tokens + refill);
//       this.lastRefill = now;
//     }
//   }

//   _consumeToken() {
//     this._refillTokens();
//     if (this.tokens > 0) {
//       this.tokens -= 1;
//       return true;
//     }
//     return false;
//   }
// }

// class MultiKeyRateLimiter {
//   private limiters: Map<string, RateLimiter>;
//   constructor() {
//     this.limiters = new Map();
//   }

//   setQPS(key, qps) {
//     this.limiters.set(key, new RateLimiter(qps));
//   }

//   async wait(key) {
//     const limiter = this.limiters.get(key);
//     if (!limiter) throw new Error(`No limiter set for key: ${key}`);
//     await limiter.wait();
//   }
// }

// export const qpsLimits = new MultiKeyRateLimiter();
