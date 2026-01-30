import { useState, useEffect } from 'react';
import type { CharacterInfo, SkillItem, CharacterEquipment } from '../data/memberTypes';
import type { Rating } from '../types/admin';
import { calculateAttackPower, type AttackPowerResult } from '../utils/attackPowerCalculator';
import './CharacterCompareModal.css';

// 技能对比项
interface SkillCompareItem {
  id: number;
  name: string;
  icon: string;
  currentLevel: number;
  compareLevel: number;
}

// 对比数据类型
interface CompareCharacterData {
  characterInfo: CharacterInfo;
  equipmentData: CharacterEquipment | null;
  rating: Rating | null;
  attackPower: AttackPowerResult | null;
}

// 缓存类型
interface CachedCompareData {
  characterId: string;
  serverId: number;
  data: CompareCharacterData;
  timestamp: number;
}

interface CharacterCompareModalProps {
  visible: boolean;
  onClose: () => void;
  currentCharacter: CompareCharacterData | null;
  compareCharacter: {
    characterId: string;
    serverId: number;
    characterName: string;
  } | null;
}

// 差值显示组件
const DiffValue = ({
  current,
  compare,
  higherIsBetter = true,
  format = 'number'
}: {
  current: number | null | undefined;
  compare: number | null | undefined;
  higherIsBetter?: boolean;
  format?: 'number' | 'percent';
}) => {
  const currentVal = current ?? 0;
  const compareVal = compare ?? 0;
  const diff = currentVal - compareVal;

  if (diff === 0) {
    return <span className="compare-diff compare-diff--equal">-</span>;
  }

  const formatDiff = (val: number) => {
    if (format === 'percent') {
      return `${val > 0 ? '+' : ''}${val.toFixed(1)}%`;
    }
    return `${val > 0 ? '+' : ''}${val.toLocaleString()}`;
  };

  let diffClass = '';
  if (diff > 0) {
    diffClass = higherIsBetter ? 'compare-diff--positive' : 'compare-diff--negative';
  } else {
    diffClass = higherIsBetter ? 'compare-diff--negative' : 'compare-diff--positive';
  }

  return (
    <span className={`compare-diff ${diffClass}`}>
      {formatDiff(diff)}
    </span>
  );
};

// 缓存有效期：4小时（与角色查询缓存一致）
const CACHE_TTL = 4 * 60 * 60 * 1000;

// 模块级缓存
const compareDataCache = new Map<string, CachedCompareData>();

// 从 localStorage 获取角色缓存
const getCharacterCacheFromStorage = (characterId: string, serverId: number): CompareCharacterData | null => {
  // 尝试从角色完整数据缓存获取
  const cacheKey = `character_complete_${serverId}_${characterId}`;
  const cached = localStorage.getItem(cacheKey);

  if (cached) {
    try {
      const cacheData = JSON.parse(cached);
      const now = Date.now();

      // 检查缓存是否有效（4小时内）
      if (now - cacheData.timestamp < CACHE_TTL && cacheData.characterInfo) {
        return {
          characterInfo: cacheData.characterInfo,
          equipmentData: cacheData.equipmentData,
          rating: cacheData.rating || null,
          attackPower: null // 攻击力需要重新计算
        };
      }
    } catch (e) {
      // 缓存解析失败
    }
  }
  return null;
};

const CharacterCompareModal = ({ visible, onClose, currentCharacter, compareCharacter }: CharacterCompareModalProps) => {
  const [loading, setLoading] = useState(false);
  const [compareData, setCompareData] = useState<CompareCharacterData | null>(null);
  const [attackPowerLoading, setAttackPowerLoading] = useState(false); // 攻击力单独的加载状态
  const [error, setError] = useState('');

  // 生成缓存key
  const getCacheKey = (characterId: string, serverId: number) => `${characterId}_${serverId}`;

  // 加载对比角色数据（带缓存，渐进式加载）
  useEffect(() => {
    if (!visible || !compareCharacter) {
      setCompareData(null);
      setError('');
      setAttackPowerLoading(false);
      return;
    }

    let isMounted = true;

    const loadCompareData = async () => {
      const cacheKey = getCacheKey(compareCharacter.characterId, compareCharacter.serverId);

      // 1. 先检查模块级缓存（完整数据，包含攻击力）
      const cached = compareDataCache.get(cacheKey);
      if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
        setCompareData(cached.data);
        return;
      }

      // 2. 再检查 localStorage 缓存（角色查询页面的缓存）
      const storageCached = getCharacterCacheFromStorage(compareCharacter.characterId, compareCharacter.serverId);
      if (storageCached) {
        // 先显示基础数据（不含攻击力）
        setCompareData({
          ...storageCached,
          attackPower: null
        });
        setAttackPowerLoading(true);

        // 异步计算攻击力
        setTimeout(() => {
          if (!isMounted) return;
          const equipment = storageCached.equipmentData?.equipment?.equipmentList || [];
          const attackPower = calculateAttackPower(
            { equipment: { equipmentList: equipment } },
            storageCached.characterInfo,
            null
          );

          const data: CompareCharacterData = {
            ...storageCached,
            attackPower
          };

          // 存入模块级缓存
          compareDataCache.set(cacheKey, {
            characterId: compareCharacter.characterId,
            serverId: compareCharacter.serverId,
            data,
            timestamp: Date.now()
          });

          setCompareData(data);
          setAttackPowerLoading(false);
        }, 0);
        return;
      }

      // 3. 都没有缓存，分阶段从 API 获取
      setLoading(true);
      setError('');

      try {
        // 阶段1: 快速加载基础数据（角色信息+装备列表）
        const basicInfoUrl = `/api/character/info?characterId=${compareCharacter.characterId}&serverId=${compareCharacter.serverId}`;
        const basicEquipUrl = `/api/character/equipment?characterId=${compareCharacter.characterId}&serverId=${compareCharacter.serverId}`;

        const [infoResponse, equipResponse] = await Promise.all([
          fetch(basicInfoUrl),
          fetch(basicEquipUrl)
        ]);

        const [basicCharInfo, basicEquipData] = await Promise.all([
          infoResponse.json(),
          equipResponse.json()
        ]);

        if (!isMounted) return;

        // 立即显示基础数据
        setCompareData({
          characterInfo: basicCharInfo,
          equipmentData: basicEquipData,
          rating: null,
          attackPower: null
        });
        setLoading(false);
        setAttackPowerLoading(true);

        // 阶段2: 后台加载完整数据（评分+守护力）
        const completeUrl = `/api/character/complete?characterId=${compareCharacter.characterId}&serverId=${compareCharacter.serverId}`;
        const response = await fetch(completeUrl);
        const result = await response.json();

        if (!result.success) {
          throw new Error(result.error || '获取角色数据失败');
        }

        if (!isMounted) return;

        const { characterInfo, equipmentData, rating, daevanionBoards } = result.data;

        // 计算攻击力
        const equipment = equipmentData?.equipment?.equipmentList || [];
        const attackPower = calculateAttackPower(
          { equipment: { equipmentList: equipment } },
          characterInfo,
          daevanionBoards
        );

        const data: CompareCharacterData = {
          characterInfo,
          equipmentData,
          rating,
          attackPower
        };

        const now = Date.now();

        // 存入模块级缓存
        compareDataCache.set(cacheKey, {
          characterId: compareCharacter.characterId,
          serverId: compareCharacter.serverId,
          data,
          timestamp: now
        });

        // 存入 localStorage
        const storageCacheKey = `character_complete_${compareCharacter.serverId}_${compareCharacter.characterId}`;
        try {
          localStorage.setItem(storageCacheKey, JSON.stringify({
            characterInfo,
            equipmentData,
            rating,
            daevanionBoards,
            timestamp: now
          }));
        } catch {
          // 缓存存储失败
        }

        setCompareData(data);
        setAttackPowerLoading(false);
      } catch (err) {
        if (isMounted) {
          setError(err instanceof Error ? err.message : '加载失败');
          setLoading(false);
          setAttackPowerLoading(false);
        }
      }
    };

    loadCompareData();

    return () => {
      isMounted = false;
    };
  }, [visible, compareCharacter]);

  if (!visible) return null;

  const current = currentCharacter;
  const compare = compareData;

  return (
    <div className="character-compare-modal__overlay" onClick={onClose}>
      <div className="character-compare-modal" onClick={e => e.stopPropagation()}>
        <div className="character-compare-modal__header">
          <h2 className="character-compare-modal__title">角色对比</h2>
          <button className="character-compare-modal__close" onClick={onClose}>✕</button>
        </div>

        {/* 角色头部信息 */}
        <div className="character-compare-modal__characters">
          {/* 当前角色 */}
          <div className="compare-character compare-character--current">
            <img
              src={current?.characterInfo?.profile?.profileImage || '/default-avatar.png'}
              alt=""
              className="compare-character__avatar"
            />
            <div className="compare-character__info">
              <span className="compare-character__name">
                {current?.characterInfo?.profile?.characterName || '当前角色'}
              </span>
              <span className="compare-character__meta">
                Lv.{current?.characterInfo?.profile?.characterLevel || 0}
                {' · '}
                {current?.characterInfo?.profile?.serverName || ''}
              </span>
            </div>
            <span className="compare-character__label">当前</span>
          </div>

          <div className="compare-vs">VS</div>

          {/* 对比角色 */}
          <div className="compare-character compare-character--compare">
            {loading ? (
              <div className="compare-character__loading">
                <div className="compare-character__spinner"></div>
                <span>加载中...</span>
              </div>
            ) : error ? (
              <div className="compare-character__error">{error}</div>
            ) : compare ? (
              <>
                <img
                  src={compare.characterInfo?.profile?.profileImage || '/default-avatar.png'}
                  alt=""
                  className="compare-character__avatar"
                />
                <div className="compare-character__info">
                  <span className="compare-character__name">
                    {compare.characterInfo?.profile?.characterName || '对比角色'}
                  </span>
                  <span className="compare-character__meta">
                    Lv.{compare.characterInfo?.profile?.characterLevel || 0}
                    {' · '}
                    {compare.characterInfo?.profile?.serverName || ''}
                  </span>
                </div>
                <span className="compare-character__label">对比</span>
              </>
            ) : (
              <div className="compare-character__empty">选择对比角色</div>
            )}
          </div>
        </div>

        {/* 内容区 */}
        <div className="character-compare-modal__content">
          {loading ? (
            <div className="compare-loading">
              <div className="compare-loading__spinner"></div>
              <p>正在加载对比数据...</p>
            </div>
          ) : !compare ? (
            <div className="compare-empty">
              <p>请先选择要对比的角色</p>
            </div>
          ) : (
            <div className="compare-stats">
              {/* 核心数值 */}
              <div className="compare-section">
                <h3 className="compare-section__title">核心数值</h3>
                <div className="compare-table compare-table--4col">
                  <div className="compare-row compare-row--header">
                    <span className="compare-cell compare-cell--label">属性</span>
                    <span className="compare-cell compare-cell--value">当前</span>
                    <span className="compare-cell compare-cell--value">对方</span>
                    <span className="compare-cell compare-cell--diff">差值</span>
                  </div>

                  {/* PVE评分 */}
                  <div className="compare-row">
                    <span className="compare-cell compare-cell--label">PVE评分</span>
                    <span className="compare-cell compare-cell--value">
                      {Math.floor(current?.rating?.scores?.score || 0).toLocaleString()}
                    </span>
                    <span className="compare-cell compare-cell--value">
                      {attackPowerLoading || compare?.rating == null
                        ? <span className="compare-cell--loading">计算中...</span>
                        : Math.floor(compare?.rating?.scores?.score || 0).toLocaleString()
                      }
                    </span>
                    <span className="compare-cell compare-cell--diff">
                      {attackPowerLoading || compare?.rating == null
                        ? <span className="compare-cell--loading">-</span>
                        : <DiffValue
                            current={current?.rating?.scores?.score}
                            compare={compare?.rating?.scores?.score}
                          />
                      }
                    </span>
                  </div>

                  {/* 攻击力 */}
                  <div className="compare-row">
                    <span className="compare-cell compare-cell--label">攻击力</span>
                    <span className="compare-cell compare-cell--value">
                      {current?.attackPower?.finalPower != null
                        ? current.attackPower.finalPower.toLocaleString()
                        : <span className="compare-cell--loading">计算中...</span>
                      }
                    </span>
                    <span className="compare-cell compare-cell--value">
                      {attackPowerLoading || compare?.attackPower?.finalPower == null
                        ? <span className="compare-cell--loading">计算中...</span>
                        : compare.attackPower.finalPower.toLocaleString()
                      }
                    </span>
                    <span className="compare-cell compare-cell--diff">
                      {attackPowerLoading || compare?.attackPower?.finalPower == null
                        ? <span className="compare-cell--loading">-</span>
                        : <DiffValue
                            current={current?.attackPower?.finalPower}
                            compare={compare?.attackPower?.finalPower}
                          />
                      }
                    </span>
                  </div>

                  {/* 装备等级 */}
                  <div className="compare-row">
                    <span className="compare-cell compare-cell--label">装备等级</span>
                    <span className="compare-cell compare-cell--value">
                      {current?.characterInfo?.stat?.statList?.find(s => s.type === 'ItemLevel')?.value || 0}
                    </span>
                    <span className="compare-cell compare-cell--value">
                      {compare?.characterInfo?.stat?.statList?.find(s => s.type === 'ItemLevel')?.value || 0}
                    </span>
                    <span className="compare-cell compare-cell--diff">
                      <DiffValue
                        current={current?.characterInfo?.stat?.statList?.find(s => s.type === 'ItemLevel')?.value}
                        compare={compare?.characterInfo?.stat?.statList?.find(s => s.type === 'ItemLevel')?.value}
                      />
                    </span>
                  </div>
                </div>
              </div>

              {/* 基础属性 */}
              <div className="compare-section">
                <h3 className="compare-section__title">基础属性</h3>
                <div className="compare-table compare-table--4col">
                  <div className="compare-row compare-row--header">
                    <span className="compare-cell compare-cell--label">属性</span>
                    <span className="compare-cell compare-cell--value">当前</span>
                    <span className="compare-cell compare-cell--value">对方</span>
                    <span className="compare-cell compare-cell--diff">差值</span>
                  </div>
                  {(current?.characterInfo?.stat?.statList || []).slice(0, 6).map((stat, idx) => {
                    const compareStat = compare?.characterInfo?.stat?.statList?.[idx];
                    return (
                      <div key={idx} className="compare-row">
                        <span className="compare-cell compare-cell--label">{stat.name}</span>
                        <span className="compare-cell compare-cell--value">
                          {stat.value?.toLocaleString() || 0}
                        </span>
                        <span className="compare-cell compare-cell--value">
                          {compareStat?.value?.toLocaleString() || 0}
                        </span>
                        <span className="compare-cell compare-cell--diff">
                          <DiffValue current={stat.value} compare={compareStat?.value} />
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* 主要能力值 */}
              <div className="compare-section">
                <h3 className="compare-section__title">主要能力值</h3>
                <div className="compare-table compare-table--4col">
                  <div className="compare-row compare-row--header">
                    <span className="compare-cell compare-cell--label">属性</span>
                    <span className="compare-cell compare-cell--value">当前</span>
                    <span className="compare-cell compare-cell--value">对方</span>
                    <span className="compare-cell compare-cell--diff">差值</span>
                  </div>
                  {(current?.characterInfo?.stat?.statList || []).slice(6, -1).map((stat, idx) => {
                    const compareStat = compare?.characterInfo?.stat?.statList?.slice(6, -1)?.[idx];
                    return (
                      <div key={idx} className="compare-row">
                        <span className="compare-cell compare-cell--label">{stat.name}</span>
                        <span className="compare-cell compare-cell--value">
                          {stat.value?.toLocaleString() || 0}
                        </span>
                        <span className="compare-cell compare-cell--value">
                          {compareStat?.value?.toLocaleString() || 0}
                        </span>
                        <span className="compare-cell compare-cell--diff">
                          <DiffValue current={stat.value} compare={compareStat?.value} />
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* 技能对比 - 仅同职业显示 */}
              {(() => {
                const currentClassName = current?.characterInfo?.profile?.className;
                const compareClassName = compare?.characterInfo?.profile?.className;
                // 使用 className 判断是否同职业（更可靠）
                const isSameClass = currentClassName && compareClassName && currentClassName === compareClassName;

                // 获取所有已习得的技能（包括被动技能）
                const currentSkills: SkillItem[] = current?.equipmentData?.skill?.skillList?.filter((s: SkillItem) => s.acquired === 1) || [];
                const compareSkills: SkillItem[] = compare?.equipmentData?.skill?.skillList?.filter((s: SkillItem) => s.acquired === 1) || [];

                if (!isSameClass) {
                  // 不同职业，显示提示
                  if (currentSkills.length > 0 || compareSkills.length > 0) {
                    return (
                      <div className="compare-section">
                        <h3 className="compare-section__title">技能对比</h3>
                        <div className="compare-skills__notice">
                          职业不同，无法对比技能
                          （{current?.characterInfo?.profile?.className || '未知'} vs {compare?.characterInfo?.profile?.className || '未知'}）
                        </div>
                      </div>
                    );
                  }
                  return null;
                }

                // 同职业，构建技能对比数据
                const skillMap = new Map<number, SkillCompareItem>();

                // 添加当前角色技能
                currentSkills.forEach((skill: SkillItem) => {
                  skillMap.set(skill.id, {
                    id: skill.id,
                    name: skill.name,
                    icon: skill.icon,
                    currentLevel: skill.skillLevel,
                    compareLevel: 0
                  });
                });

                // 添加/更新对比角色技能
                compareSkills.forEach((skill: SkillItem) => {
                  const existing = skillMap.get(skill.id);
                  if (existing) {
                    existing.compareLevel = skill.skillLevel;
                  } else {
                    skillMap.set(skill.id, {
                      id: skill.id,
                      name: skill.name,
                      icon: skill.icon,
                      currentLevel: 0,
                      compareLevel: skill.skillLevel
                    });
                  }
                });

                const skillCompareList = Array.from(skillMap.values());

                if (skillCompareList.length === 0) {
                  return null;
                }

                return (
                  <div className="compare-section">
                    <h3 className="compare-section__title">技能对比</h3>
                    <div className="compare-table compare-table--4col">
                      <div className="compare-row compare-row--header">
                        <span className="compare-cell compare-cell--label">技能</span>
                        <span className="compare-cell compare-cell--value">当前</span>
                        <span className="compare-cell compare-cell--value">对方</span>
                        <span className="compare-cell compare-cell--diff">差值</span>
                      </div>
                      {skillCompareList.map((skill) => (
                        <div key={skill.id} className="compare-row">
                          <span className="compare-cell compare-cell--label compare-cell--skill">
                            <img src={skill.icon} alt="" className="compare-skill-icon" />
                            <span className="compare-skill-name">{skill.name}</span>
                          </span>
                          <span className="compare-cell compare-cell--value">
                            {skill.currentLevel > 0 ? `Lv.${skill.currentLevel}` : '-'}
                          </span>
                          <span className="compare-cell compare-cell--value">
                            {skill.compareLevel > 0 ? `Lv.${skill.compareLevel}` : '-'}
                          </span>
                          <span className="compare-cell compare-cell--diff">
                            {skill.currentLevel > 0 && skill.compareLevel > 0 ? (
                              <DiffValue current={skill.currentLevel} compare={skill.compareLevel} />
                            ) : (
                              <span className="compare-diff compare-diff--equal">-</span>
                            )}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })()}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CharacterCompareModal;
