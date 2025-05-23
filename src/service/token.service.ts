// src/service/token.service.ts
import { Provide, Config, Inject } from '@midwayjs/core';
import { HttpClient } from '../utils/http';
import { IUserOptions } from '../interface';
import { InjectEntityModel } from '@midwayjs/typegoose';
import { User } from '../entity/user';
import { ReturnModelType } from '@typegoose/typegoose';

@Provide()
export class TokenService {
  @Config('panAPI')
  private panAPI: {
    clientId: string;
    clientSecret: string;
    tokenEndpoint: string;
  };
  @Inject()
  private httpClient: HttpClient;
  @InjectEntityModel(User)
  private userModel: ReturnModelType<typeof User>;
  async getToken() {
    try {
      const res = await this.httpClient.makeHttpRequest<{
        accessToken: string;
        expiredAt: string;
      }>(
        '/api/v1/access_token',
        {
          clientID: this.panAPI.clientId,
          clientSecret: this.panAPI.clientSecret,
        },
        { method: 'POST' }
      );
      return res;
    } catch (error) {
      console.error('Failed to get token:', error);
      throw new Error('Token acquisition failed');
    }
  }

  async getUserInfo(token: string) {
    try {
      const res = await this.httpClient.makeHttpRequest<IUserOptions>(
        '/api/v1/user/info',
        {},
        {
          method: 'GET',
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      return res;
    } catch (error) {
      console.error('Failed to get user info:', error);
      throw new Error('User info acquisition failed');
    }
  }
  async checkToken() {
    const user = await this.userModel.findOne({
      token: { $exists: true },
    });
    if (!user) {
      return false;
    }
    const { expiredAt } = user;
    const now = new Date();
    const expiredDate = new Date(expiredAt);
    if (now > expiredDate) {
      // Token expired, refresh it
      const newToken = await this.getToken();
      user.token = newToken.data.accessToken;
      user.expiredAt = new Date(newToken.data.expiredAt).toDateString();
      await user.save();
    }
    return user.token;
  }
  async refreshToken() {
    const user = await this.userModel.findOne({
      token: { $exists: true },
    });
    if (!user) {
      return null;
    }
    const { expiredAt } = user;
    const now = new Date();
    const expiredDate = new Date(expiredAt);
    if (now > expiredDate) {
      const newToken = await this.getToken();
      user.token = newToken.data.accessToken;
      user.expiredAt = new Date(newToken.data.expiredAt).toDateString();
      await user.save();
    }
    return user.token;
  }
}
