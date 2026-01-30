// 守护力数据类型定义

/**
 * 职业板板映射配置类型
 */
export interface ClassBoardMapping {
  classId: number;
  className: string;
  classNameSimplified: string;
  classNameEn: string;
  boardIds: number[];
}

export interface ClassBoardConfig {
  version: string;
  lastUpdated: string;
  classes: ClassBoardMapping[];
}

// 缓存配置数据
let cachedConfig: ClassBoardConfig | null = null;

/**
 * 加载职业面板映射配置
 */
async function loadClassBoardConfig(): Promise<ClassBoardConfig> {
  if (cachedConfig) {
    return cachedConfig;
  }

  try {
    // 添加时间戳参数避免浏览器缓存
    const timestamp = new Date().getTime();
    const response = await fetch(`/data/class_board_mapping.json?v=${timestamp}`);
    if (response.ok) {
      const config: ClassBoardConfig = await response.json();
      cachedConfig = config;
      return cachedConfig;
    }
  } catch {
    // 加载配置失败，使用默认配置
  }

  // 返回默认配置(空类列表)
  return {
    version: '1.0.0',
    lastUpdated: new Date().toISOString(),
    classes: []
  };
}

/**
 * 根据职业英文名获取守护力面板ID列表
 * @param classNameEn 职业英文名 (从角色信息的 ranking.className 获取，如 "Gladiator")
 * @returns 守护力面板ID数组,如果未找到则返回空数组
 */
export async function getBoardIdsByClassName(classNameEn: string): Promise<number[]> {
  const config = await loadClassBoardConfig();
  const classMapping = config.classes.find(c => c.classNameEn === classNameEn);
  return classMapping ? classMapping.boardIds : [];
}

/**
 * 根据职业中文名获取 classId（支持简繁体）
 * @param className 职业中文名 (如 "劍星", "剑星", "弓星")
 * @returns classId 或 undefined
 */
export async function getClassIdByChineseName(className: string): Promise<number | undefined> {
  const config = await loadClassBoardConfig();
  // 在配置中查找，支持繁体和简体匹配
  const classMapping = config.classes.find(c => {
    return c.className === className || c.classNameSimplified === className;
  });
  return classMapping?.classId;
}

/**
 * 根据职业ID获取守护力面板ID列表
 * @param classId 职业ID
 * @returns 守护力面板ID数组,如果未找到则返回空数组
 */
export async function getBoardIdsByClassId(classId: number): Promise<number[]> {
  const config = await loadClassBoardConfig();
  const classMapping = config.classes.find(c => c.classId === classId);
  return classMapping ? classMapping.boardIds : [];
}

export interface DaevanionEffect {
  desc: string;
}

export interface DaevanionBoard {
  nodeList: Array<{
    boardId: number;
    nodeId: number;
    name: string;
    row: number;
    col: number;
    grade: string;
    type: string;
    icon: string;
    effectList: DaevanionEffect[];
    open: number;
  }>;
  openStatEffectList: DaevanionEffect[];
  openSkillEffectList: DaevanionEffect[];
}

export type DaevanionBoards = (DaevanionBoard | null)[];

/**
 * 聚合后的守护力效果数据
 */
export interface AggregatedDaevanionEffects {
  statEffects: string[];      // 聚合后的属性效果
  skillEffects: string[];      // 聚合后的技能效果
  totalStats: number;          // 属性效果总数
  totalSkills: number;         // 技能效果总数
}

/**
 * 合并所有守护力面板的效果（聚合相同词条）
 * @param boards 6个守护力面板数据
 * @returns 聚合后的属性效果和技能效果
 */
export function mergeDaevanionEffects(boards: DaevanionBoards): AggregatedDaevanionEffects {
  const statMap = new Map<string, { value: number; isPercentage: boolean }>();  // 属性名 -> {累加值, 是否百分比}
  const skillMap = new Map<string, { value: number; isPercentage: boolean }>(); // 技能名 -> {累加等级, 是否百分比}

  // 遍历所有面板
  for (const board of boards) {
    if (!board) continue;

    // 聚合属性效果
    if (board.openStatEffectList) {
      for (const effect of board.openStatEffectList) {
        aggregateEffect(effect.desc, statMap);
      }
    }

    // 聚合技能效果
    if (board.openSkillEffectList) {
      for (const effect of board.openSkillEffectList) {
        aggregateEffect(effect.desc, skillMap);
      }
    }
  }

  // 转换为数组，根据是否百分比添加正确的符号
  const statEffects = Array.from(statMap.entries()).map(([name, data]) => {
    const valueStr = data.value > 0 ? `+${data.value}` : `${data.value}`;
    return data.isPercentage ? `${name} ${valueStr}%` : `${name} ${valueStr}`;
  });

  const skillEffects = Array.from(skillMap.entries()).map(([name, data]) => {
    const valueStr = data.value > 0 ? `+${data.value}` : `${data.value}`;
    return data.isPercentage ? `${name} ${valueStr}%` : `${name} ${valueStr}`;
  });

  return {
    statEffects,
    skillEffects,
    totalStats: statEffects.length,
    totalSkills: skillEffects.length
  };
}

/**
 * 聚合单个效果描述
 * 支持格式:
 * - "攻击力 +100"
 * - "冷却时间减少 +5%"
 * - "技能名称 +1"
 * - "属性名 100"
 */
function aggregateEffect(desc: string, map: Map<string, { value: number; isPercentage: boolean }>) {
  // 匹配格式: "名称 +数值%" 或 "名称 +数值" 或 "名称 数值"
  const match = desc.match(/^(.+?)\s+\+?(-?\d+(?:\.\d+)?)%?$/);

  if (match) {
    const name = match[1].trim();
    const valueStr = match[2];
    const value = parseFloat(valueStr);

    // 检查是否是百分比格式
    const isPercentage = desc.includes('%');

    if (map.has(name)) {
      const existing = map.get(name)!;
      map.set(name, { value: existing.value + value, isPercentage });
    } else {
      map.set(name, { value, isPercentage });
    }
  } else {
    // 无法解析的格式，直接使用描述作为key，计数+1
    if (map.has(desc)) {
      const existing = map.get(desc)!;
      map.set(desc, { value: existing.value + 1, isPercentage: false });
    } else {
      map.set(desc, { value: 1, isPercentage: false });
    }
  }
}

/**
 * 从成员文件夹加载守护力数据
 * @param memberId 成员ID
 * @returns 守护力面板数据
 */
export async function loadMemberDaevanion(memberId: string): Promise<DaevanionBoards | null> {
  try {
    const response = await fetch(`/data/${memberId}/daevanion_boards.json`);
    if (!response.ok) {
      return null;
    }
    return await response.json();
  } catch {
    return null;
  }
}

/**
 * 通过API获取角色守护力数据（6个面板）- 并发请求
 * @param characterId 角色ID
 * @param serverId 服务器ID
 * @param classId 职业ID
 * @returns 守护力面板数据
 */
export async function fetchDaevanionBoards(
  characterId: string,
  serverId: number,
  classId?: number
): Promise<DaevanionBoards | null> {
  try {
    if (!classId) {
      return null;
    }

    // 根据职业ID获取对应的面板ID列表
    const boardIds = await getBoardIdsByClassId(classId);

    if (boardIds.length === 0) {
      return null;
    }

    // 并发请求所有面板
    const promises = boardIds.map(async (boardId) => {
      try {
        const response = await fetch(
          `/api/character/daevanion?characterId=${encodeURIComponent(characterId)}&serverId=${serverId}&boardId=${boardId}`
        );

        if (response.ok) {
          const result = await response.json();
          // 检查数据结构
          if (result.success && result.data) {
            return result.data;
          }
          return null;
        }
        return null;
      } catch {
        return null;
      }
    });

    // 等待所有请求完成
    return await Promise.all(promises);
  } catch {
    return null;
  }
}
