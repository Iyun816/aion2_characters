// 角色相关共享类型定义

/**
 * 服务器选项 - 用于 UI 组件显示
 * 注意: 原始服务器数据使用 src/data/serverList.ts 中的 Server 接口
 */
export interface ServerOption {
  id: number;
  name: string;
  label: string;
  raceId?: number; // 1=天族, 2=魔族
}

/**
 * 角色搜索历史记录
 */
export interface SearchHistory {
  characterId: string;
  characterName: string;
  serverId: number;
  serverLabel: string;
  level?: number;
  race?: number;
  profileImage?: string;
  timestamp: number;
}

/**
 * 角色对比历史记录
 */
export interface CompareHistory {
  mainCharacter: {
    characterId: string;
    characterName: string;
    serverId: number;
    serverLabel: string;
  };
  compareCharacter: {
    characterId: string;
    characterName: string;
    serverId: number;
    serverLabel: string;
  };
  timestamp: number;
}
