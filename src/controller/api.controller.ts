import { Inject, Controller, Get } from '@midwayjs/core';
import { Context } from '@midwayjs/koa';
import { UserService } from '../service/user.service';
import { TokenService } from '../service/token.service';
import { User } from '../entity/user';
import { InjectEntityModel } from '@midwayjs/typegoose';
import { ReturnModelType } from '@typegoose/typegoose';
import { FileService } from '../service/file.service';
@Controller('/api')
export class APIController {
  @Inject()
  ctx: Context;

  @Inject()
  userService: UserService;
  @Inject()
  tokenService: TokenService;
  @InjectEntityModel(User)
  userModel: ReturnModelType<typeof User>;
  @Inject()
  fileService: FileService;

  @Get('/init')
  async initSys() {
    const HasToken = await this.tokenService.checkToken();
    if (!HasToken) {
      try {
        const tokenRes = await this.tokenService.getToken();
        const userInfoRes = await this.tokenService.getUserInfo(
          tokenRes.data.accessToken
        );
        await this.userModel.create({
          ...userInfoRes.data,
          token: tokenRes.data.accessToken,
          expiredAt: tokenRes.data.expiredAt,
        });
        const user = await this.userService.getUser({
          uid: userInfoRes.data.uid,
        });
        if (!user) {
          return {
            code: 500,
            message: 'User not found',
          };
        }
        return {
          code: 200,
          message: 'ok',
          data: {
            uid: user.uid,
            nickname: user.nickname,
            headImage: user.headImage,
            passport: user.passport,
            mail: user.mail,
            spaceUsed: user.spaceUsed,
            spacePermanent: user.spacePermanent,
            spaceTemp: user.spaceTemp,
            spaceTempExpr: user.spaceTempExpr,
            vip: user.vip,
            directTraffic: user.directTraffic,
            isHideUID: user.isHideUID,
          },
        };
      } catch (error) {
        console.error('Failed to initialize system:', error);
        return {
          code: 500,
          message: 'System initialization failed',
        };
      }
    } else {
      return {
        code: 200,
        message: 'ok',
      };
    }
  }

  @Get('/start')
  async startSys() {
    this.fileService.startScan('0');
    return {
      code: 200,
      message: 'ok',
    };
  }
}
