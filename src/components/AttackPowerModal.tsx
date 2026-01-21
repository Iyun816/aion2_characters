import type { AttackPowerResult } from '../utils/attackPowerCalculator';
import './AttackPowerModal.css';

interface AttackPowerModalProps {
  isOpen: boolean;
  onClose: () => void;
  attackPowerData: AttackPowerResult | null;
}

const AttackPowerModal = ({ isOpen, onClose, attackPowerData }: AttackPowerModalProps) => {
  if (!isOpen || !attackPowerData) return null;

  const { breakdown, totalFlat, totalPercent, finalPower } = attackPowerData;

  return (
    <div className="attack-power-modal-overlay" onClick={onClose}>
      <div className="attack-power-modal" onClick={(e) => e.stopPropagation()}>
        <div className="attack-power-modal__header">
          <h3>攻击力来源统计</h3>
          <button className="attack-power-modal__close" onClick={onClose}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path d="M18 6L6 18M6 6l12 12" strokeWidth="2" strokeLinecap="round" />
            </svg>
          </button>
        </div>

        {/* 误差提示 */}
        <div className="attack-power-modal__notice">
          <svg width="18" height="18" viewBox="0 0 16 16" fill="currentColor">
            <path d="M8 0a8 8 0 100 16A8 8 0 008 0zm.5 12h-1v-1h1v1zm0-2h-1V4h1v6z"/>
          </svg>
          <span>未包含:宠物加成、服装、翅膀、被动技能,最终结果有误差,仅供参考</span>
        </div>

        <div className="attack-power-modal__body">
          {/* 左右布局容器 */}
          <div className="attack-power-grid">
            {/* 左侧: 固定值 */}
            <div className="attack-power-column">
              <h4 className="attack-power-column__title">固定攻击力</h4>

              <div className="attack-power-item">
                <span className="attack-power-item__label">装备/首饰</span>
                <span className="attack-power-item__value">{breakdown.equipmentFlat}</span>
              </div>

              <div className="attack-power-item">
                <span className="attack-power-item__label">
                  守护力效果
                  <span className="attack-power-item__sublabel">(包含额外攻击力、PVE攻击力)</span>
                </span>
                <span className="attack-power-item__value">{breakdown.daevanionFlat}</span>
              </div>

              <div className="attack-power-divider"></div>

              <div className="attack-power-item attack-power-item--total">
                <span className="attack-power-item__label">固定值合计</span>
                <span className="attack-power-item__value">{totalFlat}</span>
              </div>
            </div>

            {/* 右侧: 百分比 */}
            <div className="attack-power-column">
              <h4 className="attack-power-column__title">百分比加成</h4>

              <div className="attack-power-item">
                <span className="attack-power-item__label">装备/饰品</span>
                <span className="attack-power-item__value">+{breakdown.equipmentPercent.toFixed(1)}%</span>
              </div>

              <div className="attack-power-item">
                <span className="attack-power-item__label">破坏</span>
                <span className="attack-power-item__value">+{breakdown.destruction.toFixed(1)}%</span>
              </div>

              <div className="attack-power-item">
                <span className="attack-power-item__label">威力</span>
                <span className="attack-power-item__value">+{breakdown.strength.toFixed(1)}%</span>
              </div>

              <div className="attack-power-divider"></div>

              <div className="attack-power-item attack-power-item--total">
                <span className="attack-power-item__label">百分比合计</span>
                <span className="attack-power-item__value">+{totalPercent.toFixed(1)}%</span>
              </div>
            </div>
          </div>

          {/* 最终结果 */}
          <div className="attack-power-result">
            <div className="attack-power-result__row">
              <span className="attack-power-result__label">最终攻击力</span>
              <span className="attack-power-result__value">{finalPower}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AttackPowerModal;
