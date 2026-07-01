import { describe, it, expect, beforeEach } from 'vitest';
import { reduceGameState, DEFAULT_CONFIG } from '../GameEngine';
import { GameState } from '../types';

describe('GameEngine - Asset Trading & Victory (模块 4 & 5)', () => {
  let initialState: GameState;

  beforeEach(() => {
    initialState = {
      roomId: 'room3',
      status: 'WAITING',
      config: { ...DEFAULT_CONFIG, enableAssetTrade: true, enableVictoryCheck: true },
      players: {},
      playerOrder: [],
      currentPlayerIndex: 0
    };
  });

  it('资金充足时购买资产成功，增加被动收入，扣除现金 (模块 4)', () => {
    let state = reduceGameState(initialState, { type: 'JOIN_ROOM', payload: { playerId: 'p1', playerName: 'Alice' } });
    state = reduceGameState(state, { type: 'ASSIGN_JOB', payload: { playerId: 'p1', jobId: 'janitor' } });
    state = reduceGameState(state, { type: 'START_GAME' });

    // 门卫初始现金 560
    state = reduceGameState(state, { 
      type: 'BUY_ASSET', 
      payload: { playerId: 'p1', assetId: 'pizza_store', cost: 500, passiveIncome: 100 } 
    });

    const player = state.players['p1'];
    expect(player.statement?.assets.cash).toBe(60); // 560 - 500
    expect(player.statement?.income.passiveIncome).toBe(100);
  });

  it('资金不足时购买资产失败，状态不变 (模块 4)', () => {
    let state = reduceGameState(initialState, { type: 'JOIN_ROOM', payload: { playerId: 'p1', playerName: 'Alice' } });
    state = reduceGameState(state, { type: 'ASSIGN_JOB', payload: { playerId: 'p1', jobId: 'janitor' } });
    state = reduceGameState(state, { type: 'START_GAME' });

    // 门卫初始现金 560，尝试买 1000 的资产
    state = reduceGameState(state, { 
      type: 'BUY_ASSET', 
      payload: { playerId: 'p1', assetId: 'big_house', cost: 1000, passiveIncome: 500 } 
    });

    const player = state.players['p1'];
    expect(player.statement?.assets.cash).toBe(560); // 钱没扣
    expect(player.statement?.income.passiveIncome).toBe(0); // 没增加被动收入
  });

  it('当被动收入 >= 总支出时，游戏状态变为 FINISHED，触发财务自由 (模块 5)', () => {
    let state = reduceGameState(initialState, { type: 'JOIN_ROOM', payload: { playerId: 'p1', playerName: 'Alice' } });
    state = reduceGameState(state, { type: 'ASSIGN_JOB', payload: { playerId: 'p1', jobId: 'janitor' } });
    state = reduceGameState(state, { type: 'START_GAME' });

    // 门卫总支出是 900。目前没钱，我们先给他塞钱（模拟通过发工资或贷款拿到很多钱）
    const player = state.players['p1'];
    if (player.statement) player.statement.assets.cash = 10000;

    expect(state.status).toBe('PLAYING');

    // 买一个超级资产，被动收入 1000
    state = reduceGameState(state, { 
      type: 'BUY_ASSET', 
      payload: { playerId: 'p1', assetId: 'huge_business', cost: 5000, passiveIncome: 1000 } 
    });

    // 此时被动收入(1000) > 总支出(900)，游戏应该结束
    expect(state.status).toBe('FINISHED');
  });
});
