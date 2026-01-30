// useEquipmentTooltip Hook - 支持点击查看详情

import { useState, useCallback, useRef, useEffect } from 'react';
import type { EquipmentDetail } from '../types/admin';
import type { EquipmentItem } from '../data/memberTypes';
import { getEquipmentCache } from '../services/dataService';

interface TooltipState {
  position: { x: number; y: number };
  visible: boolean;
}

interface ModalState {
  equipmentDetail: EquipmentDetail | null;
  visible: boolean;
  loading: boolean;
  position: { x: number; y: number };
}

interface UseEquipmentTooltipReturn {
  tooltipState: TooltipState;
  modalState: ModalState;
  handleMouseEnter: (event: React.MouseEvent, equipmentId: number) => void;
  handleMouseMove: (event: React.MouseEvent) => void;
  handleMouseLeave: () => void;
  handleClick: (event: React.MouseEvent, equipmentId: number, equipmentItem?: EquipmentItem, charId?: string, srvId?: number) => void;
  handleCloseModal: () => void;
}

interface UseEquipmentTooltipOptions {
  memberId?: string;
  equipmentDetails?: Record<number, EquipmentDetail>;
  characterId?: string;
  serverId?: number;
  equipmentList?: EquipmentItem[];
}

export function useEquipmentTooltip(options: UseEquipmentTooltipOptions | string): UseEquipmentTooltipReturn {
  // 兼容旧的调用方式（直接传 memberId 字符串）
  const { memberId, equipmentDetails, equipmentList } = typeof options === 'string'
    ? { memberId: options, equipmentDetails: undefined, equipmentList: undefined }
    : options;
  const [tooltipState, setTooltipState] = useState<TooltipState>({
    position: { x: 0, y: 0 },
    visible: false,
  });

  const [modalState, setModalState] = useState<ModalState>({
    equipmentDetail: null,
    visible: false,
    loading: false,
    position: { x: 0, y: 0 },
  });

  const [equipmentCache, setEquipmentCache] = useState<Map<string, EquipmentDetail>>(new Map());
  const showTimeoutRef = useRef<number | null>(null);

  // 加载装备缓存
  useEffect(() => {
    // 如果直接传入了装备详情数据，直接使用
    if (equipmentDetails) {
      const cacheMap = new Map<string, EquipmentDetail>();
      Object.entries(equipmentDetails).forEach(([_id, detail]) => {
        // 使用 slotPos 作为唯一key,因为同一个装备ID可能在不同slotPos有不同属性
        const cacheKey = detail.slotPos ? `${detail.id}_${detail.slotPos}` : String(detail.id);
        cacheMap.set(cacheKey, detail);
      });
      setEquipmentCache(cacheMap);
      return;
    }

    // 如果 memberId 为空,跳过加载缓存(用于非军团成员的角色查询)
    if (!memberId) {
      return;
    }

    const loadCache = async () => {
      const cache = await getEquipmentCache(memberId);

      if (cache && cache.details) {
        const cacheMap = new Map<string, EquipmentDetail>();
        cache.details.forEach(detail => {
          // 使用 slotPos 作为唯一key,确保Ring1/Ring2, Earring1/Earring2等能区分
          const cacheKey = detail.slotPos ? `${detail.id}_${detail.slotPos}` : String(detail.id);
          cacheMap.set(cacheKey, detail);
        });
        setEquipmentCache(cacheMap);
      }
    };

    loadCache();
  }, [memberId, equipmentDetails]);

  // 鼠标进入装备 - 显示简单提示
  const handleMouseEnter = useCallback((event: React.MouseEvent, _equipmentId: number) => {
    // 清除之前的延迟
    if (showTimeoutRef.current) {
      clearTimeout(showTimeoutRef.current);
    }

    // 保存当前元素的位置信息
    const target = event.currentTarget as HTMLElement;
    const rect = target.getBoundingClientRect();

    // 延迟 200ms 显示提示
    showTimeoutRef.current = window.setTimeout(() => {
      setTooltipState({
        position: {
          x: rect.right + 10,
          y: rect.top,
        },
        visible: true,
      });
    }, 200);
  }, []);

  // 鼠标移动时更新位置
  const handleMouseMove = useCallback((event: React.MouseEvent) => {
    setTooltipState(prev => {
      if (!prev.visible) return prev;

      return {
        ...prev,
        position: {
          x: event.clientX + 15,
          y: event.clientY + 15,
        },
      };
    });
  }, []);

  // 鼠标离开装备
  const handleMouseLeave = useCallback(() => {
    // 清除延迟
    if (showTimeoutRef.current) {
      clearTimeout(showTimeoutRef.current);
      showTimeoutRef.current = null;
    }

    setTooltipState({
      position: { x: 0, y: 0 },
      visible: false,
    });
  }, []);

  // 点击装备 - 打开详情模态框
  const handleClick = useCallback((event: React.MouseEvent, equipmentId: number, equipmentItem?: any, _charId?: string, _srvId?: number) => {
    // 获取点击元素的位置信息 - 传递完整的rect用于智能定位
    const target = event.currentTarget as HTMLElement;
    const rect = target.getBoundingClientRect();
    // 传递装备元素的完整位置信息，让弹窗组件智能选择显示方向
    const clickPosition = {
      x: rect.right + 10,
      y: rect.top,
      // 额外传递装备元素的边界信息
      equipRect: {
        left: rect.left,
        right: rect.right,
        top: rect.top,
        bottom: rect.bottom,
        width: rect.width,
        height: rect.height,
      }
    };

    // 先检查缓存中是否已有该装备详情
    // 对于有slotPos的装备(Ring1/Ring2等),使用复合key: id_slotPos
    const actualEquipItem = equipmentItem || equipmentList?.find((item) => item.id === equipmentId);
    const cacheKeyForMemory = actualEquipItem?.slotPos
      ? `${equipmentId}_${actualEquipItem.slotPos}`
      : String(equipmentId);
    const detail = equipmentCache.get(cacheKeyForMemory);

    // 隐藏提示
    setTooltipState({ position: { x: 0, y: 0 }, visible: false });

    if (detail) {
      // 显示模态框(数据已加载)
      setModalState({
        equipmentDetail: detail,
        visible: true,
        loading: false,
        position: clickPosition,
      });
    } else {
      // 数据还未加载完成，显示加载状态（不发起额外请求）
      setModalState({
        equipmentDetail: null,
        visible: true,
        loading: true,
        position: clickPosition,
      });
    }
  }, [equipmentCache, equipmentList]);

  // 关闭模态框
  const handleCloseModal = useCallback(() => {
    setModalState({
      equipmentDetail: null,
      visible: false,
      loading: false,
      position: { x: 0, y: 0 },
    });
  }, []);

  // 清理
  useEffect(() => {
    return () => {
      if (showTimeoutRef.current) {
        clearTimeout(showTimeoutRef.current);
      }
    };
  }, []);

  return {
    tooltipState,
    modalState,
    handleMouseEnter,
    handleMouseMove,
    handleMouseLeave,
    handleClick,
    handleCloseModal,
  };
}
