import { useEffect, useRef } from 'react';
import type { AggregatedDaevanionEffects } from '../utils/daevanion';
import './DaevanionModal.css';

interface DaevanionModalProps {
  visible: boolean;
  loading: boolean;
  effects: AggregatedDaevanionEffects | null;
  onClose: () => void;
}

const DaevanionModal = ({ visible, loading, effects, onClose }: DaevanionModalProps) => {
  const modalRef = useRef<HTMLDivElement>(null);

  // 点击外部关闭
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (modalRef.current && !modalRef.current.contains(event.target as Node)) {
        onClose();
      }
    };

    if (visible) {
      document.addEventListener('mousedown', handleClickOutside);
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.body.style.overflow = 'unset';
    };
  }, [visible, onClose]);

  // ESC键关闭
  useEffect(() => {
    const handleEsc = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    if (visible) {
      document.addEventListener('keydown', handleEsc);
    }

    return () => {
      document.removeEventListener('keydown', handleEsc);
    };
  }, [visible, onClose]);

  if (!visible) return null;

  return (
    <div className="daevanion-modal-overlay">
      <div className="daevanion-modal" ref={modalRef}>
        <div className="daevanion-modal__header">
          <h3 className="daevanion-modal__title">守护力面板效果</h3>
          <button
            className="daevanion-modal__close"
            onClick={onClose}
            aria-label="关闭"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M18 6L6 18M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="daevanion-modal__content">
          {loading ? (
            <div className="daevanion-modal__loading">
              <div className="daevanion-modal__spinner"></div>
              <p>加载守护力数据中...</p>
            </div>
          ) : effects ? (
            <div className="daevanion-modal__split">
              {/* 左侧：属性效果 */}
              <div className="daevanion-modal__column daevanion-modal__column--left">
                <div className="daevanion-section">
                  <h4 className="daevanion-section__title">
                    属性效果
                    <span className="daevanion-section__count">({effects.totalStats})</span>
                  </h4>
                  {effects.statEffects.length > 0 ? (
                    <div className="daevanion-section__list">
                      {effects.statEffects.map((effect, index) => (
                        <div key={index} className="daevanion-effect">
                          <span className="daevanion-effect__dot"></span>
                          <span className="daevanion-effect__text">{effect}</span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="daevanion-section__empty">暂无属性效果</div>
                  )}
                </div>
              </div>

              {/* 右侧：技能效果 */}
              <div className="daevanion-modal__column daevanion-modal__column--right">
                <div className="daevanion-section">
                  <h4 className="daevanion-section__title">
                    技能效果
                    <span className="daevanion-section__count">({effects.totalSkills})</span>
                  </h4>
                  {effects.skillEffects.length > 0 ? (
                    <div className="daevanion-section__list">
                      {effects.skillEffects.map((effect, index) => (
                        <div key={index} className="daevanion-effect daevanion-effect--skill">
                          <span className="daevanion-effect__dot"></span>
                          <span className="daevanion-effect__text">{effect}</span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="daevanion-section__empty">暂无技能效果</div>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div className="daevanion-modal__empty">
              <p>加载守护力数据失败</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default DaevanionModal;
