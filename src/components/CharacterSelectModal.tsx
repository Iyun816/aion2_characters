import { useState, useEffect } from 'react';
import ServerSelector from './ServerSelector';
import type { SearchHistory } from '../types/character';
import './CharacterSelectModal.css';

// 角色基础信息类型
export interface CharacterBasicInfo {
  characterId: string;
  characterName: string;
  serverId: number;
  serverName: string;
  serverLabel: string;
  level: number;
  race: number;
  pcId?: number;
  profileImage?: string;
}

// 对比历史记录类型（与搜索历史结构相同）
type CompareHistory = SearchHistory;

const HISTORY_STORAGE_KEY = 'character_search_history';
const COMPARE_HISTORY_KEY = 'character_compare_history';

interface CharacterSelectModalProps {
  visible: boolean;
  onClose: () => void;
  onSelect: (character: CharacterBasicInfo) => void;
  currentCharacterId?: string; // 当前角色ID，用于排除
}

interface Server {
  id: number;
  name: string;
  label: string;
  raceId?: number;
}

const CharacterSelectModal = ({ visible, onClose, onSelect, currentCharacterId }: CharacterSelectModalProps) => {
  const [characterName, setCharacterName] = useState('');
  const [servers, setServers] = useState<Server[]>([]);
  const [searching, setSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<CharacterBasicInfo[]>([]);
  const [error, setError] = useState('');
  const [searchHistory, setSearchHistory] = useState<SearchHistory[]>([]);
  const [compareHistory, setCompareHistory] = useState<CompareHistory[]>([]);
  const [selectedServer, setSelectedServer] = useState<number | null>(null);

  // 加载服务器列表和搜索历史
  useEffect(() => {
    if (!visible) return;

    const loadServers = async () => {
      try {
        const localResponse = await fetch(`/data/serverId.json?t=${Date.now()}`);
        if (!localResponse.ok) {
          throw new Error(`HTTP错误: ${localResponse.status}`);
        }
        const localData = await localResponse.json();
        if (!localData.serverList || !Array.isArray(localData.serverList)) {
          throw new Error('服务器数据格式错误');
        }
        const localServers = localData.serverList.map((server: any) => ({
          id: server.serverId,
          name: server.serverName,
          label: server.serverName,
          raceId: server.raceId
        }));
        setServers(localServers);
      } catch {
        setServers([
          { id: 1001, name: '希埃尔', label: '希埃尔', raceId: 1 },
          { id: 2001, name: '伊斯拉佩尔', label: '伊斯拉佩尔', raceId: 2 }
        ]);
      }
    };

    const loadHistory = () => {
      try {
        const stored = localStorage.getItem(HISTORY_STORAGE_KEY);
        if (stored) {
          const history = JSON.parse(stored);
          // 排除当前角色
          const filtered = currentCharacterId
            ? history.filter((h: SearchHistory) => h.characterId !== currentCharacterId)
            : history;
          setSearchHistory(filtered);
        }
      } catch {
        // 加载搜索历史失败
      }
    };

    const loadCompareHistory = () => {
      try {
        const stored = localStorage.getItem(COMPARE_HISTORY_KEY);
        if (stored) {
          const history = JSON.parse(stored);
          // 排除当前角色
          const filtered = currentCharacterId
            ? history.filter((h: CompareHistory) => h.characterId !== currentCharacterId)
            : history;
          setCompareHistory(filtered);
        }
      } catch {
        // 加载对比历史失败
      }
    };

    loadServers();
    loadHistory();
    loadCompareHistory();
  }, [visible, currentCharacterId]);

  // 重置状态
  useEffect(() => {
    if (!visible) {
      setCharacterName('');
      setSearchResults([]);
      setError('');
    }
  }, [visible]);

  // 搜索单个服务器
  const performSearchForServer = async (name: string, serverId: number, serverLabel: string): Promise<CharacterBasicInfo | null> => {
    try {
      const searchResponse = await fetch(
        `/api/character/search?name=${encodeURIComponent(name)}&serverId=${serverId}`
      );
      const searchData = await searchResponse.json();

      if (!searchData.success) {
        return null;
      }

      const character = searchData.character;
      const infoUrl = `/api/character/info?characterId=${character.characterId}&serverId=${character.serverId}`;
      const infoResponse = await fetch(infoUrl);
      const infoData = await infoResponse.json();

      return {
        characterId: character.characterId,
        serverId: character.serverId,
        characterName: infoData.profile?.characterName || character.characterName || character.name,
        serverName: serverLabel,
        serverLabel: serverLabel,
        level: infoData.profile?.characterLevel || character.level,
        race: infoData.profile?.raceId || character.race,
        profileImage: infoData.profile?.profileImage
      };
    } catch {
      return null;
    }
  };

  // 搜索所有服务器或指定服务器
  const performSearch = async (name: string) => {
    setSearching(true);
    setError('');
    setSearchResults([]);

    try {
      const serversToSearch = selectedServer
        ? servers.filter(s => s.id === selectedServer)
        : servers;

      const searchPromises = serversToSearch.map(server =>
        performSearchForServer(name, server.id, server.label)
      );

      const results = await Promise.all(searchPromises);
      let validResults = results.filter((r): r is CharacterBasicInfo => r !== null);

      // 排除当前角色
      if (currentCharacterId) {
        validResults = validResults.filter(r => r.characterId !== currentCharacterId);
      }

      if (validResults.length === 0) {
        setError('未找到该角色，请检查角色名称是否正确');
        setSearching(false);
        return;
      }

      setSearchResults(validResults);
      setSearching(false);
    } catch {
      setError('搜索失败，请稍后重试');
      setSearching(false);
    }
  };

  // 处理搜索表单提交
  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!characterName.trim()) {
      setError('请输入角色名称');
      return;
    }

    if (servers.length === 0) {
      setError('服务器列表加载中，请稍候...');
      return;
    }

    performSearch(characterName.trim());
  };

  // 选择角色
  const handleSelectCharacter = (character: CharacterBasicInfo) => {
    // 保存到对比历史
    saveToCompareHistory(character);
    onSelect(character);
  };

  // 保存到对比历史
  const saveToCompareHistory = (character: CharacterBasicInfo) => {
    try {
      const stored = localStorage.getItem(COMPARE_HISTORY_KEY);
      let history: CompareHistory[] = stored ? JSON.parse(stored) : [];

      // 移除已存在的相同角色
      history = history.filter(h => h.characterId !== character.characterId);

      // 添加到开头
      history.unshift({
        characterId: character.characterId,
        characterName: character.characterName,
        serverId: character.serverId,
        serverLabel: character.serverLabel,
        level: character.level,
        race: character.race,
        profileImage: character.profileImage,
        timestamp: Date.now()
      });

      // 最多保留20条
      history = history.slice(0, 20);

      localStorage.setItem(COMPARE_HISTORY_KEY, JSON.stringify(history));
    } catch {
      // 保存对比历史失败
    }
  };

  // 删除对比历史
  const handleDeleteCompareHistory = (e: React.MouseEvent, characterId: string) => {
    e.stopPropagation();
    try {
      const stored = localStorage.getItem(COMPARE_HISTORY_KEY);
      if (stored) {
        let history: CompareHistory[] = JSON.parse(stored);
        history = history.filter(h => h.characterId !== characterId);
        localStorage.setItem(COMPARE_HISTORY_KEY, JSON.stringify(history));
        // 更新状态，排除当前角色
        const filtered = currentCharacterId
          ? history.filter(h => h.characterId !== currentCharacterId)
          : history;
        setCompareHistory(filtered);
      }
    } catch {
      // 删除对比历史失败
    }
  };

  // 从历史记录选择
  const handleSelectFromHistory = (history: SearchHistory) => {
    const character: CharacterBasicInfo = {
      characterId: history.characterId,
      characterName: history.characterName,
      serverId: history.serverId,
      serverName: history.serverLabel,
      serverLabel: history.serverLabel,
      level: history.level || 0,
      race: history.race || 0,
      profileImage: history.profileImage
    };
    // 保存到对比历史
    saveToCompareHistory(character);
    onSelect(character);
  };

  // 从对比历史选择
  const handleSelectFromCompareHistory = (history: CompareHistory) => {
    const character: CharacterBasicInfo = {
      characterId: history.characterId,
      characterName: history.characterName,
      serverId: history.serverId,
      serverName: history.serverLabel,
      serverLabel: history.serverLabel,
      level: history.level || 0,
      race: history.race || 0,
      profileImage: history.profileImage
    };
    // 保存到对比历史（更新时间戳）
    saveToCompareHistory(character);
    onSelect(character);
  };

  if (!visible) return null;

  return (
    <div className="character-select-modal__overlay" onClick={onClose}>
      <div className="character-select-modal" onClick={e => e.stopPropagation()}>
        <div className="character-select-modal__header">
          <h2 className="character-select-modal__title">选择对比角色</h2>
          <button className="character-select-modal__close" onClick={onClose}>✕</button>
        </div>

        <div className="character-select-modal__content">
          {/* 搜索框 */}
          <form className="character-select-modal__search" onSubmit={handleSearch}>
            <div className="character-select-modal__search-row">
              <ServerSelector
                servers={servers}
                selectedServer={selectedServer}
                onSelectServer={setSelectedServer}
              />
              <input
                type="text"
                className="character-select-modal__input"
                placeholder="请输入角色名称..."
                value={characterName}
                onChange={e => setCharacterName(e.target.value)}
                disabled={searching}
              />
              <button
                type="submit"
                className="character-select-modal__submit"
                disabled={searching}
              >
                {searching ? '搜索中...' : '搜索'}
              </button>
            </div>
          </form>

          {/* 错误提示 */}
          {error && (
            <div className="character-select-modal__error">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="8" x2="12" y2="12" />
                <line x1="12" y1="16" x2="12.01" y2="16" />
              </svg>
              <span>{error}</span>
            </div>
          )}

          {/* 搜索结果 */}
          {searchResults.length > 0 && (
            <div className="character-select-modal__results">
              <h3 className="character-select-modal__section-title">
                搜索结果 ({searchResults.length})
              </h3>
              <div className="character-select-modal__list">
                {searchResults.map((result, index) => (
                  <div
                    key={index}
                    className="character-select-modal__item"
                    onClick={() => handleSelectCharacter(result)}
                  >
                    {result.profileImage && (
                      <img src={result.profileImage} alt={result.characterName} className="character-select-modal__avatar" />
                    )}
                    <div className="character-select-modal__info">
                      <span className="character-select-modal__name">{result.characterName}</span>
                      <span className="character-select-modal__meta">
                        {result.serverLabel} · Lv.{result.level} · {result.race === 1 ? '天族' : '魔族'}
                      </span>
                    </div>
                    <span className="character-select-modal__select-btn">选择</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 对比历史 */}
          {searchResults.length === 0 && compareHistory.length > 0 && (
            <div className="character-select-modal__compare-history">
              <h3 className="character-select-modal__section-title">
                对比历史
              </h3>
              <div className="character-select-modal__list">
                {compareHistory.slice(0, 10).map((history, index) => (
                  <div
                    key={index}
                    className="character-select-modal__item"
                    onClick={() => handleSelectFromCompareHistory(history)}
                  >
                    {history.profileImage && (
                      <img src={history.profileImage} alt={history.characterName} className="character-select-modal__avatar" />
                    )}
                    <div className="character-select-modal__info">
                      <span className="character-select-modal__name">{history.characterName}</span>
                      <span className="character-select-modal__meta">
                        {history.serverLabel}
                        {history.level && ` · Lv.${history.level}`}
                        {history.race && ` · ${history.race === 1 ? '天族' : '魔族'}`}
                      </span>
                    </div>
                    <button
                      className="character-select-modal__delete-btn"
                      onClick={(e) => handleDeleteCompareHistory(e, history.characterId)}
                      title="删除"
                    >
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="16" height="16">
                        <path d="M18 6L6 18M6 6l12 12" />
                      </svg>
                    </button>
                    <span className="character-select-modal__select-btn">选择</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 历史记录 */}
          {searchResults.length === 0 && compareHistory.length === 0 && searchHistory.length > 0 && (
            <div className="character-select-modal__history">
              <h3 className="character-select-modal__section-title">
                最近查询
              </h3>
              <div className="character-select-modal__list">
                {searchHistory.slice(0, 5).map((history, index) => (
                  <div
                    key={index}
                    className="character-select-modal__item"
                    onClick={() => handleSelectFromHistory(history)}
                  >
                    {history.profileImage && (
                      <img src={history.profileImage} alt={history.characterName} className="character-select-modal__avatar" />
                    )}
                    <div className="character-select-modal__info">
                      <span className="character-select-modal__name">{history.characterName}</span>
                      <span className="character-select-modal__meta">
                        {history.serverLabel}
                        {history.level && ` · Lv.${history.level}`}
                        {history.race && ` · ${history.race === 1 ? '天族' : '魔族'}`}
                      </span>
                    </div>
                    <span className="character-select-modal__select-btn">选择</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 空状态 */}
          {searchResults.length === 0 && compareHistory.length === 0 && searchHistory.length === 0 && !error && (
            <div className="character-select-modal__empty">
              <p>搜索角色名称进行对比</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CharacterSelectModal;
