import { prop } from '@typegoose/typegoose';

export class User {
  @prop({ required: true, unique: true })
  public uid!: number; // 用户账号ID

  @prop({ required: true })
  public nickname!: string; // 昵称

  @prop({ required: true })
  public headImage!: string; // 头像URL

  @prop({ required: true, unique: true })
  public passport!: string; // 手机号码

  @prop({ required: false, unique: true })
  public mail!: string; // 邮箱

  @prop({ required: false, default: 0 })
  public spaceUsed!: number; // 已用空间（单位：MB）

  @prop({ required: false, default: 0 })
  public spacePermanent!: number; // 永久空间（单位：MB）

  @prop({ required: false, default: 0 })
  public spaceTemp!: number; // 临时空间（单位：MB）

  @prop({ required: false })
  public spaceTempExpr!: string; // 临时空间到期日（如 "2023-12-31"）

  @prop({ required: false, default: false })
  public vip!: boolean; // 是否VIP会员

  @prop({ required: false, default: 0 })
  public directTraffic!: number; // 剩余直链流量（单位：GB）

  @prop({ required: false, default: false })
  public isHideUID!: boolean; // 是否隐藏UID

  @prop({ required: false })
  public token?: string; // cookie

  @prop({ required: false })
  public expiredAt?: string; // token过期时间
}

// 生成Mongoose模型
