import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { loadMembers, addApplication } from '../services/dataService';
import './JoinPage.css';

const JoinPage = () => {
  const [formData, setFormData] = useState({
    characterName: '',
    className: '',
    level: '',
    contact: '',
    message: ''
  });
  const [submitted, setSubmitted] = useState(false);
  const [leaderName, setLeaderName] = useState('温禾'); // 默认值

  // 加载军团长名称
  useEffect(() => {
    const loadLeader = async () => {
      try {
        const members = await loadMembers();
        // 第一个成员永远是军团长
        if (members.length > 0) {
          setLeaderName(members[0].name);
        }
      } catch (error) {
        console.error('加载军团长名称失败:', error);
      }
    };
    loadLeader();
  }, []);

  const classes = [
    '劍星', '守護星', '魔道星', '精靈星',
    '治癒星', '護法星', '弓星', '殺星',
    '吟遊星', '槍星', '機甲星', '畫師'
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      // 直接提交申请到后端
      await addApplication({
        characterName: formData.characterName,
        className: formData.className,
        level: formData.level ? Number(formData.level) : undefined,
        contact: formData.contact || undefined,
        message: formData.message || undefined,
      });

      console.log('申请已提交:', formData);
      setSubmitted(true);
    } catch (error) {
      console.error('提交申请失败:', error);
      alert('提交失败,请稍后重试');
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
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
              <li>天族阵营，希埃尔服务器</li>
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
              <div className="join-page__contact-item">
                <span className="join-page__contact-icon">🎮</span>
                <div>
                  <strong>游戏内联系</strong>
                  <p>私聊军团长「{leaderName}」</p>
                </div>
              </div>
            </div>
          </div>

          <form className="join-page__form" onSubmit={handleSubmit}>
            <h2>申请表单</h2>

            <div className="join-page__field">
              <label htmlFor="characterName">角色名称 *</label>
              <input
                type="text"
                id="characterName"
                name="characterName"
                value={formData.characterName}
                onChange={handleChange}
                placeholder="请输入你的游戏角色名"
                required
              />
            </div>

            <div className="join-page__field">
              <label htmlFor="className">职业 *</label>
              <select
                id="className"
                name="className"
                value={formData.className}
                onChange={handleChange}
                required
              >
                <option value="">请选择职业</option>
                {classes.map(cls => (
                  <option key={cls} value={cls}>{cls}</option>
                ))}
              </select>
            </div>

            <div className="join-page__field">
              <label htmlFor="level">等级</label>
              <input
                type="number"
                id="level"
                name="level"
                value={formData.level}
                onChange={handleChange}
                placeholder="当前等级"
                min="1"
                max="50"
              />
            </div>

            <div className="join-page__field">
              <label htmlFor="contact">联系方式</label>
              <input
                type="text"
                id="contact"
                name="contact"
                value={formData.contact}
                onChange={handleChange}
                placeholder="QQ / 微信 / Discord 等"
              />
            </div>

            <div className="join-page__field">
              <label htmlFor="message">自我介绍</label>
              <textarea
                id="message"
                name="message"
                value={formData.message}
                onChange={handleChange}
                placeholder="介绍一下自己吧，比如游戏经历、喜欢的玩法等"
                rows={4}
              />
            </div>

            <button type="submit" className="join-page__submit">
              提交申请
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default JoinPage;
