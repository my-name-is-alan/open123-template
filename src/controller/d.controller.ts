import { Inject, Controller, Get, Param, HttpCode } from '@midwayjs/core';
import { UserService } from '../service/user.service';
import { TokenService } from '../service/token.service';
import { User } from '../entity/user';
import { InjectEntityModel } from '@midwayjs/typegoose';
import { ReturnModelType } from '@typegoose/typegoose';
import { FileService } from '../service/file.service';
import { Context } from '@midwayjs/koa';
import { RedisService } from '@midwayjs/redis';

@Controller('/d')
export class APIController {
  @Inject()
  redisService: RedisService;
  @Inject()
  userService: UserService;
  @Inject()
  tokenService: TokenService;
  @InjectEntityModel(User)
  userModel: ReturnModelType<typeof User>;
  @Inject()
  fileService: FileService;
  @Inject()
  ctx: Context;
  @Get('/:id/:fileName')
  @HttpCode(302)
  async getFileList(@Param('id') id: string) {
    const cacheKey = `fileList_${id}`;
    const cacheData = await this.redisService.get(cacheKey);
    if (cacheData) {
      return this.ctx.redirect(cacheData);
    }
    const token = await this.tokenService.checkToken();
    if (!token) {
      return {
        code: 401,
        message: 'Unauthorized',
      };
    }
    const {
      data: { downloadUrl },
    } = await this.fileService.getFileLinkById(Number(id), token);
    if (!downloadUrl) {
      return {
        code: 404,
        message: 'File not found',
      };
    }
    this.redisService.set(cacheKey, downloadUrl, 'EX', 3600);
    return this.ctx.redirect(downloadUrl);
  }
}
