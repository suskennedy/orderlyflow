import { useCallback, useEffect } from 'react';
import { PaintColor, usePaintsStore } from '../stores/paintsStore';
import { useRealTimeSubscription } from './useRealTimeSubscription';

export function usePaints(homeId: string) {
  const {
    paintsByHome,
    loadingByHome,
    fetchPaints,
    setPaints,
    setLoading,
    createPaint,
    updatePaint,
    deletePaint,
  } = usePaintsStore();

  const paints = paintsByHome[homeId] || [];
  const loading = loadingByHome[homeId] ?? false;

  // Handle real-time changes
  const handlePaintChange = useCallback((payload: any) => {
    if (payload.new?.home_id !== homeId && payload.old?.home_id !== homeId) {
      return; // Not for this home
    }

    console.log('🔥 Real-time paint change:', payload);
    const store = usePaintsStore.getState();
    const currentPaints = store.paintsByHome[homeId] || [];

    if (payload.eventType === 'INSERT') {
      const newPaint = payload.new as PaintColor;
      if (!currentPaints.some(p => p.id === newPaint.id)) {
        setPaints(homeId, [newPaint, ...currentPaints]);
      }
    } else if (payload.eventType === 'UPDATE') {
      setPaints(
        homeId,
        currentPaints.map(paint =>
          paint.id === payload.new.id ? (payload.new as PaintColor) : paint
        )
      );
    } else if (payload.eventType === 'DELETE') {
      setPaints(
        homeId,
        currentPaints.filter(paint => paint.id !== payload.old.id)
      );
    }
  }, [homeId, setPaints]);

  // Set up real-time subscription
  useRealTimeSubscription(
    {
      table: 'paint_colors',
      filter: homeId ? `home_id=eq.${homeId}` : undefined,
    },
    handlePaintChange
  );

  // Initial data fetch
  useEffect(() => {
    if (homeId) {
      fetchPaints(homeId);
    } else {
      setPaints(homeId, []);
      setLoading(homeId, false);
    }
  }, [homeId, fetchPaints, setPaints, setLoading]);

  return {
    paints,
    loading,
    createPaint: (paintData: Omit<PaintColor, 'id' | 'created_at' | 'updated_at' | 'home_id'>) =>
      createPaint(homeId, paintData),
    updatePaint: (id: string, updates: Partial<PaintColor>) =>
      updatePaint(homeId, id, updates),
    deletePaint: (id: string) => deletePaint(homeId, id),
  };
}

