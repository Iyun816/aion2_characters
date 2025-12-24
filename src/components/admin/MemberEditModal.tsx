// 成员编辑弹窗组件

import React, { useState, useEffect } from 'react';
import type { MemberConfig } from '../../types/admin';
import ServerSelect from '../ServerSelect';
import './MemberEditModal.css';

interface MemberEditModalProps {
  member: MemberConfig;
  isCreating: boolean;
  onSave: (member: MemberConfig) => void;
  onCancel: () => void;
}

const MemberEditModal: React.FC<MemberEditModalProps> = ({
  member,
  isCreating,
  onSave,
  onCancel,
}) => {
  const [formData, setFormData] = useState<MemberConfig>(member);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [serverList, setServerList] = useState<Array<{
    serverId: number;
    serverName: string;
    raceId: number;
  }>>([]);

  useEffect(() => {
    setFormData(member);
  }, [member]);

  // 加载服务器列表
  useEffect(() => {
    const loadServers = async () => {
      try {
        const response = await fetch('/data/serverId.json');
        const data = await response.json();
        setServerList(data.serverList || []);
      } catch (error) {
        console.error('加载服务器列表失败:', error);
      }
    };
    loadServers();
  }, []);

  const handleChange = (field: keyof MemberConfig, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));

    // 清除该字段的错误
    if (errors[field]) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    // 必填字段验证
    if (!formData.id.trim()) {
      newErrors.id = 'ID 不能为空';
    }

    if (!formData.name.trim()) {
      newErrors.name = '名称不能为空';
    }

    // Character ID 验证（必填）
    if (!formData.characterId || !formData.characterId.trim()) {
      newErrors.characterId = 'Character ID 不能为空';
    }

    // serverId 验证（必填）
    if (!formData.serverId) {
      newErrors.serverId = '请选择服务器';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!validate()) {
      return;
    }

    // 清理数据
    const cleanedData: MemberConfig = {
      ...formData,
      id: formData.id.trim(),
      name: formData.name.trim(),
      characterId: formData.characterId.trim(),
      serverId: formData.serverId,
    };

    onSave(cleanedData);
  };

  return (
    <div className="modal-overlay" onClick={onCancel}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>{isCreating ? '添加成员' : '编辑成员'}</h2>
          <button className="modal-close" onClick={onCancel}>
            ×
          </button>
        </div>

        <form onSubmit={handleSubmit} className="modal-form">
          {/* 基础信息和 API 配置并排 */}
          <div className="modal-form-grid">
            {/* 基础信息 */}
            <div className="form-section">
              <h3>基础信息</h3>

              <div className="form-field">
                <label htmlFor="member-id">
                  ID <span className="required">*</span>
                </label>
                <input
                  id="member-id"
                  type="text"
                  value={formData.id}
                  onChange={(e) => handleChange('id', e.target.value)}
                  disabled={!isCreating}
                  placeholder="例如: A1pIWbd0UKoTYJ2XbL_Cw0VdSx_UlJ-2sv_dtkIvlnM="
                />
                {errors.id && <span className="form-error">{errors.id}</span>}
                <span className="form-hint">
                  {isCreating
                    ? '成员ID（通常与 Character ID 相同，作为唯一标识）'
                    : '用于文件夹名称 (不可修改)'}
                </span>
              </div>

              <div className="form-field">
                <label htmlFor="member-name">
                  名称 <span className="required">*</span>
                </label>
                <input
                  id="member-name"
                  type="text"
                  value={formData.name}
                  onChange={(e) => handleChange('name', e.target.value)}
                  placeholder="角色名称"
                />
                {errors.name && <span className="form-error">{errors.name}</span>}
              </div>

              <div className="form-field">
                <label htmlFor="member-role">角色</label>
                <select
                  id="member-role"
                  value={formData.role}
                  onChange={(e) => handleChange('role', e.target.value as MemberConfig['role'])}
                >
                  <option value="member">成员</option>
                  <option value="elite">精英</option>
                  <option value="leader">团长</option>
                </select>
              </div>

              <div className="form-field">
                <label htmlFor="member-joindate">加入日期</label>
                <input
                  id="member-joindate"
                  type="date"
                  value={formData.joinDate || ''}
                  onChange={(e) => handleChange('joinDate', e.target.value)}
                />
              </div>
            </div>

            {/* API 配置 */}
            <div className="form-section">
              <h3>API 配置</h3>
              <p className="form-section-desc">
                填写 Character ID 和服务器信息，用于数据同步
              </p>

              <div className="form-field">
                <label htmlFor="member-character-id">
                  Character ID <span className="required">*</span>
                </label>
                <input
                  id="member-character-id"
                  type="text"
                  value={formData.characterId || ''}
                  onChange={(e) => handleChange('characterId', e.target.value)}
                  placeholder="例如: A1pIWbd0UKoTYJ2XbL_Cw0VdSx_UlJ-2sv_dtkIvlnM="
                />
                {errors.characterId && <span className="form-error">{errors.characterId}</span>}
                <span className="form-hint">
                  从角色链接中获取的 Character ID（Base64 编码字符串）
                </span>
              </div>

              <div className="form-field">
                <label htmlFor="member-server">
                  服务器 <span className="required">*</span>
                </label>
                <ServerSelect
                  value={formData.serverId?.toString() || ''}
                  onChange={(serverId) => handleChange('serverId', serverId)}
                  serverList={serverList}
                  placeholder="请选择服务器"
                />
                {errors.serverId && <span className="form-error">{errors.serverId}</span>}
                <span className="form-hint">
                  成员所在的游戏服务器
                </span>
              </div>
            </div>
          </div>
        </form>

        {/* 操作按钮 */}
        <div className="modal-actions">
          <button type="button" onClick={onCancel} className="btn btn--secondary">
            取消
          </button>
          <button type="submit" onClick={handleSubmit} className="btn btn--primary">
            {isCreating ? '创建' : '保存'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default MemberEditModal;
