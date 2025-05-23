export interface QPSLimiterOptions {
  defaultQPS?: number; // 默认QPS (默认10)
  maxRetry?: number; // 最大重试次数 (默认3)
  redisClient?: any; // 可选Redis客户端 (不传则用内存模式)
  retryDelay?: number; // 重试延迟ms (默认100)
  burstable?: boolean; // 是否允许突发流量 (默认false)
  burstTokens?: number; // 突发令牌数 (默认5)
  timeout?: number; // 单次请求超时ms (默认3000)
}
