/**
 * @description User-Service parameters
 */
export interface IUserOptions {
  uid: number; // 用户账号ID
  nickname: string; // 昵称
  headImage: string; // 头像
  passport: string; // 手机号码
  mail: string; // 邮箱
  spaceUsed: number; // 已用空间
  spacePermanent: number; // 永久空间
  spaceTemp: number; // 临时空间
  spaceTempExpr: string; // 临时空间到期日（建议用 Date 或 ISO 8601 字符串）
  vip: boolean; // 是否会员
  directTraffic: number; // 剩余直链流量
  isHideUID: boolean; // 直链链接是否隐藏UID
  token?: string; // cookie
}

export interface ApiResponse<T = any> {
  code: number;
  message: string;
  data: T;
}

/**
 * 文件列表查询参数
 */
export interface FileListQueryParams {
  /**
   * 文件夹ID
   * - 查询根目录时传 0
   */
  parentFileId: number;

  /**
   * 每页文件数量
   * - 最大值不超过100
   */
  limit: number;

  /**
   * 搜索关键字
   * - 提供此参数时将无视 parentFileId 参数，进行全局查找
   * - 不传或空字符串时不启用搜索
   */
  searchData?: string;

  /**
   * 搜索模式
   * - 0: 全文模糊搜索（根据搜索项分词，查找相似匹配项）
   * - 1: 精准搜索（需要提供完整文件名）
   * - 注意：仅在 searchData 有值时有效
   */
  searchMode?: 0 | 1;

  /**
   * 翻页文件ID
   * - 首次查询不传或传空
   * - 后续翻页传入上次返回的 lastFileId
   */
  lastFileId?: number;
}

/**
 * 文件列表分页响应数据结构
 */
export interface FileListResponse {
  /**
   * 分页标识
   * @description -1代表最后一页（无需再翻页查询），其他代表下一页开始的文件id
   */
  lastFileId: string | -1;

  /** 文件列表 */
  fileList: FileItem[];
  total?: number; // 总文件数
}

/**
 * 文件/文件夹项
 */
export interface FileItem {
  /** 文件ID */
  fileID: number;

  fileId: number;

  /** 文件名 */
  filename: string;

  /** 类型：0-文件 1-文件夹 */
  type: 0 | 1;

  /** 文件大小（字节） */
  size: number;

  /** 文件MD5值 */
  etag: string;

  /**
   * 文件审核状态
   * @description 大于100为审核驳回文件
   */
  status: number;

  /** 父目录ID */
  parentFileId: number;

  /**
   * 文件分类
   * @description 0-未知 1-音频 2-视频 3-图片
   */
  category: 0 | 1 | 2 | 3;

  /** 回收站标识：0-否 1-是 */
  trashed: 0 | 1;
}
