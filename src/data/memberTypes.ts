// 成员角色类型定义
export type MemberRole = 'leader' | 'elite' | 'member';

// 成员基础信息
export interface MemberInfo {
  id: string;
  name: string;
  role: MemberRole;
  dataFolder: string;
  joinDate?: string;
}

// 角色 Profile 数据
export interface CharacterProfile {
  characterId: string;
  characterName: string;
  serverId: number;
  serverName: string;
  regionName: string;
  pcId: number;
  className: string;
  raceId: number;
  raceName: string;
  gender: number;
  genderName: string;
  characterLevel: number;
  titleId: number;
  titleName: string;
  titleGrade: string;
  profileImage: string;
}

// 属性数据
export interface StatItem {
  type: string;
  name: string;
  value: number;
  statSecondList: string[] | null;
}

// 排名数据
export interface RankingItem {
  rankingContentsType: number;
  rankingContentsName: string;
  rankingType: number | null;
  rank: number | null;
  characterName: string | null;
  classId: number | null;
  className: string | null;
  guildName: string | null;
  point: number | null;
  gradeId: number | null;
  gradeName: string | null;
  gradeIcon: string | null;
}

// 装备数据
export interface EquipmentItem {
  id: number;
  name: string;
  enchantLevel: number;
  exceedLevel: number;
  grade: string;
  slotPos: number;
  slotPosName: string;
  icon: string;
}

// 技能数据
export interface SkillItem {
  id: number;
  name: string;
  needLevel: number;
  skillLevel: number;
  icon: string;
  category: string;
  acquired: number;
  equip: number;
}

// 天族纹章数据
export interface DaevanionBoard {
  id: number;
  name: string;
  totalNodeCount: number;
  openNodeCount: number;
  icon: string;
  open: number;
}

// 称号数据
export interface TitleItem {
  id: number;
  equipCategory: string;
  name: string;
  grade: string;
  totalCount: number;
  ownedCount: number;
  statList: { desc: string }[];
  equipStatList: { desc: string }[];
}

// 角色完整信息数据
export interface CharacterInfo {
  stat: { statList: StatItem[] };
  title: { totalCount: number; ownedCount: number; titleList: TitleItem[] };
  profile: CharacterProfile;
  ranking: { rankingList: RankingItem[] };
  daevanion: { boardList: DaevanionBoard[] };
}

// 装备数据
export interface CharacterEquipment {
  petwing: {
    pet: { id: number; name: string; level: number; icon: string } | null;
    wing: { id: number; name: string; enchantLevel: number; grade: string; icon: string } | null;
  };
  skill: { skillList: SkillItem[] };
  equipment: { equipmentList: EquipmentItem[]; skinList: EquipmentItem[] };
}

// 成员列表数据
export const members: MemberInfo[] = [
  {
    id: 'wenhe',
    name: '温禾',
    role: 'leader',
    dataFolder: 'wenhe',
    joinDate: '创团成员'
  },
];

// 获取角色等级名称
export const getRoleName = (role: MemberRole): string => {
  switch (role) {
    case 'leader': return '军团长';
    case 'elite': return '军团精英';
    case 'member': return '军团成员';
  }
};

// 装备品质颜色 - 从低到高: 白 → 绿 → 蓝 → 金 → 青绿 → 红
export const gradeColors: Record<string, string> = {
  'Common': '#9d9d9d',    // 灰白色
  'Rare': '#4caf50',      // 绿色
  'Legend': '#2196f3',    // 蓝色
  'Unique': '#ff9800',    // 金色
  'Special': '#26a69a',   // 青绿色
  'Epic': '#f44336',      // 红色
};

// 职业图标 - 带职业名字（用于成员详情页面右上角大图标）
export const classIcons: Record<string, string> = {
  '劍星': 'https://download.plaync.com.tw/AION2/teaser/4th/class-icon-1-hover.webp',
  '守護星': 'https://download.plaync.com.tw/AION2/teaser/4th/class-icon-2-hover.webp',
  '殺星': 'https://download.plaync.com.tw/AION2/teaser/4th/class-icon-3-hover.webp',
  '弓星': 'https://download.plaync.com.tw/AION2/teaser/4th/class-icon-4-hover.webp',
  '護法星': 'https://download.plaync.com.tw/AION2/teaser/4th/class-icon-5-hover.webp',
  '治癒星': 'https://download.plaync.com.tw/AION2/teaser/4th/class-icon-6-hover.webp',
  '魔道星': 'https://download.plaync.com.tw/AION2/teaser/4th/class-icon-7-hover.webp',
  '精靈星': 'https://download.plaync.com.tw/AION2/teaser/4th/class-icon-8-hover.webp',
  // 其他职业使用默认图标
  '吟遊星': 'https://download.plaync.com.tw/AION2/teaser/4th/class-icon-1-hover.webp',
  '槍星': 'https://download.plaync.com.tw/AION2/teaser/4th/class-icon-1-hover.webp',
  '機甲星': 'https://download.plaync.com.tw/AION2/teaser/4th/class-icon-1-hover.webp',
  '畫師': 'https://download.plaync.com.tw/AION2/teaser/4th/class-icon-1-hover.webp'
};

// 职业小图标 - 不带职业名字（用于管理页面成员卡片）
export const classIconsSmall: Record<string, string> = {
  '劍星': 'https://assets.playnccdn.com/static-aion2/characters/img/class/class_icon_gladiator.png',
  '守護星': 'https://assets.playnccdn.com/static-aion2/characters/img/class/class_icon_templar.png',
  '殺星': 'https://assets.playnccdn.com/static-aion2/characters/img/class/class_icon_assassin.png',
  '弓星': 'https://assets.playnccdn.com/static-aion2/characters/img/class/class_icon_ranger.png',
  '護法星': 'https://assets.playnccdn.com/static-aion2/characters/img/class/class_icon_chanter.png',
  '治癒星': 'https://assets.playnccdn.com/static-aion2/characters/img/class/class_icon_cleric.png',
  '魔道星': 'https://assets.playnccdn.com/static-aion2/characters/img/class/class_icon_sorcerer.png',
  '精靈星': 'https://assets.playnccdn.com/static-aion2/characters/img/class/class_icon_elementalist.png',
  // 其他职业使用默认图标
  '吟遊星': 'https://assets.playnccdn.com/static-aion2/characters/img/class/class_icon_gladiator.png',
  '槍星': 'https://assets.playnccdn.com/static-aion2/characters/img/class/class_icon_gladiator.png',
  '機甲星': 'https://assets.playnccdn.com/static-aion2/characters/img/class/class_icon_gladiator.png',
  '畫師': 'https://assets.playnccdn.com/static-aion2/characters/img/class/class_icon_gladiator.png'
};

