// 数据同步服务 - 通过代理调用 AION2 API

import type { MemberConfig, EquipmentDetail } from '../types/admin';
import type { CharacterInfo, CharacterEquipment } from '../data/memberTypes';

// 开发环境使用代理,生产环境需要后端支持
const API_PROXY_PREFIX = '/api/aion2';

// 同步结果类型
interface SyncMemberResult {
  success: boolean;
  characterInfo?: CharacterInfo;
  equipmentData?: CharacterEquipment;
  equipmentDetails?: EquipmentDetail[];
  error?: string;
}

// 批量同步结果类型
interface SyncAllResult {
  total: number;
  success: number;
  failed: number;
  results: Map<string, SyncMemberResult>;
}

/**
 * 延迟函数
 */
function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * 发送代理请求
 */
async function fetchWithProxy<T = unknown>(url: string): Promise<T> {
  // 将完整 URL 转换为代理 URL
  // 例如: https://tw.ncsoft.com/aion2/api/character/info?lang=zh&characterId=...&serverId=...
  // 转换为: /api/aion2/character/info?lang=zh&characterId=...&serverId=...

  let proxyUrl: string;

  if (url.startsWith('http')) {
    const urlObj = new URL(url);
    // pathname: /aion2/api/character/info
    // 需要移除 /aion2/api 前缀,因为代理会自动添加
    const apiPath = urlObj.pathname.replace('/aion2/api', '');
    proxyUrl = `${API_PROXY_PREFIX}${apiPath}${urlObj.search}`;
  } else if (url.startsWith('/api/aion2')) {
    // 已经是代理 URL 格式
    proxyUrl = url;
  } else {
    // 其他格式,假设是相对路径
    proxyUrl = `${API_PROXY_PREFIX}${url}`;
  }

  const response = await fetch(proxyUrl);

  if (!response.ok) {
    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
  }

  return await response.json();
}

/**
 * 获取角色信息
 */
async function getCharacterInfo(member: MemberConfig): Promise<CharacterInfo> {
  if (!member.characterId || !member.serverId) {
    throw new Error('未配置角色信息 (characterId 或 serverId)');
  }

  // 使用后端代理API
  const response = await fetch(
    `/api/character/info?characterId=${encodeURIComponent(member.characterId)}&serverId=${member.serverId}`
  );

  if (!response.ok) {
    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
  }

  return await response.json();
}

/**
 * 获取角色装备列表
 */
async function getCharacterEquipment(member: MemberConfig): Promise<CharacterEquipment> {
  if (!member.characterId || !member.serverId) {
    throw new Error('未配置角色信息 (characterId 或 serverId)');
  }

  // 构建装备列表URL
  const url = `${API_PROXY_PREFIX}/character/equipment?lang=zh&characterId=${encodeURIComponent(member.characterId)}&serverId=${member.serverId}`;
  return await fetchWithProxy<CharacterEquipment>(url);
}

/**
 * 获取装备详情
 */
async function getEquipmentDetail(
  itemId: number,
  enchantLevel: number,
  slotPos: number,
  member: MemberConfig
): Promise<EquipmentDetail> {
  if (!member.characterId || !member.serverId) {
    throw new Error('未配置角色信息 (characterId 或 serverId)');
  }

  // 构建装备详情 URL
  const url = `/api/aion2/character/equipment/item?id=${itemId}&enchantLevel=${enchantLevel}&characterId=${encodeURIComponent(member.characterId)}&serverId=${member.serverId}&slotPos=${slotPos}&lang=zh`;

  return await fetchWithProxy<EquipmentDetail>(url);
}

/**
 * 同步单个成员的数据
 */
export async function syncMemberData(
  member: MemberConfig,
  onProgress?: (message: string, type?: 'info' | 'success' | 'error') => void
): Promise<SyncMemberResult> {
  const log = (message: string, type: 'info' | 'success' | 'error' = 'info') => {
    onProgress?.(message, type);
  };

  try {
    log(`开始同步成员: ${member.name} (${member.id})`, 'info');

    // 1. 获取角色信息
    const characterInfo = await getCharacterInfo(member);
    await delay(300);
    log('✓ 角色信息获取成功', 'success');

    // 2. 获取装备列表
    const equipmentData = await getCharacterEquipment(member);
    await delay(300);
    log('✓ 装备列表获取成功', 'success');

    // 3. 获取装备详情
    const equipmentList = equipmentData?.equipment?.equipmentList || [];

    if (equipmentList.length === 0) {
      log('该角色没有装备', 'info');
      return {
        success: true,
        characterInfo,
        equipmentData,
        equipmentDetails: [],
      };
    }

    log(`步骤 3/3: 获取装备详情 (共 ${equipmentList.length} 件装备)...`, 'info');

    const equipmentDetails: EquipmentDetail[] = [];

    for (const equip of equipmentList) {
      try {
        // 计算总强化等级
        const totalEnchantLevel = (equip.enchantLevel || 0) + (equip.exceedLevel || 0);

        const detail = await getEquipmentDetail(
          equip.id,
          totalEnchantLevel,
          equip.slotPos,
          member
        );

        // 将原始装备的 slotPos 和 slotPosName 合并到详情中
        const enrichedDetail: EquipmentDetail = {
          ...detail,
          slotPos: equip.slotPos,
          slotPosName: equip.slotPosName
        };

        equipmentDetails.push(enrichedDetail);
        log(`✓ ${equip.slotPosName || equip.slotPos}: ${detail.name || equip.name}`, 'success');
        await delay(300);
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        log(`✗ ${equip.slotPosName || equip.slotPos}: ${errorMessage}`, 'error');
      }
    }

    log(`✓ 成功获取 ${equipmentDetails.length}/${equipmentList.length} 件装备详情`, 'success');

    // 4. 保存到服务器文件系统
    try {
      log('正在保存到服务器...', 'info');

      // 保存角色信息
      const characterResponse = await fetch(`/api/members/${encodeURIComponent(member.id)}/character`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(characterInfo),
      });

      if (!characterResponse.ok) {
        throw new Error(`保存角色信息失败: ${characterResponse.statusText}`);
      }

      // 保存装备数据 - 将装备详情合并到 equipmentList 中
      const enrichedEquipmentData = {
        ...equipmentData,
        equipment: {
          ...equipmentData.equipment,
          equipmentList: equipmentDetails.length > 0 ? equipmentDetails : equipmentData.equipment.equipmentList
        }
      };

      const equipmentResponse = await fetch(`/api/members/${encodeURIComponent(member.id)}/equipment`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(enrichedEquipmentData),
      });

      if (!equipmentResponse.ok) {
        throw new Error(`保存装备详情失败: ${equipmentResponse.statusText}`);
      }

      log('✓ 数据已保存到服务器文件系统', 'success');
    } catch {
      log('⚠ 保存到服务器失败,但数据已保存到本地存储', 'info');
    }

    log(`✓ 同步完成: ${member.name}`, 'success');

    return {
      success: true,
      characterInfo,
      equipmentData,
      equipmentDetails,
    };

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    log(`✗ 同步失败: ${errorMessage}`, 'error');
    return {
      success: false,
      error: errorMessage,
    };
  }
}

/**
 * 批量同步多个成员的数据
 */
export async function syncAllMembers(
  members: MemberConfig[],
  onProgress?: (message: string, type?: 'info' | 'success' | 'error') => void
): Promise<SyncAllResult> {
  const results = new Map<string, SyncMemberResult>();
  let successCount = 0;
  let failedCount = 0;

  onProgress?.(`开始批量同步 ${members.length} 名成员...`, 'info');

  for (const member of members) {
    const result = await syncMemberData(member, onProgress);
    results.set(member.id, result);

    if (result.success) {
      successCount++;

      // 保存到 localStorage
      if (result.characterInfo) {
        localStorage.setItem(
          `aion2_character_${member.id}`,
          JSON.stringify(result.characterInfo)
        );
      }

      if (result.equipmentDetails) {
        localStorage.setItem(
          `aion2_equipment_${member.id}`,
          JSON.stringify({
            memberId: member.id,
            lastUpdate: new Date().toISOString(),
            details: result.equipmentDetails,
          })
        );
      }
    } else {
      failedCount++;
    }

    // 成员之间延迟
    await delay(500);
  }

  onProgress?.(
    `同步完成: 成功 ${successCount} / 失败 ${failedCount} / 总计 ${members.length}`,
    successCount === members.length ? 'success' : 'info'
  );

  return {
    total: members.length,
    success: successCount,
    failed: failedCount,
    results,
  };
}
