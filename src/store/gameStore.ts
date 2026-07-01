import { create } from 'zustand';
import { supabase } from '../supabaseClient';
import { GameState } from '../engine/types';

interface GameStore {
  roomId: string | null;
  gameState: GameState | null;
  setRoomId: (id: string) => void;
  syncGameState: (state: GameState) => void;
  subscribeToRoom: (roomId: string) => void;
  unsubscribe: () => void;
}

let realtimeChannel: ReturnType<typeof supabase.channel> | null = null;

export const useGameStore = create<GameStore>((set, get) => ({
  roomId: null,
  gameState: null,
  
  setRoomId: (id) => set({ roomId: id }),
  
  syncGameState: (state) => set({ gameState: state }),

  subscribeToRoom: (roomId: string) => {
    // 如果已经订阅了旧房间，先取消
    get().unsubscribe();
    
    set({ roomId });

    // 订阅当前房间的数据库更新 (监听 public.game_states 表)
    realtimeChannel = supabase
      .channel(`room:${roomId}`)
      .on(
        'postgres_changes',
        {
          event: '*', // 监听增删改
          schema: 'public',
          table: 'game_states',
          filter: `room_id=eq.${roomId}`,
        },
        (payload) => {
          console.log('Realtime update received!', payload);
          if (payload.new && payload.new.state) {
            set({ gameState: payload.new.state as GameState });
          }
        }
      )
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          console.log('Successfully connected to Supabase Realtime');
        }
      });
  },

  unsubscribe: () => {
    if (realtimeChannel) {
      supabase.removeChannel(realtimeChannel);
      realtimeChannel = null;
    }
  },
}));
