import { describe, it, expect, beforeEach } from 'vitest';
import { reduceGameState, DEFAULT_CONFIG } from '../GameEngine';
import { GameState } from '../types';
import { JOBS } from '../jobs';

describe('GameEngine - Jobs & Finance (模块 2 & 3)', () => {
  let initialState: GameState;

  beforeEach(() => {
    initialState = {
      roomId: 'room2',
      status: 'WAITING',
      config: { ...DEFAULT_CONFIG, enableJobs: true, enableFinance: true },
      players: {},
      playerOrder: [],
      currentPlayerIndex: 0
    };
  });

  it('应该能正确分配职业并初始化财务报表 (模块 2)', () => {
    let state = reduceGameState(initialState, { type: 'JOIN_ROOM', payload: { playerId: 'p1', playerName: 'Alice' } });
    state = reduceGameState(state, { type: 'ASSIGN_JOB', payload: { playerId: 'p1', jobId: 'doctor' } });

    const player = state.players['p1'];
    expect(player.jobId).toBe('doctor');
    expect(player.statement).toBeDefined();
    expect(player.statement?.income.salary).toBe(13200);
    expect(player.statement?.assets.cash).toBe(3500); // 医生的初始存款
  });

  it('PAYDAY 应该正确计算现金流并增加现金 (模块 3)', () => {
    let state = reduceGameState(initialState, { type: 'JOIN_ROOM', payload: { playerId: 'p1', playerName: 'Alice' } });
    state = reduceGameState(state, { type: 'ASSIGN_JOB', payload: { playerId: 'p1', jobId: 'janitor' } });
    
    // 门卫工资 1600, 支出 900(280+200+60+60+300), 现金流 = 700
    // 初始现金 560
    state = reduceGameState(state, { type: 'PAYDAY', payload: { playerId: 'p1' } });

    const player = state.players['p1'];
    // 560 + 700 = 1260
    expect(player.statement?.assets.cash).toBe(1260);
  });

  it('ADD_LIABILITY 应该增加负债、增加现金并扣除月现金流 (模块 3)', () => {
    let state = reduceGameState(initialState, { type: 'JOIN_ROOM', payload: { playerId: 'p1', playerName: 'Alice' } });
    state = reduceGameState(state, { type: 'ASSIGN_JOB', payload: { playerId: 'p1', jobId: 'janitor' } });

    // 贷款 1000，利息 100 (加到 otherExpenses)
    state = reduceGameState(state, { 
      type: 'ADD_LIABILITY', 
      payload: { playerId: 'p1', liabilityType: 'bankLoan', amount: 1000, interest: 100 } 
    });

    const player = state.players['p1'];
    expect(player.statement?.liabilities.bankLoan).toBe(1000); // 负债增加
    expect(player.statement?.assets.cash).toBe(560 + 1000); // 现金增加 (初始560 + 贷款1000)
    
    // 门卫其他支出原为 300，现在应该是 400
    expect(player.statement?.expenses.otherExpenses).toBe(400);

    // 再次发工资，现金流应该减少 100
    // 原现金流 700，现现金流 600
    // 发工资前现金 1560，发工资后应该是 1560 + 600 = 2160
    state = reduceGameState(state, { type: 'PAYDAY', payload: { playerId: 'p1' } });
    expect(state.players['p1'].statement?.assets.cash).toBe(2160);
  });
});
