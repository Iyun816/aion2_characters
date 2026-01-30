// 全局配置管理组件

import React, { useState, useEffect } from 'react';
import type { ClassBoardConfig, ClassBoardMapping } from '../../utils/daevanion';
import { useAdmin } from '../../contexts/AdminContext';
import './ConfigManager.css';

interface GlobalConfig {
  voiceChannelUrl: string;
  voiceChannelName: string;
  voiceChannelDescription: string;
  redeemCode: string;
  redeemCodeExpiry: string; // ISO 格式日期
}

interface SyncStatus {
  isRunning: boolean;
  isSyncing: boolean;
  intervalHours: number;
  lastSyncTime: string | null;
  nextSyncTime: string | null;
}

interface SyncLog {
  timestamp: string;
  type: 'info' | 'success' | 'error';
  message: string;
}

type SubTabType = 'timing' | 'voice' | 'redeem' | 'daevanion' | 'security';

const ConfigManager: React.FC = () => {
  const { changePassword } = useAdmin();
  const [activeSubTab, setActiveSubTab] = useState<SubTabType>('timing');

  // 密码修改状态
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordChanging, setPasswordChanging] = useState(false);

  const [config, setConfig] = useState<GlobalConfig>({
    voiceChannelUrl: '',
    voiceChannelName: '军团语音',
    voiceChannelDescription: '点击加入我们的语音频道',
    redeemCode: '',
    redeemCodeExpiry: '',
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // 同步日志
  const [syncLogs, setSyncLogs] = useState<SyncLog[]>([]);

  // 定时任务状态
  const [syncStatus, setSyncStatus] = useState<SyncStatus>({
    isRunning: false,
    isSyncing: false,
    intervalHours: 4,
    lastSyncTime: null,
    nextSyncTime: null
  });
  const [syncIntervalInput, setSyncIntervalInput] = useState(4);

  // 守护力职业配置状态
  const [daevanionConfig, setDaevanionConfig] = useState<ClassBoardConfig | null>(null);
  const [daevanionLoading, setDaevanionLoading] = useState(false);
  const [daevanionSaving, setDaevanionSaving] = useState(false);
  const [editingClass, setEditingClass] = useState<ClassBoardMapping | null>(null);
  const [isAddingClass, setIsAddingClass] = useState(false);

  // 加载配置
  useEffect(() => {
    loadConfig();
    loadSyncStatus();

    // 每5秒刷新一次同步状态
    const interval = setInterval(loadSyncStatus, 5000);
    return () => clearInterval(interval);
  }, []);

  const loadConfig = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/config');
      const data = await response.json();
      if (data.success) {
        setConfig(data.data);
      }
    } catch {
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
    } catch {
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

  // 添加日志
  const addLog = (type: 'info' | 'success' | 'error', message: string) => {
    const newLog: SyncLog = {
      timestamp: new Date().toISOString(),
      type,
      message
    };
    setSyncLogs(prev => [newLog, ...prev].slice(0, 100)); // 只保留最近100条
  };

  // ========== 定时任务管理 ==========

  const loadSyncStatus = async () => {
    try {
      const response = await fetch('/api/sync/status');
      const data = await response.json();
      if (data.success) {
        setSyncStatus(data.data);
        setSyncIntervalInput(data.data.intervalHours);
      }
    } catch {
      // 加载同步状态失败
    }
  };

  const handleStartSync = async () => {
    try {
      addLog('info', `正在启动定时任务，间隔：${syncIntervalInput}小时`);
      const response = await fetch('/api/sync/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ intervalHours: syncIntervalInput })
      });

      const data = await response.json();
      if (data.success) {
        showMessage('success', `${data.message}\n首次同步已在后台启动`);
        addLog('success', '定时任务已启动');
        addLog('info', '首次同步正在后台执行,可以继续浏览其他页面');

        // 刷新状态
        setTimeout(() => {
          loadSyncStatus();
        }, 1000);
      } else {
        showMessage('error', data.error || '启动失败');
        addLog('error', `启动失败: ${data.error}`);
      }
    } catch {
      showMessage('error', '启动失败');
      addLog('error', '启动失败，网络错误');
    }
  };

  const handleStopSync = async () => {
    try {
      addLog('info', '正在停止定时任务...');
      const response = await fetch('/api/sync/stop', {
        method: 'POST'
      });

      const data = await response.json();
      if (data.success) {
        showMessage('success', data.message);
        addLog('success', '定时任务已停止');
        loadSyncStatus();
      } else {
        showMessage('error', data.message || '停止失败');
        addLog('error', `停止失败: ${data.message}`);
      }
    } catch {
      showMessage('error', '停止失败');
      addLog('error', '停止失败，网络错误');
    }
  };

  const handleSyncNow = async () => {
    try {
      addLog('info', '正在启动后台同步...');

      const response = await fetch('/api/sync/now', {
        method: 'POST'
      });

      const data = await response.json();
      if (data.success) {
        showMessage('success', '数据同步已在后台启动,请稍后查看同步状态');
        addLog('success', '后台同步已启动,可以继续浏览其他页面');
        addLog('info', '提示: 同步过程会在服务器后台执行,请耐心等待');

        // 刷新状态显示
        setTimeout(() => {
          loadSyncStatus();
        }, 1000);
      } else {
        showMessage('error', data.message || '同步失败');
        addLog('error', `同步失败: ${data.message}`);
      }
    } catch {
      showMessage('error', '启动同步失败');
      addLog('error', '启动同步失败，网络错误');
    }
  };

  const formatTime = (isoString: string | null) => {
    if (!isoString) return '从未同步';
    const date = new Date(isoString);
    return date.toLocaleString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  };

  // ========== 守护力职业配置管理 ==========

  const loadDaevanionConfig = async () => {
    setDaevanionLoading(true);
    try {
      const response = await fetch('/data/class_board_mapping.json');
      if (response.ok) {
        const data: ClassBoardConfig = await response.json();
        setDaevanionConfig(data);
      }
    } catch {
      showMessage('error', '加载守护力配置失败');
    } finally {
      setDaevanionLoading(false);
    }
  };

  const saveDaevanionConfig = async () => {
    if (!daevanionConfig) return;

    setDaevanionSaving(true);
    try {
      const response = await fetch('/api/daevanion/config', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(daevanionConfig)
      });

      const data = await response.json();
      if (data.success) {
        showMessage('success', '守护力配置保存成功！');
        // 重新加载配置
        await loadDaevanionConfig();
      } else {
        showMessage('error', data.error || '保存失败');
      }
    } catch {
      showMessage('error', '保存失败，请稍后重试');
    } finally {
      setDaevanionSaving(false);
    }
  };

  const handleAddClass = () => {
    setEditingClass({
      classId: 0,
      className: '',
      classNameSimplified: '',
      classNameEn: '',
      boardIds: [0, 0, 0, 0, 0, 0]
    });
    setIsAddingClass(true);
  };

  const handleEditClass = (classMapping: ClassBoardMapping) => {
    setEditingClass({ ...classMapping });
    setIsAddingClass(false);
  };

  const handleDeleteClass = (classId: number) => {
    if (!daevanionConfig) return;

    if (confirm(`确定要删除职业ID ${classId} 的配置吗？`)) {
      setDaevanionConfig({
        ...daevanionConfig,
        classes: daevanionConfig.classes.filter(c => c.classId !== classId),
        lastUpdated: new Date().toISOString()
      });
    }
  };

  const handleSaveClass = () => {
    if (!editingClass || !daevanionConfig) return;

    // 验证
    if (!editingClass.className || !editingClass.classNameEn) {
      showMessage('error', '请填写职业名称');
      return;
    }

    if (editingClass.boardIds.some(id => id <= 0)) {
      showMessage('error', '面板ID必须大于0');
      return;
    }

    if (isAddingClass) {
      // 检查ID是否已存在
      if (daevanionConfig.classes.some(c => c.classId === editingClass.classId)) {
        showMessage('error', '该职业ID已存在');
        return;
      }

      setDaevanionConfig({
        ...daevanionConfig,
        classes: [...daevanionConfig.classes, editingClass].sort((a, b) => a.classId - b.classId),
        lastUpdated: new Date().toISOString()
      });
    } else {
      setDaevanionConfig({
        ...daevanionConfig,
        classes: daevanionConfig.classes.map(c =>
          c.classId === editingClass.classId ? editingClass : c
        ),
        lastUpdated: new Date().toISOString()
      });
    }

    setEditingClass(null);
    setIsAddingClass(false);
  };

  const handleCancelEdit = () => {
    setEditingClass(null);
    setIsAddingClass(false);
  };

  // 当切换到守护力配置tab时加载配置
  useEffect(() => {
    if (activeSubTab === 'daevanion' && !daevanionConfig) {
      loadDaevanionConfig();
    }
  }, [activeSubTab]);

  // 处理密码修改
  const handleChangePassword = async () => {
    if (!currentPassword || !newPassword || !confirmPassword) {
      showMessage('error', '请填写所有密码字段');
      return;
    }
    if (newPassword.length < 6) {
      showMessage('error', '新密码长度至少6位');
      return;
    }
    if (newPassword !== confirmPassword) {
      showMessage('error', '两次输入的新密码不一致');
      return;
    }

    setPasswordChanging(true);
    const result = await changePassword(currentPassword, newPassword);
    setPasswordChanging(false);

    if (result.success) {
      showMessage('success', '密码修改成功！');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } else {
      showMessage('error', result.error || '当前密码错误');
    }
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

      {/* 二级Tab导航 */}
      <div className="config-subtabs">
        <button
          className={`config-subtabs__tab ${activeSubTab === 'timing' ? 'config-subtabs__tab--active' : ''}`}
          onClick={() => setActiveSubTab('timing')}
        >
          定时任务
        </button>
        <button
          className={`config-subtabs__tab ${activeSubTab === 'voice' ? 'config-subtabs__tab--active' : ''}`}
          onClick={() => setActiveSubTab('voice')}
        >
          语音配置
        </button>
        <button
          className={`config-subtabs__tab ${activeSubTab === 'redeem' ? 'config-subtabs__tab--active' : ''}`}
          onClick={() => setActiveSubTab('redeem')}
        >
          兑换码管理
        </button>
        <button
          className={`config-subtabs__tab ${activeSubTab === 'daevanion' ? 'config-subtabs__tab--active' : ''}`}
          onClick={() => setActiveSubTab('daevanion')}
        >
          守护力配置
        </button>
        <button
          className={`config-subtabs__tab ${activeSubTab === 'security' ? 'config-subtabs__tab--active' : ''}`}
          onClick={() => setActiveSubTab('security')}
        >
          安全设置
        </button>
      </div>

      <div className="config-manager__content">
        {/* 定时任务Tab */}
        {activeSubTab === 'timing' && (
          <>
            {/* 定时任务配置 */}
            <div className="config-section">
              <h3 className="config-section__title">
                <span className="config-section__icon">⏰</span>
                定时数据同步
              </h3>
              <p className="config-section__desc">
                自动定期更新所有成员的角色数据（装备、等级、属性等）
              </p>

              <div className="sync-status">
                <div className="sync-status__row">
                  <span className="sync-status__label">任务状态：</span>
                  <span className={`sync-status__value ${syncStatus.isRunning ? 'sync-status__value--running' : ''}`}>
                    {syncStatus.isRunning ? '⏰ 运行中' : '⏹️ 已停止'}
                  </span>
                </div>

                {syncStatus.isSyncing && (
                  <div className="sync-status__row">
                    <span className="sync-status__label">当前状态：</span>
                    <span className="sync-status__value sync-status__value--syncing">
                      🔄 正在同步数据...
                    </span>
                  </div>
                )}

                <div className="sync-status__row">
                  <span className="sync-status__label">上次同步：</span>
                  <span className="sync-status__value">{formatTime(syncStatus.lastSyncTime)}</span>
                </div>

                {syncStatus.isRunning && syncStatus.nextSyncTime && (
                  <div className="sync-status__row">
                    <span className="sync-status__label">下次同步：</span>
                    <span className="sync-status__value">{formatTime(syncStatus.nextSyncTime)}</span>
                  </div>
                )}
              </div>

              <div className="config-field">
                <label htmlFor="syncInterval">
                  同步间隔（小时）
                  <span className="config-field__hint">（建议设置为 2-6 小时）</span>
                </label>
                <input
                  id="syncInterval"
                  type="number"
                  min="1"
                  max="24"
                  value={syncIntervalInput}
                  onChange={(e) => setSyncIntervalInput(Number(e.target.value))}
                  disabled={syncStatus.isRunning}
                />
                <span className="config-field__help">
                  间隔范围：1-24小时。过于频繁可能会导致API限流。
                </span>
              </div>

              <div className="sync-actions">
                {syncStatus.isRunning ? (
                  <button
                    onClick={handleStopSync}
                    className="btn btn--danger"
                    disabled={syncStatus.isSyncing}
                  >
                    ⏹️ 停止定时任务
                  </button>
                ) : (
                  <button
                    onClick={handleStartSync}
                    className="btn btn--primary"
                  >
                    ▶️ 启动定时任务
                  </button>
                )}

                <button
                  onClick={handleSyncNow}
                  className="btn btn--secondary"
                  disabled={syncStatus.isSyncing}
                >
                  🔄 立即同步
                </button>
              </div>

              <div className="sync-notice">
                <div className="sync-notice__icon">💡</div>
                <div className="sync-notice__content">
                  <p><strong>说明：</strong></p>
                  <ul>
                    <li>定时任务会自动更新所有已配置API的成员数据</li>
                    <li>同步数据包括：角色信息、装备详情、等级、属性等</li>
                    <li>启动定时任务后会立即执行一次同步</li>
                    <li>未配置API的成员会自动跳过</li>
                  </ul>
                </div>
              </div>
            </div>

            {/* 同步日志 */}
            <div className="config-section">
              <h3 className="config-section__title">
                <span className="config-section__icon">📋</span>
                同步日志
              </h3>
              <p className="config-section__desc">
                查看最近的数据同步操作记录
              </p>

              <div className="sync-log">
                {syncLogs.length === 0 ? (
                  <div className="sync-log__empty">暂无同步日志</div>
                ) : (
                  <div className="sync-log__list">
                    {syncLogs.map((log, index) => (
                      <div key={index} className={`sync-log__item sync-log__item--${log.type}`}>
                        <span className="sync-log__time">
                          {new Date(log.timestamp).toLocaleString('zh-CN', {
                            month: '2-digit',
                            day: '2-digit',
                            hour: '2-digit',
                            minute: '2-digit',
                            second: '2-digit'
                          })}
                        </span>
                        <span className={`sync-log__type sync-log__type--${log.type}`}>
                          {log.type === 'success' ? '✓' : log.type === 'error' ? '✗' : 'ℹ'}
                        </span>
                        <span className="sync-log__message">{log.message}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </>
        )}

        {/* 语音配置Tab */}
        {activeSubTab === 'voice' && (
          <>
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
          </>
        )}

        {/* 兑换码管理Tab */}
        {activeSubTab === 'redeem' && (
          <>
            {/* 兑换码配置 */}
            <div className="config-section">
              <h3 className="config-section__title">
                <span className="config-section__icon">🎁</span>
                兑换码管理
              </h3>
              <p className="config-section__desc">
                配置军团兑换码，将在军团页面显示供成员复制使用
              </p>

              <div className="config-field">
                <label htmlFor="redeemCode">
                  兑换码
                  <span className="config-field__hint">（游戏内可兑换的礼包码）</span>
                </label>
                <input
                  id="redeemCode"
                  type="text"
                  value={config.redeemCode}
                  onChange={(e) => handleChange('redeemCode', e.target.value)}
                  placeholder="请输入兑换码"
                  maxLength={50}
                />
                <span className="config-field__help">
                  留空表示暂无可用兑换码
                </span>
              </div>

              <div className="config-field">
                <label htmlFor="redeemCodeExpiry">
                  到期时间
                  <span className="config-field__hint">（兑换码过期日期）</span>
                </label>
                <input
                  id="redeemCodeExpiry"
                  type="datetime-local"
                  value={config.redeemCodeExpiry ? config.redeemCodeExpiry.slice(0, 16) : ''}
                  onChange={(e) => handleChange('redeemCodeExpiry', e.target.value ? new Date(e.target.value).toISOString() : '')}
                />
                <span className="config-field__help">
                  设置兑换码的有效期，过期后会在军团页面显示"已过期"
                </span>
              </div>
            </div>

            {/* 预览区域 */}
            <div className="config-preview">
              <h4 className="config-preview__title">预览效果</h4>
              <div className="config-preview__content config-preview__content--redeem">
                {config.redeemCode ? (
                  <>
                    <div className="redeem-preview">
                      <div className="redeem-preview__header">
                        <span className="redeem-preview__icon">🎁</span>
                        <span className="redeem-preview__title">军团兑换码</span>
                      </div>
                      <div className="redeem-preview__code-wrapper">
                        <code className="redeem-preview__code">{config.redeemCode}</code>
                        <button className="redeem-preview__copy">
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
                            <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
                          </svg>
                          复制
                        </button>
                      </div>
                      {config.redeemCodeExpiry && (
                        <div className="redeem-preview__expiry">
                          到期时间：{new Date(config.redeemCodeExpiry).toLocaleString('zh-CN', {
                            year: 'numeric',
                            month: '2-digit',
                            day: '2-digit',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </div>
                      )}
                    </div>
                  </>
                ) : (
                  <div className="config-preview__empty">请先配置兑换码</div>
                )}
              </div>
            </div>

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
          </>
        )}

        {/* 守护力配置Tab */}
        {activeSubTab === 'daevanion' && (
          <>
            {/* 守护力职业配置 */}
            <div className="config-section">
              <h3 className="config-section__title">
                <span className="config-section__icon">🛡️</span>
                守护力职业配置
              </h3>
              <p className="config-section__desc">
                配置各职业对应的守护力面板ID（boardId），每个职业有6个面板
              </p>

              {daevanionLoading ? (
                <div className="config-manager__loading">加载中...</div>
              ) : (
                <>
                  <div className="daevanion-class-list">
                    <table className="daevanion-table">
                      <thead>
                        <tr>
                          <th>职业ID</th>
                          <th>职业名称(繁体)</th>
                          <th>职业名称(简体)</th>
                          <th>职业名称(英文)</th>
                          <th>面板ID列表</th>
                          <th>操作</th>
                        </tr>
                      </thead>
                      <tbody>
                        {daevanionConfig?.classes.map((classMapping) => (
                          <tr key={classMapping.classId}>
                            <td>{classMapping.classId}</td>
                            <td>{classMapping.className}</td>
                            <td>{classMapping.classNameSimplified}</td>
                            <td>{classMapping.classNameEn}</td>
                            <td>
                              <code className="board-ids">
                                [{classMapping.boardIds.join(', ')}]
                              </code>
                            </td>
                            <td>
                              <button
                                onClick={() => handleEditClass(classMapping)}
                                className="btn btn--small btn--secondary"
                              >
                                编辑
                              </button>
                              <button
                                onClick={() => handleDeleteClass(classMapping.classId)}
                                className="btn btn--small btn--danger"
                                style={{ marginLeft: '8px' }}
                              >
                                删除
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>

                    {(!daevanionConfig || daevanionConfig.classes.length === 0) && (
                      <div className="daevanion-empty">暂无职业配置</div>
                    )}
                  </div>

                  <div className="config-section__actions">
                    <button
                      onClick={handleAddClass}
                      className="btn btn--primary"
                    >
                      + 新增职业
                    </button>
                  </div>
                </>
              )}
            </div>

            {/* 编辑/新增职业对话框 */}
            {editingClass && (
              <div className="modal-overlay" onClick={handleCancelEdit}>
                <div className="modal-dialog" onClick={(e) => e.stopPropagation()}>
                  <h3>{isAddingClass ? '新增职业' : '编辑职业'}</h3>

                  <div className="config-field">
                    <label htmlFor="classId">职业ID</label>
                    <input
                      id="classId"
                      type="number"
                      value={editingClass.classId}
                      onChange={(e) => setEditingClass({
                        ...editingClass,
                        classId: parseInt(e.target.value) || 0
                      })}
                      disabled={!isAddingClass}
                      placeholder="例如: 1"
                    />
                  </div>

                  <div className="config-field">
                    <label htmlFor="className">职业名称(繁体)</label>
                    <input
                      id="className"
                      type="text"
                      value={editingClass.className}
                      onChange={(e) => setEditingClass({
                        ...editingClass,
                        className: e.target.value
                      })}
                      placeholder="例如: 劍星"
                    />
                  </div>

                  <div className="config-field">
                    <label htmlFor="classNameSimplified">职业名称(简体)</label>
                    <input
                      id="classNameSimplified"
                      type="text"
                      value={editingClass.classNameSimplified}
                      onChange={(e) => setEditingClass({
                        ...editingClass,
                        classNameSimplified: e.target.value
                      })}
                      placeholder="例如: 剑星"
                    />
                  </div>

                  <div className="config-field">
                    <label htmlFor="classNameEn">职业名称(英文)</label>
                    <input
                      id="classNameEn"
                      type="text"
                      value={editingClass.classNameEn}
                      onChange={(e) => setEditingClass({
                        ...editingClass,
                        classNameEn: e.target.value
                      })}
                      placeholder="例如: Gladiator"
                    />
                  </div>

                  <div className="config-field">
                    <label>面板ID列表 (6个面板)</label>
                    <div className="board-ids-input">
                      {editingClass.boardIds.map((id, index) => (
                        <input
                          key={index}
                          type="number"
                          value={id}
                          onChange={(e) => {
                            const newBoardIds = [...editingClass.boardIds];
                            newBoardIds[index] = parseInt(e.target.value) || 0;
                            setEditingClass({
                              ...editingClass,
                              boardIds: newBoardIds
                            });
                          }}
                          placeholder={`面板${index + 1}`}
                          style={{ width: '80px', marginRight: '8px' }}
                        />
                      ))}
                    </div>
                  </div>

                  <div className="modal-actions">
                    <button onClick={handleSaveClass} className="btn btn--primary">
                      保存
                    </button>
                    <button onClick={handleCancelEdit} className="btn btn--secondary">
                      取消
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* 保存按钮 */}
            <div className="config-manager__actions">
              <button
                onClick={saveDaevanionConfig}
                disabled={daevanionSaving}
                className="btn btn--primary"
              >
                {daevanionSaving ? '保存中...' : '保存配置到文件'}
              </button>
              <button
                onClick={loadDaevanionConfig}
                disabled={daevanionSaving}
                className="btn btn--secondary"
              >
                重新加载
              </button>
            </div>

            <div className="sync-notice" style={{ marginTop: '24px' }}>
              <div className="sync-notice__icon">💡</div>
              <div className="sync-notice__content">
                <p><strong>说明:</strong></p>
                <ul>
                  <li>配置修改后需要点击"保存配置到文件"才会生效</li>
                  <li>每个职业必须配置6个守护力面板ID</li>
                  <li>面板ID通常是职业ID*10 + 序号,例如剑星(职业1): [11,12,13,14,15,16]</li>
                  <li>配置保存后,前端会自动加载新配置,无需重启</li>
                </ul>
              </div>
            </div>
          </>
        )}

        {/* 安全设置Tab */}
        {activeSubTab === 'security' && (
          <>
            <div className="config-section">
              <h3 className="config-section__title">
                <span className="config-section__icon">🔐</span>
                修改管理员密码
              </h3>
              <p className="config-section__desc">
                修改管理后台的登录密码
              </p>

              <div className="config-field">
                <label htmlFor="currentPassword">当前密码</label>
                <input
                  id="currentPassword"
                  type="password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  placeholder="请输入当前密码"
                  autoComplete="current-password"
                />
              </div>

              <div className="config-field">
                <label htmlFor="newPassword">新密码</label>
                <input
                  id="newPassword"
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="请输入新密码（至少6位）"
                  autoComplete="new-password"
                />
              </div>

              <div className="config-field">
                <label htmlFor="confirmPassword">确认新密码</label>
                <input
                  id="confirmPassword"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="请再次输入新密码"
                  autoComplete="new-password"
                />
              </div>

              <div className="config-manager__actions">
                <button
                  onClick={handleChangePassword}
                  disabled={passwordChanging}
                  className="btn btn--primary"
                >
                  {passwordChanging ? '修改中...' : '修改密码'}
                </button>
              </div>

              <div className="sync-notice" style={{ marginTop: '24px' }}>
                <div className="sync-notice__icon">💡</div>
                <div className="sync-notice__content">
                  <p><strong>说明:</strong></p>
                  <ul>
                    <li>密码修改后立即生效</li>
                    <li>新密码长度至少6位</li>
                    <li>密码存储在服务器，所有设备共享同一密码</li>
                  </ul>
                </div>
              </div>
            </div>
          </>
        )}
      </div>

      {/* 消息提示 */}
      {message && (
        <div className={`config-manager__message config-manager__message--${message.type}`}>
          {message.text}
        </div>
      )}
    </div>
  );
};

export default ConfigManager;
