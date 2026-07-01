import { describe, it, expect, beforeEach } from 'vitest';
import { reduceGameState, DEFAULT_CONFIG, BOARD_SIZE } from '../GameEngine';
import { GameState } from '../types';

describe('GameEngine - Board & Movement (模块 1)', () => {
  let initialState: GameState;

  beforeEach(() => {
    // 每次测试前初始化一个房间
    initialState = {
      roomId: 'room1',
      status: 'WAITING',
      config: { ...DEFAULT_CONFIG, enableMovement: true }, // 只开启移动模块
      players: {},
      playerOrder: [],
      currentPlayerIndex: 0
    };
  });

  it('应该允许玩家加入房间', () => {
    const state = reduceGameState(initialState, { 
      type: 'JOIN_ROOM', 
      payload: { playerId: 'p1', playerName: 'Alice' } 
    });
    
    expect(state.players['p1']).toBeDefined();
    expect(state.players['p1'].position).toBe(0); // 初始坐标必须在 0
    expect(state.playerOrder).toContain('p1');
  });

  it('应该正确更新玩家坐标，并在超过棋盘大小时循环', () => {
    // 模拟加入玩家并开始游戏
    let state = reduceGameState(initialState, { type: 'JOIN_ROOM', payload: { playerId: 'p1', playerName: 'Alice' } });
    state = reduceGameState(state, { type: 'START_GAME' });

    // 玩家当前回合，掷骰子获得 5 点
    state = reduceGameState(state, { type: 'ROLL_DICE', payload: { playerId: 'p1', diceValue: 5 } });
    
    expect(state.players['p1'].position).toBe(5);

    // 强制修改坐标到终点前，测试循环（绕过起点）
    state.players['p1'].position = BOARD_SIZE - 2; 
    state.currentPlayerIndex = 0; // 假装又轮到了 p1

    state = reduceGameState(state, { type: 'ROLL_DICE', payload: { playerId: 'p1', diceValue: 3 } });
    
    // (BOARD_SIZE - 2 + 3) % BOARD_SIZE = 1
    expect(state.players['p1'].position).toBe(1); 
  });
  
  it('如果不轮到该玩家，掷骰子无效', () => {
    let state = reduceGameState(initialState, { type: 'JOIN_ROOM', payload: { playerId: 'p1', playerName: 'Alice' } });
    state = reduceGameState(state, { type: 'JOIN_ROOM', payload: { playerId: 'p2', playerName: 'Bob' } });
    state = reduceGameState(state, { type: 'START_GAME' });

    // 当前应该是 p1 (index 0)，如果 p2 强行掷骰子，应该没有效果
    expect(state.currentPlayerIndex).toBe(0);
    
    const beforeState = JSON.stringify(state);
    state = reduceGameState(state, { type: 'ROLL_DICE', payload: { playerId: 'p2', diceValue: 6 } });
    
    // 状态应完全无变化
    expect(JSON.stringify(state)).toBe(beforeState);
  });
});
