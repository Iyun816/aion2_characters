// 全局配置管理组件

import React, { useState, useEffect } from 'react';
import './ConfigManager.css';

interface GlobalConfig {
  voiceChannelUrl: string;
  voiceChannelName: string;
  voiceChannelDescription: string;
}

const ConfigManager: React.FC = () => {
  const [config, setConfig] = useState<GlobalConfig>({
    voiceChannelUrl: '',
    voiceChannelName: '军团语音',
    voiceChannelDescription: '点击加入我们的语音频道'
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // 加载配置
  useEffect(() => {
    loadConfig();
  }, []);

  const loadConfig = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/config');
      const data = await response.json();
      if (data.success) {
        setConfig(data.data);
      }
    } catch (error) {
      console.error('加载配置失败:', error);
      showMessage('error', '加载配置失败');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    setMessage(null);

    try {
      const response = await fetch('/api/config', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(config),
      });

      const data = await response.json();
      if (data.success) {
        showMessage('success', '配置保存成功！');
      } else {
        showMessage('error', data.error || '保存失败');
      }
    } catch (error) {
      console.error('保存配置失败:', error);
      showMessage('error', '保存失败，请稍后重试');
    } finally {
      setSaving(false);
    }
  };

  const showMessage = (type: 'success' | 'error', text: string) => {
    setMessage({ type, text });
    setTimeout(() => setMessage(null), 5000);
  };

  const handleChange = (field: keyof GlobalConfig, value: string) => {
    setConfig(prev => ({ ...prev, [field]: value }));
  };

  if (loading) {
    return <div className="config-manager__loading">加载中...</div>;
  }

  return (
    <div className="config-manager">
      <div className="config-manager__header">
        <h2>全局配置</h2>
        <p>管理军团网站的全局设置</p>
      </div>

      <div className="config-manager__content">
        {/* 语音频道配置 */}
        <div className="config-section">
          <h3 className="config-section__title">
            <span className="config-section__icon">🎤</span>
            语音频道配置
          </h3>
          <p className="config-section__desc">
            配置军团语音频道链接，支持 Discord、QQ 频道、YY 等任何语音平台的邀请链接
          </p>

          <div className="config-field">
            <label htmlFor="voiceChannelUrl">
              语音频道链接
              <span className="config-field__hint">（完整的邀请链接 URL）</span>
            </label>
            <input
              id="voiceChannelUrl"
              type="url"
              value={config.voiceChannelUrl}
              onChange={(e) => handleChange('voiceChannelUrl', e.target.value)}
              placeholder="https://discord.gg/example 或 https://pd.qq.com/..."
            />
            <span className="config-field__help">
              示例：Discord: https://discord.gg/xxxxx，QQ频道: https://pd.qq.com/s/xxxxx
            </span>
          </div>

          <div className="config-field">
            <label htmlFor="voiceChannelName">
              显示名称
              <span className="config-field__hint">（在军团页面显示的标题）</span>
            </label>
            <input
              id="voiceChannelName"
              type="text"
              value={config.voiceChannelName}
              onChange={(e) => handleChange('voiceChannelName', e.target.value)}
              placeholder="军团语音"
            />
          </div>

          <div className="config-field">
            <label htmlFor="voiceChannelDescription">
              描述信息
              <span className="config-field__hint">（引导文字）</span>
            </label>
            <textarea
              id="voiceChannelDescription"
              value={config.voiceChannelDescription}
              onChange={(e) => handleChange('voiceChannelDescription', e.target.value)}
              placeholder="点击加入我们的语音频道"
              rows={3}
            />
          </div>
        </div>

        {/* 预览区域 */}
        <div className="config-preview">
          <h4 className="config-preview__title">预览效果</h4>
          <div className="config-preview__content">
            <div className="config-preview__icon">🎤</div>
            <h3>{config.voiceChannelName || '军团语音'}</h3>
            <p>{config.voiceChannelDescription || '点击加入我们的语音频道'}</p>
            {config.voiceChannelUrl ? (
              <div className="config-preview__button">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
                  <polyline points="15 3 21 3 21 9" />
                  <line x1="10" y1="14" x2="21" y2="3" />
                </svg>
                加入语音频道
              </div>
            ) : (
              <div className="config-preview__empty">请先配置语音频道链接</div>
            )}
          </div>
        </div>
      </div>

      {/* 消息提示 */}
      {message && (
        <div className={`config-manager__message config-manager__message--${message.type}`}>
          {message.text}
        </div>
      )}

      {/* 操作按钮 */}
      <div className="config-manager__actions">
        <button
          onClick={handleSave}
          disabled={saving}
          className="btn btn--primary"
        >
          {saving ? '保存中...' : '保存配置'}
        </button>
        <button
          onClick={loadConfig}
          disabled={saving}
          className="btn btn--secondary"
        >
          重置
        </button>
      </div>
    </div>
  );
};

export default ConfigManager;
