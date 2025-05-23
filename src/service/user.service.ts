import { Provide } from '@midwayjs/core';
import { IUserOptions } from '../interface';
import { InjectEntityModel } from '@midwayjs/typegoose';
import { ReturnModelType } from '@typegoose/typegoose';
import { User } from '../entity/user';
@Provide()
export class UserService {
  @InjectEntityModel(User)
  userModel: ReturnModelType<typeof User>;
  async getUser(options: Partial<IUserOptions>) {
    if (!options.uid) {
      return null;
    }
    const user = await this.userModel.findOne({ uid: options.uid });
    if (!user) {
      return null;
    }
    return user;
  }
}
