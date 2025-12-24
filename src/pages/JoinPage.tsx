import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { loadMembers, addApplication } from '../services/dataService';
import './JoinPage.css';

const JoinPage = () => {
  const [formData, setFormData] = useState({
    characterUrl: ''
  });
  const [submitted, setSubmitted] = useState(false);
  const [contacts, setContacts] = useState<{ role: string; name: string }[]>([]);
  const [urlError, setUrlError] = useState('');

  // 新增: 角色信息解析状态
  const [parsing, setParsing] = useState(false);
  const [parsedCharacter, setParsedCharacter] = useState<{
    characterId: string;
    characterName: string;
    serverId: number;
    serverName: string;
  } | null>(null);
  const [showConfirm, setShowConfirm] = useState(false);

  // 加载联系人(军团长和精英)
  useEffect(() => {
    const loadContacts = async () => {
      try {
        const members = await loadMembers();
        const contactList = [];

        // 查找军团长
        const leader = members.find(m => m.role === 'leader');
        if (leader) {
          contactList.push({ role: '军团长', name: leader.name });
        }

        // 查找军团精英
        const elites = members.filter(m => m.role === 'elite');
        elites.forEach(elite => {
          contactList.push({ role: '军团精英', name: elite.name });
        });

        setContacts(contactList);
      } catch (error) {
        console.error('加载联系人失败:', error);
      }
    };
    loadContacts();
  }, []);

  // 简单验证角色URL格式
  const handleCharacterUrlChange = (url: string) => {
    setFormData(prev => ({ ...prev, characterUrl: url }));
    setUrlError('');
    setParsedCharacter(null);
    setShowConfirm(false);

    if (!url.trim()) {
      return;
    }

    // 简单验证URL格式
    const match = url.match(/\/characters\/(\d+)\/([^/\s]+)/);
    if (!match) {
      setUrlError('无效的角色链接格式，请确保链接格式为: https://tw.ncsoft.com/aion2/characters/{serverId}/{characterId}');
    }
  };

  // 解析角色信息
  const handleParseCharacter = async () => {
    if (!formData.characterUrl) {
      alert('请填写角色链接');
      return;
    }

    // 解析URL
    const urlMatch = formData.characterUrl.match(/\/characters\/(\d+)\/([^/\s]+)/);
    if (!urlMatch) {
      setUrlError('无效的角色链接格式');
      return;
    }

    const serverId = parseInt(urlMatch[1]);
    const characterId = decodeURIComponent(urlMatch[2]);

    setParsing(true);
    setUrlError('');

    try {
      // 通过后端代理获取角色信息
      const response = await fetch(
        `/api/character/info?characterId=${encodeURIComponent(characterId)}&serverId=${serverId}`
      );

      if (!response.ok) {
        setUrlError('无法获取角色信息，请检查链接是否正确');
        setParsing(false);
        return;
      }

      const data = await response.json();

      if (!data.profile || !data.profile.characterName) {
        setUrlError('角色信息不完整，请检查链接');
        setParsing(false);
        return;
      }

      // 保存解析结果
      setParsedCharacter({
        characterId,
        characterName: data.profile.characterName,
        serverId,
        serverName: data.profile.serverName
      });
      setShowConfirm(true);
      setParsing(false);
    } catch (error) {
      console.error('获取角色信息失败:', error);
      setUrlError('获取角色信息失败，请稍后重试');
      setParsing(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // 验证必填字段
    if (!formData.characterUrl) {
      alert('请填写角色链接');
      return;
    }

    // 必须先解析角色信息
    if (!parsedCharacter) {
      alert('请先验证角色信息');
      return;
    }

    try {
      // 提交申请,包含完整的角色信息
      await addApplication({
        characterUrl: formData.characterUrl,
        characterId: parsedCharacter.characterId,
        characterName: parsedCharacter.characterName,
        serverId: parsedCharacter.serverId,
        serverName: parsedCharacter.serverName
      });

      console.log('申请已提交:', parsedCharacter);
      setSubmitted(true);
    } catch (error) {
      console.error('提交申请失败:', error);
      alert('提交失败,请稍后重试');
    }
  };

  if (submitted) {
    return (
      <div className="join-page">
        <div className="join-page__success">
          <div className="join-page__success-icon">✓</div>
          <h2>申请已提交</h2>
          <p>感谢你对椿夏军团的关注！</p>
          <p>请在游戏内联系军团长或军团精英，我们会尽快处理你的申请。</p>
          <Link to="/" className="join-page__btn">返回首页</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="join-page">
      <div className="join-page__container">
        <div className="join-page__header">
          <Link to="/" className="join-page__back">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M19 12H5M12 19l-7-7 7-7" />
            </svg>
            返回
          </Link>
          <h1 className="join-page__title">加入椿夏</h1>
          <p className="join-page__subtitle">填写申请信息，成为椿夏的一员</p>
        </div>

        <div className="join-page__content">
          <div className="join-page__info">
            <h2>入团须知</h2>
            <ul>
              <li>天族阵营</li>
              <li>友善待人，不恶意攻击他人</li>
              <li>能够参与基本的军团活动（不强制）</li>
              <li>有语音条件更佳</li>
            </ul>

            <h2>重要提示</h2>
            <div className="join-page__notice">
              <span className="join-page__notice-icon">ℹ️</span>
              <div className="join-page__notice-content">
                <p>填写申请表单不代表加入军团，该表单仅用于获取游戏角色信息并展示在本网站。</p>
                <p>如需申请加入军团，请在游戏内搜索「椿夏」申请即可。</p>
              </div>
            </div>

            <h2>联系方式</h2>
            <div className="join-page__contact">
              {contacts.map((contact, index) => (
                <div key={index} className="join-page__contact-item">
                  {contact.role}「{contact.name}」
                </div>
              ))}
              {contacts.length === 0 && (
                <div className="join-page__contact-item">
                  军团长或军团精英
                </div>
              )}
            </div>
          </div>

          <form className="join-page__form" onSubmit={handleSubmit}>
            <h2>申请表单</h2>

            <div className="join-page__field">
              <label htmlFor="characterUrl">
                角色链接 *
                <a
                  href="https://tw.ncsoft.com/aion2/characters/index"
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    marginLeft: '8px',
                    fontSize: '0.85rem',
                    color: 'var(--color-primary)',
                    textDecoration: 'none'
                  }}
                >
                  [前往查询角色 →]
                </a>
              </label>
              <input
                type="url"
                id="characterUrl"
                name="characterUrl"
                value={formData.characterUrl}
                onChange={(e) => handleCharacterUrlChange(e.target.value)}
                placeholder="https://tw.ncsoft.com/aion2/characters/1001/A1pIWbd0UKo..."
                required
                disabled={showConfirm}
              />
              {urlError && (
                <span style={{ color: '#e74c3c', fontSize: '0.85rem', marginTop: '4px', display: 'block' }}>
                  {urlError}
                </span>
              )}
              <span style={{ color: 'var(--color-text-muted)', fontSize: '0.85rem', marginTop: '4px', display: 'block' }}>
                点击上方链接查询角色，然后复制完整的角色页面URL粘贴到这里
              </span>

              {/* 验证按钮 */}
              {!showConfirm && (
                <button
                  type="button"
                  onClick={handleParseCharacter}
                  disabled={!formData.characterUrl || !!urlError || parsing}
                  style={{
                    marginTop: '12px',
                    padding: '10px 20px',
                    background: 'var(--color-primary)',
                    color: 'white',
                    border: 'none',
                    borderRadius: 'var(--radius-md)',
                    cursor: 'pointer',
                    fontSize: '0.95rem',
                    fontWeight: '600',
                    opacity: (!formData.characterUrl || !!urlError || parsing) ? 0.5 : 1
                  }}
                >
                  {parsing ? '验证中...' : '验证角色信息'}
                </button>
              )}

              {/* 角色信息确认 */}
              {showConfirm && parsedCharacter && (
                <div style={{
                  marginTop: '16px',
                  padding: '16px',
                  background: 'var(--color-bg-secondary)',
                  borderRadius: 'var(--radius-md)',
                  border: '2px solid var(--color-primary)'
                }}>
                  <div style={{ marginBottom: '8px', fontWeight: '600', color: 'var(--color-primary)' }}>
                    ✓ 角色信息验证成功
                  </div>
                  <div style={{ marginBottom: '4px' }}>
                    <span style={{ color: 'var(--color-text-muted)' }}>角色名称: </span>
                    <span style={{ fontWeight: '600' }}>{parsedCharacter.characterName}</span>
                  </div>
                  <div style={{ marginBottom: '12px' }}>
                    <span style={{ color: 'var(--color-text-muted)' }}>服务器: </span>
                    <span style={{ fontWeight: '600' }}>{parsedCharacter.serverName}</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setParsedCharacter(null);
                      setShowConfirm(false);
                    }}
                    style={{
                      padding: '6px 12px',
                      background: 'transparent',
                      color: 'var(--color-text-muted)',
                      border: '1px solid var(--color-border)',
                      borderRadius: 'var(--radius-sm)',
                      cursor: 'pointer',
                      fontSize: '0.85rem'
                    }}
                  >
                    重新验证
                  </button>
                </div>
              )}
            </div>

            <div className="join-page__field-notice">
              <p>✓ 验证角色信息后才能提交申请</p>
              <p>✓ 天族与魔族均可填写并展示角色信息</p>
              <p>✓ 不涉及账号密码，角色信息均为使用角色名称从官方API请求得到的数据</p>
            </div>

            <button type="submit" className="join-page__submit" disabled={!showConfirm}>
              {showConfirm ? '确认提交申请' : '请先验证角色信息'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default JoinPage;
