// 常量定义

/**
 * 缓存过期时间 (毫秒)
 */
export const CACHE_TTL = {
  /** 2小时 - 成员列表缓存 */
  SHORT: 2 * 60 * 60 * 1000,
  /** 4小时 - 角色对比数据缓存 */
  MEDIUM: 4 * 60 * 60 * 1000,
  /** 8小时 - 角色完整数据、装备详情缓存 */
  LONG: 8 * 60 * 60 * 1000,
} as const;

/**
 * localStorage 存储键名
 */
export const STORAGE_KEYS = {
  // 管理后台
  ADMIN_SESSION: 'chunxia_admin',
  MEMBERS: 'chunxia_members',
  APPLICATIONS: 'chunxia_applications',
  EQUIPMENT_CACHE: 'chunxia_equipment_cache',
  ADMIN_LOGIN: 'chunxia_admin_login',

  // 角色搜索/对比历史
  SEARCH_HISTORY: 'character_search_history',
  COMPARE_HISTORY: 'character_compare_history',
} as const;

/**
 * 动态存储键名生成函数
 */
export const STORAGE_KEY_BUILDERS = {
  /** 角色完整数据缓存 */
  characterComplete: (serverId: number, characterId: string) =>
    `character_complete_${serverId}_${characterId}`,

  /** 同步的角色信息 */
  syncCharacter: (memberId: string) => `aion2_character_${memberId}`,

  /** 同步的装备数据 */
  syncEquipment: (memberId: string) => `aion2_equipment_${memberId}`,

  /** 装备详情缓存 */
  equipmentDetail: (equipmentId: number, slotPos?: number) =>
    slotPos ? `equipment_detail_${equipmentId}_${slotPos}` : `equipment_detail_${equipmentId}`,
} as const;

/**
 * API 端点前缀
 */
export const API_PREFIX = {
  /** AION2 代理 API */
  AION2: '/api/aion2',
  /** 角色 API */
  CHARACTER: '/api/character',
  /** 成员 API */
  MEMBERS: '/api/members',
  /** 物品 API */
  ITEMS: '/api/items',
} as const;

/**
 * 数字常量
 */
export const LIMITS = {
  /** 搜索历史最大条数 */
  MAX_SEARCH_HISTORY: 5,
  /** 对比历史最大条数 */
  MAX_COMPARE_HISTORY: 20,
} as const;
