// API 服务 - 生成 AION2 台湾官方 API 请求 URL

import type { MemberConfig } from '../types/admin';

// ============= 常量 =============

const API_BASE_URL = 'https://tw.ncsoft.com/aion2/api';

// ============= API URL 生成 =============

/**
 * 生成角色信息 API URL
 * @param characterId - 角色ID (需要 URL 编码)
 * @param serverId - 服务器ID
 * @returns API URL
 */
export function getCharacterInfoUrl(characterId: string, serverId: number): string {
  return `${API_BASE_URL}/character/info?lang=zh&characterId=${characterId}&serverId=${serverId}`;
}

/**
 * 生成角色装备列表 API URL
 * @param characterId - 角色ID (需要 URL 编码)
 * @param serverId - 服务器ID
 * @returns API URL
 */
export function getCharacterEquipmentUrl(characterId: string, serverId: number): string {
  return `${API_BASE_URL}/character/equipment?lang=zh&characterId=${characterId}&serverId=${serverId}`;
}

/**
 * 生成装备详情 API URL
 * @param itemId - 装备ID
 * @param enchantLevel - 总强化等级（enchantLevel + exceedLevel）
 * @param characterId - 角色ID (需要 URL 编码)
 * @param serverId - 服务器ID
 * @param slotPos - 装备槽位
 * @returns API URL
 */
export function getEquipmentDetailUrl(
  itemId: number,
  enchantLevel: number,
  characterId: string,
  serverId: number,
  slotPos: number
): string {
  return `${API_BASE_URL}/character/equipment/item?id=${itemId}&enchantLevel=${enchantLevel}&characterId=${characterId}&serverId=${serverId}&slotPos=${slotPos}&lang=zh`;
}

/**
 * 从成员配置生成角色信息 URL
 */
export function getCharacterUrlFromMember(member: MemberConfig): string | null {
  if (member.characterId && member.serverId !== undefined) {
    return getCharacterInfoUrl(member.characterId, member.serverId);
  }
  return null;
}

/**
 * 从成员配置生成角色装备 URL
 */
export function getCharacterEquipmentUrlFromMember(member: MemberConfig): string | null {
  if (member.characterId && member.serverId !== undefined) {
    return getCharacterEquipmentUrl(member.characterId, member.serverId);
  }
  return null;
}

/**
 * 从完整 URL 中提取参数
 */
export function parseApiUrl(url: string): { characterId: string; serverId: number } | null {
  try {
    const urlObj = new URL(url);
    const characterId = urlObj.searchParams.get('characterId');
    const serverId = urlObj.searchParams.get('serverId');

    if (!characterId || !serverId) {
      return null;
    }

    return {
      characterId: decodeURIComponent(characterId),
      serverId: parseInt(serverId, 10),
    };
  } catch {
    return null;
  }
}


// ============= 装备数据处理 =============

/**
 * 计算装备的实际强化等级
 * enchantLevel = enchantLevel + exceedLevel
 * @param enchantLevel - 基础强化等级
 * @param exceedLevel - 超越强化等级
 * @returns 实际强化等级
 */
export function calculateTotalEnchantLevel(enchantLevel: number, exceedLevel: number): number {
  return enchantLevel + exceedLevel;
}

/**
 * 从装备数据中提取需要请求详情的参数
 * @param equipment - 装备基础数据（从角色信息中获取）
 * @returns 装备ID和总强化等级
 */
export function getEquipmentParams(equipment: {
  id: number;
  enchantLevel?: number;
  exceedLevel?: number;
}): { itemId: number; enchantLevel: number } {
  const enchantLevel = equipment.enchantLevel || 0;
  const exceedLevel = equipment.exceedLevel || 0;
  return {
    itemId: equipment.id,
    enchantLevel: calculateTotalEnchantLevel(enchantLevel, exceedLevel),
  };
}

// ============= 数据验证 =============

/**
 * 验证成员配置是否完整（可以发起 API 请求）
 */
export function validateMemberConfig(member: MemberConfig): {
  valid: boolean;
  message?: string;
} {
  const hasCharacterId = member.characterId && member.characterId.trim();
  const hasServerId = member.serverId !== undefined && member.serverId !== null;

  if (hasCharacterId && hasServerId) {
    return { valid: true };
  }

  if (!hasCharacterId && !hasServerId) {
    return { valid: false, message: '未配置角色信息' };
  }

  return { valid: false, message: '角色配置不完整' };
}

/**
 * 检查 API URL 是否有效
 */
export function isValidApiUrl(url: string): boolean {
  try {
    const urlObj = new URL(url);
    return urlObj.hostname === 'tw.ncsoft.com' && urlObj.pathname.startsWith('/aion2/api/');
  } catch {
    return false;
  }
}

// ============= 错误处理辅助 =============

/**
 * API 错误类型
 */
export const ApiErrorType = {
  NETWORK_ERROR: 'NETWORK_ERROR',
  CORS_ERROR: 'CORS_ERROR',
  NOT_FOUND: 'NOT_FOUND',
  INVALID_RESPONSE: 'INVALID_RESPONSE',
  UNKNOWN: 'UNKNOWN',
} as const;

export type ApiErrorType = typeof ApiErrorType[keyof typeof ApiErrorType];

/**
 * 解析 API 错误
 */
export function parseApiError(error: any): { type: ApiErrorType; message: string } {
  if (error instanceof TypeError && error.message.includes('fetch')) {
    return {
      type: ApiErrorType.NETWORK_ERROR,
      message: '网络请求失败，请检查网络连接',
    };
  }

  if (error.message?.includes('CORS')) {
    return {
      type: ApiErrorType.CORS_ERROR,
      message: 'CORS 错误：无法直接从浏览器请求数据，请使用同步脚本',
    };
  }

  if (error.status === 404) {
    return {
      type: ApiErrorType.NOT_FOUND,
      message: '数据不存在或角色ID/装备ID无效',
    };
  }

  return {
    type: ApiErrorType.UNKNOWN,
    message: error.message || '未知错误',
  };
}

// ============= 本地数据路径生成 =============

/**
 * 生成成员角色数据的本地路径
 */
export function getMemberDataPath(memberId: string): string {
  return `/data/${memberId}/character.json`;
}

/**
 * 生成成员装备详情的本地路径
 */
export function getMemberEquipmentPath(memberId: string): string {
  return `/data/${memberId}/equipment_details.json`;
}

/**
 * 生成装备图标 URL
 * @param iconPath - 图标路径（从 API 返回）
 * @returns 完整的图标 URL
 */
export function getEquipmentIconUrl(iconPath: string): string {
  // 如果已经是完整 URL，直接返回
  if (iconPath.startsWith('http://') || iconPath.startsWith('https://')) {
    return iconPath;
  }

  // 假设图标托管在官方 CDN
  return `https://tw.ncsoft.com${iconPath}`;
}
