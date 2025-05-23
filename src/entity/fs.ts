import { prop, modelOptions, index } from '@typegoose/typegoose';

@modelOptions({ schemaOptions: { collection: 'fs_items' } })
@index({ fileId: 1 }, { unique: true })
@index({ parentFileId: 1 })
export class FsItem {
  @prop({ required: true })
  fileId: number;

  @prop()
  fileID?: number; // 兼容旧字段

  @prop({ required: true })
  filename: string;

  @prop({ required: true, enum: [0, 1] })
  type: 0 | 1; // 0-文件 1-文件夹

  @prop({ required: true })
  size: number;

  @prop()
  etag?: string;

  @prop({ required: true })
  status: number;

  @prop({ required: true })
  parentFileId: number;

  @prop({ enum: [0, 1, 2, 3], default: 0 })
  category: 0 | 1 | 2 | 3;

  @prop({ enum: [0, 1], default: 0 })
  trashed: 0 | 1;

  @prop({ required: true })
  absPath: string; // 形如 /0/123/456/

  @prop({ required: true })
  cnNamepath: string; // 形如 /根目录/电影/科幻/
}
