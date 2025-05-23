import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios';
import { ApiResponse } from '../interface';
import { Inject, Provide } from '@midwayjs/core';
import { TokenService } from '../service/token.service';

@Provide()
export class HttpClient {
  private readonly API_DOMAIN = 'https://open-api.123pan.com';
  private axiosInstance: AxiosInstance;

  @Inject()
  tokenService: TokenService;

  constructor() {
    this.axiosInstance = axios.create({
      baseURL: this.API_DOMAIN,
      timeout: 10000,
      headers: {
        'Content-Type': 'application/json; charset=UTF-8',
        platform: 'open_platform',
      },
    });

    // 请求拦截器（自动添加Token，每次都拿最新token）
    this.axiosInstance.interceptors.request.use(async config => {
      const token = await this.tokenService.checkToken(); // 推荐方法名
      if (token) {
        config.headers!.Authorization = `Bearer ${token}`;
      }
      return config;
    });
  }

  /**
   * 发起HTTP请求（主方法）
   * 自动处理token过期与重试
   */
  async makeHttpRequest<T>(
    endpoint: string,
    data?: Record<string, any>,
    config: AxiosRequestConfig = {}
  ): Promise<ApiResponse<T>> {
    const fullConfig: AxiosRequestConfig = {
      ...config,
      method: config.method || 'POST',
      data: data ? JSON.stringify(data) : undefined,
      url: endpoint,
    };
    try {
      let response = await this.axiosInstance.request<
        any,
        AxiosResponse<ApiResponse<T>>
      >(fullConfig);
      if (response.status === 401 || response.data.code === 401) {
        // token 失效，尝试刷新并重试一次
        await this.tokenService.refreshToken();
        response = await this.axiosInstance.request<
          any,
          AxiosResponse<ApiResponse<T>>
        >(fullConfig);
      }
      if (response.status !== 200) {
        throw this.normalizeError(
          new Error(`API Error: ${response.data.code} - ${response.status}`)
        );
      }
      if (response.data.code !== 0) {
        throw this.normalizeError(
          new Error(
            `API Error: ${response.data.code} - ${response.data.message}`
          )
        );
      }
      return response.data;
    } catch (error) {
      throw this.normalizeError(error);
    }
  }

  /**
   * 标准化错误格式
   */
  private normalizeError(error: any): Error {
    if (error.response) {
      return new Error(
        `API Error: ${error.response.status} - ${JSON.stringify(
          error.response.data
        )}`
      );
    }
    return error instanceof Error ? error : new Error(String(error));
  }
}
