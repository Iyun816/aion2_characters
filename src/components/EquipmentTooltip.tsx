// 装备悬浮提示组件 - 简化版 (已弃用,保留空组件兼容性)

import React from 'react';

interface EquipmentTooltipProps {
  position: { x: number; y: number };
  visible: boolean;
}

// 不再显示任何提示文字,直接返回null
const EquipmentTooltip: React.FC<EquipmentTooltipProps> = () => {
  return null;
};

export default EquipmentTooltip;
