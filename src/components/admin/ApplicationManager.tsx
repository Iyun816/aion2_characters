// 申请审批组件

import React, { useState, useEffect } from 'react';
import type { JoinApplication, MemberConfig } from '../../types/admin';
import {
  loadApplications,
  reviewApplication,
  deleteApplication,
  addMember,
  loadMembers,
} from '../../services/dataService';
import ConfirmDialog from '../ConfirmDialog';
import './ApplicationManager.css';

type FilterType = 'all' | 'pending' | 'approved' | 'rejected';

// 消息对话框状态
interface MessageDialog {
  visible: boolean;
  title: string;
  message: string;
  type: 'success' | 'warning' | 'error';
}

const ApplicationManager: React.FC = () => {
  const [applications, setApplications] = useState<JoinApplication[]>([]);
  const [members, setMembers] = useState<MemberConfig[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<FilterType>('pending');
  const [reviewingApp, setReviewingApp] = useState<string | null>(null);
  const [reviewNote, setReviewNote] = useState('');
  const [confirmDialog, setConfirmDialog] = useState<{
    visible: boolean;
    applicationId: string;
    characterName: string;
  }>({
    visible: false,
    applicationId: '',
    characterName: '',
  });
  const [messageDialog, setMessageDialog] = useState<MessageDialog>({
    visible: false,
    title: '',
    message: '',
    type: 'success'
  });

  // 加载数据
  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [appsData, membersData] = await Promise.all([
        loadApplications(),
        loadMembers(),
      ]);
      setApplications(appsData);
      setMembers(membersData);
    } catch {
      // 加载数据失败
    } finally {
      setLoading(false);
    }
  };

  // 通过申请
  const handleApprove = async (applicationId: string, createMember: boolean) => {
    const application = applications.find(a => a.id === applicationId);
    if (!application) return;

    try {
      // 更新申请状态
      await reviewApplication(
        applicationId,
        'approved',
        reviewNote || undefined
      );

      // 如果选择创建成员
      if (createMember) {
        // 解码 characterId,将 URL 编码的字符解码 (例如 %3D -> =)
        const decodedCharacterId = decodeURIComponent(application.characterId);
        const memberId = decodedCharacterId;

        // 检查是否已存在
        if (members.some(m => m.id === memberId)) {
          setMessageDialog({
            visible: true,
            title: '成员已存在',
            message: `该角色已存在于成员列表中\n角色: ${application.characterName}\nID: ${memberId}`,
            type: 'warning'
          });
          loadData();
          return;
        }

        const fullMemberData: MemberConfig = {
          id: memberId,  // 使用解码后的 characterId 作为 ID
          name: application.characterName,
          role: 'member',
          serverId: application.serverId,
          characterId: decodedCharacterId,
        };

        try {
          await addMember(members, fullMemberData);

          // 后台异步同步角色数据,不等待结果
          fetch('/api/sync/member', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(fullMemberData)
          }).catch(() => {
            // 角色数据同步失败
          });

          // 立即显示成功提示
          setMessageDialog({
            visible: true,
            title: '审批成功',
            message: `申请已通过，成员 "${application.characterName}" 已创建\n服务器: ${application.serverName}\n\n角色数据正在后台同步中...`,
            type: 'success'
          });
        } catch (error: any) {
          if (error.message.includes('已存在')) {
            setMessageDialog({
              visible: true,
              title: '成员已存在',
              message: `成员已存在: ${memberId}`,
              type: 'warning'
            });
          } else {
            throw error;
          }
        }
      } else {
        setMessageDialog({
          visible: true,
          title: '审批成功',
          message: '申请已通过',
          type: 'success'
        });
      }

      setReviewingApp(null);
      setReviewNote('');

      // 重新加载数据
      loadData();
    } catch (error: any) {
      setMessageDialog({
        visible: true,
        title: '操作失败',
        message: error.message || '操作失败',
        type: 'error'
      });
    }
  };

  // 拒绝申请
  const handleReject = async (applicationId: string) => {
    try {
      await reviewApplication(
        applicationId,
        'rejected',
        reviewNote || undefined
      );
      setMessageDialog({
        visible: true,
        title: '已拒绝',
        message: '申请已拒绝',
        type: 'success'
      });
      setReviewingApp(null);
      setReviewNote('');

      // 重新加载数据
      loadData();
    } catch (error: any) {
      setMessageDialog({
        visible: true,
        title: '操作失败',
        message: error.message || '操作失败',
        type: 'error'
      });
    }
  };

  // 删除申请
  const handleDelete = async (applicationId: string, characterName: string) => {
    setConfirmDialog({
      visible: true,
      applicationId: applicationId,
      characterName: characterName,
    });
  };

  // 确认删除
  const handleConfirmDelete = async () => {
    const applicationId = confirmDialog.applicationId;

    // 关闭对话框
    setConfirmDialog({ visible: false, applicationId: '', characterName: '' });

    try {
      await deleteApplication(applicationId);
      // 重新加载数据
      loadData();
    } catch (error: any) {
      alert(error.message || '删除失败');
    }
  };

  // 取消删除
  const handleCancelDelete = () => {
    setConfirmDialog({ visible: false, applicationId: '', characterName: '' });
  };

  // 筛选申请
  const filteredApplications = applications.filter(app => {
    if (filter === 'all') return true;
    return app.status === filter;
  });

  // 统计数据
  const stats = {
    total: applications.length,
    pending: applications.filter(a => a.status === 'pending').length,
    approved: applications.filter(a => a.status === 'approved').length,
    rejected: applications.filter(a => a.status === 'rejected').length,
  };

  // 状态显示
  const getStatusDisplay = (status: string) => {
    const statusMap: Record<string, string> = {
      pending: '待审批',
      approved: '已通过',
      rejected: '已拒绝',
    };
    return statusMap[status] || status;
  };

  if (loading) {
    return <div className="application-manager__loading">加载中...</div>;
  }

  return (
    <div className="application-manager">
      {/* 统计卡片 */}
      <div className="stats-cards">
        <div className="stats-card">
          <div className="stats-card__value">{stats.pending}</div>
          <div className="stats-card__label">待审批</div>
        </div>
        <div className="stats-card">
          <div className="stats-card__value">{stats.approved}</div>
          <div className="stats-card__label">已通过</div>
        </div>
        <div className="stats-card">
          <div className="stats-card__value">{stats.rejected}</div>
          <div className="stats-card__label">已拒绝</div>
        </div>
        <div className="stats-card">
          <div className="stats-card__value">{stats.total}</div>
          <div className="stats-card__label">总计</div>
        </div>
      </div>

      {/* 工具栏 */}
      <div className="application-manager__toolbar">
        <div className="filter-buttons">
          <button
            className={`filter-btn ${filter === 'pending' ? 'filter-btn--active' : ''}`}
            onClick={() => setFilter('pending')}
          >
            待审批 ({stats.pending})
          </button>
          <button
            className={`filter-btn ${filter === 'approved' ? 'filter-btn--active' : ''}`}
            onClick={() => setFilter('approved')}
          >
            已通过 ({stats.approved})
          </button>
          <button
            className={`filter-btn ${filter === 'rejected' ? 'filter-btn--active' : ''}`}
            onClick={() => setFilter('rejected')}
          >
            已拒绝 ({stats.rejected})
          </button>
          <button
            className={`filter-btn ${filter === 'all' ? 'filter-btn--active' : ''}`}
            onClick={() => setFilter('all')}
          >
            全部 ({stats.total})
          </button>
        </div>
      </div>

      {/* 申请列表 */}
      <div className="application-list">
        {filteredApplications.length === 0 ? (
          <div className="application-list__empty">
            {filter === 'pending' ? '暂无待审批申请' : '暂无申请'}
          </div>
        ) : (
          filteredApplications.map((app) => (
            <div key={app.id} className={`application-card application-card--${app.status}`}>
              <div className="application-card__header">
                <div className="application-card__title">
                  <span className="application-card__name">
                    {app.characterName}
                  </span>
                  <span className={`status-tag status-tag--${app.status}`}>
                    {getStatusDisplay(app.status)}
                  </span>
                </div>
                <div className="application-card__meta">
                  提交于 {new Date(app.submittedAt).toLocaleString('zh-CN')}
                </div>
              </div>

              <div className="application-card__body">
                <div className="application-card__info">
                  {/* 角色信息 */}
                  <div className="info-item">
                    <span className="info-label">角色名称:</span>
                    <span className="info-value">{app.characterName}</span>
                  </div>
                  <div className="info-item">
                    <span className="info-label">服务器:</span>
                    <span className="info-value">
                      {app.serverName} (ID: {app.serverId})
                    </span>
                  </div>
                  {/* 角色链接 */}
                  <div className="info-item">
                    <span className="info-label">角色链接:</span>
                    <a
                      href={app.characterUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="info-value info-value--link"
                      style={{
                        color: 'var(--color-primary)',
                        textDecoration: 'none',
                        wordBreak: 'break-all'
                      }}
                    >
                      查看角色详情
                      <svg
                        style={{ display: 'inline-block', width: '14px', height: '14px', marginLeft: '4px' }}
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                      >
                        <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
                        <polyline points="15 3 21 3 21 9" />
                        <line x1="10" y1="14" x2="21" y2="3" />
                      </svg>
                    </a>
                  </div>
                </div>

                {app.status !== 'pending' && app.reviewedAt && (
                  <div className="application-card__review">
                    <div className="review-time">
                      审批于 {new Date(app.reviewedAt).toLocaleString('zh-CN')}
                    </div>
                    {app.reviewNote && (
                      <div className="review-note">
                        <span className="info-label">备注:</span> {app.reviewNote}
                      </div>
                    )}
                  </div>
                )}
              </div>

              <div className="application-card__actions">
                {app.status === 'pending' && (
                  <>
                    {reviewingApp === app.id ? (
                      <div className="review-panel">
                        <input
                          type="text"
                          placeholder="审批备注 (可选)"
                          value={reviewNote}
                          onChange={(e) => setReviewNote(e.target.value)}
                          className="review-note-input"
                        />
                        <div className="review-panel__buttons">
                          <button
                            onClick={() => handleApprove(app.id, true)}
                            className="btn btn--success"
                          >
                            通过并创建成员
                          </button>
                          <button
                            onClick={() => handleApprove(app.id, false)}
                            className="btn btn--secondary"
                          >
                            仅通过
                          </button>
                          <button
                            onClick={() => handleReject(app.id)}
                            className="btn btn--danger"
                          >
                            拒绝
                          </button>
                          <button
                            onClick={() => {
                              setReviewingApp(null);
                              setReviewNote('');
                            }}
                            className="btn btn--secondary"
                          >
                            取消
                          </button>
                        </div>
                      </div>
                    ) : (
                      <button
                        onClick={() => setReviewingApp(app.id)}
                        className="btn btn--primary"
                      >
                        审批
                      </button>
                    )}
                  </>
                )}
                <button
                  onClick={() => handleDelete(app.id, app.characterName)}
                  className="btn btn--sm btn--danger"
                >
                  删除
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* 删除确认对话框 */}
      <ConfirmDialog
        visible={confirmDialog.visible}
        title="删除申请"
        message={`确定要删除 "${confirmDialog.characterName}" 的申请吗？`}
        confirmText="删除"
        cancelText="取消"
        onConfirm={handleConfirmDelete}
        onCancel={handleCancelDelete}
        danger={true}
      />

      {/* 消息提示对话框 */}
      <ConfirmDialog
        visible={messageDialog.visible}
        title={messageDialog.title}
        message={messageDialog.message}
        confirmText="确定"
        onConfirm={() => setMessageDialog({ ...messageDialog, visible: false })}
        onCancel={() => setMessageDialog({ ...messageDialog, visible: false })}
        danger={messageDialog.type === 'error'}
      />
    </div>
  );
};

export default ApplicationManager;
