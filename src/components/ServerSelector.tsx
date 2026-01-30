import { useState, useRef, useEffect } from 'react';
import type { ServerOption } from '../types/character';
import './ServerSelector.css';

interface ServerSelectorProps {
  servers: ServerOption[];
  selectedServer: number | null;
  onSelectServer: (serverId: number | null, serverName?: string) => void;
  showAllOption?: boolean;  // 是否显示"全部服务器"选项
  placeholder?: string;
  disabled?: boolean;
}

const ServerSelector = ({
  servers,
  selectedServer,
  onSelectServer,
  showAllOption = true,
  placeholder = '请选择服务器',
  disabled = false,
}: ServerSelectorProps) => {
  const [showDropdown, setShowDropdown] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // 获取选中服务器的显示名称
  const getSelectedServerLabel = () => {
    if (!selectedServer) return showAllOption ? '全部服务器' : placeholder;
    const server = servers.find(s => s.id === selectedServer);
    return server ? server.label : placeholder;
  };

  // 获取选中服务器的阵营
  const getSelectedServerRace = () => {
    if (!selectedServer) return null;
    const server = servers.find(s => s.id === selectedServer);
    return server?.raceId || null;
  };

  // 选择服务器
  const handleSelectServer = (serverId: number | null) => {
    const server = servers.find(s => s.id === serverId);
    onSelectServer(serverId, server?.label || server?.name);
    setShowDropdown(false);
  };

  // 切换下拉菜单
  const toggleDropdown = () => {
    if (!disabled) {
      setShowDropdown(!showDropdown);
    }
  };

  // 点击外部关闭
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setShowDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // 天族服务器 (raceId = 1)
  const celestialServers = servers.filter(s => s.raceId === 1);
  // 魔族服务器 (raceId = 2)
  const asmodianServers = servers.filter(s => s.raceId === 2);

  // 获取按钮的阵营样式类
  const selectedRace = getSelectedServerRace();
  const buttonRaceClass = selectedRace === 1
    ? 'server-selector-button--celestial'
    : selectedRace === 2
      ? 'server-selector-button--asmodian'
      : '';

  return (
    <div className="server-selector-wrapper" ref={containerRef}>
      <button
        type="button"
        className={`server-selector-button ${buttonRaceClass} ${disabled ? 'server-selector-button--disabled' : ''}`}
        onClick={toggleDropdown}
        disabled={disabled}
      >
        {getSelectedServerLabel()}
      </button>

      {/* 服务器选择面板 */}
      {showDropdown && !disabled && (
        <>
          <div
            className="server-selector-overlay"
            onClick={() => setShowDropdown(false)}
          />
          <div className="server-selector-panel">
            <div className="server-selector-panel__header">
              <h4 className="server-selector-panel__title">选择服务器</h4>
              <button
                type="button"
                className="server-selector-panel__close"
                onClick={() => setShowDropdown(false)}
              >
                ✕
              </button>
            </div>

            {/* 全部服务器按钮 */}
            {showAllOption && (
              <button
                type="button"
                className={`server-selector-panel__all ${!selectedServer ? 'server-selector-panel__all--active' : ''}`}
                onClick={() => handleSelectServer(null)}
              >
                全部服务器
              </button>
            )}

            {/* 天魔分组显示 */}
            <div className="server-selector-panel__groups">
              {/* 天族组 */}
              <div className="server-selector-panel__group server-selector-panel__group--celestial">
                <div className="server-selector-panel__group-header">
                  <img
                    src="https://assets.playnccdn.com/static-about-game/aion2/img/elyos/emblem.webp"
                    alt="天族"
                    className="server-selector-panel__group-icon-img"
                  />
                  <span className="server-selector-panel__group-title">天族服务器</span>
                  <span className="server-selector-panel__group-count">{celestialServers.length}个</span>
                </div>
                <div className="server-selector-panel__buttons">
                  {celestialServers.map(server => (
                    <button
                      key={server.id}
                      type="button"
                      className={`server-selector-panel__btn server-selector-panel__btn--celestial ${selectedServer === server.id ? 'server-selector-panel__btn--active' : ''}`}
                      onClick={() => handleSelectServer(server.id)}
                    >
                      {server.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* 魔族组 */}
              <div className="server-selector-panel__group server-selector-panel__group--asmodian">
                <div className="server-selector-panel__group-header">
                  <img
                    src="https://assets.playnccdn.com/static-about-game/aion2/img/asmodians/emblem.webp"
                    alt="魔族"
                    className="server-selector-panel__group-icon-img"
                  />
                  <span className="server-selector-panel__group-title">魔族服务器</span>
                  <span className="server-selector-panel__group-count">{asmodianServers.length}个</span>
                </div>
                <div className="server-selector-panel__buttons">
                  {asmodianServers.map(server => (
                    <button
                      key={server.id}
                      type="button"
                      className={`server-selector-panel__btn server-selector-panel__btn--asmodian ${selectedServer === server.id ? 'server-selector-panel__btn--active' : ''}`}
                      onClick={() => handleSelectServer(server.id)}
                    >
                      {server.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default ServerSelector;
