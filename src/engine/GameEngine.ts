import { GameState, GameAction, GameConfig, Player } from './types';
import { JOBS } from './jobs';

// 默认配置
export const DEFAULT_CONFIG: GameConfig = {
  enableMovement: true,
  enableJobs: true,
  enableFinance: true,
  enableAssetTrade: true,
  enableVictoryCheck: true,
};

// 棋盘大小（大富翁通常是 40 格，或者现金流分为内外圈，我们暂定一个 24 格单圈用于测试）
export const BOARD_SIZE = 24;

export function reduceGameState(state: GameState, action: GameAction): GameState {
  // 我们使用不可变数据模式，每次返回一个新的 state 对象
  const nextState = { ...state };

  switch (action.type) {
    case 'JOIN_ROOM': {
      if (state.status !== 'WAITING') return state;
      const { playerId, playerName } = action.payload;
      if (!nextState.players[playerId]) {
        nextState.players = {
          ...nextState.players,
          [playerId]: { id: playerId, name: playerName, position: 0 }
        };
        nextState.playerOrder = [...nextState.playerOrder, playerId];
      }
      break;
    }
    
    case 'START_GAME': {
      if (state.status === 'WAITING' && nextState.playerOrder.length > 0) {
        nextState.status = 'PLAYING';
      }
      break;
    }

    case 'ASSIGN_JOB': {
      if (state.status !== 'WAITING') return state; // 只能在开局前分配职业
      if (!state.config.enableJobs) return state;

      const { playerId, jobId } = action.payload;
      const player = state.players[playerId];
      if (!player) return state;

      const job = JOBS[jobId];
      if (!job) return state;

      // 深度拷贝以防污染原始数据
      nextState.players = {
        ...nextState.players,
        [playerId]: {
          ...player,
          jobId: job.id,
          statement: JSON.parse(JSON.stringify(job.initialStatement))
        }
      };
      break;
    }

    case 'ROLL_DICE': {
      if (state.status !== 'PLAYING') return state;
      if (!state.config.enableMovement) return state;

      const { playerId, diceValue } = action.payload;
      const currentPlayerId = state.playerOrder[state.currentPlayerIndex];
      
      // 必须是当前回合的玩家才能掷骰子
      if (playerId !== currentPlayerId) return state;

      const player = { ...state.players[playerId] };
      const previousPosition = player.position;
      
      // 更新坐标并处理循环（绕过起点）
      player.position = (previousPosition + diceValue) % BOARD_SIZE;

      // TODO: 检测是否越过起点 (PASS_START) 触发发工资等逻辑
      // if (previousPosition + diceValue >= BOARD_SIZE) { ... }

      nextState.players = {
        ...nextState.players,
        [playerId]: player
      };

      // 切换到下一个玩家
      nextState.currentPlayerIndex = (state.currentPlayerIndex + 1) % state.playerOrder.length;
      break;
    }

    case 'PAYDAY': {
      if (!state.config.enableFinance) return state;
      const { playerId } = action.payload;
      const player = state.players[playerId];
      if (!player || !player.statement) return state;

      // 月现金流 = (工资 + 被动收入) - (总支出)
      const { income, expenses } = player.statement;
      const totalIncome = income.salary + income.passiveIncome;
      const totalExpenses = Object.values(expenses).reduce((sum, val) => sum + val, 0);
      const cashflow = totalIncome - totalExpenses;

      nextState.players = {
        ...nextState.players,
        [playerId]: {
          ...player,
          statement: {
            ...player.statement,
            assets: {
              ...player.statement.assets,
              cash: player.statement.assets.cash + cashflow
            }
          }
        }
      };
      break;
    }

    case 'ADD_LIABILITY': {
      if (!state.config.enableFinance) return state;
      const { playerId, liabilityType, amount, interest } = action.payload;
      const player = state.players[playerId];
      if (!player || !player.statement) return state;

      // 增加负债金额，同时将利息加入到支出中 (暂时简单加在 bankLoan 和 otherExpenses 上，或对应利息字段)
      // 为简化，大富翁里如果是贷款，固定增加银行贷款负债，并增加每月利息支出
      nextState.players = {
        ...nextState.players,
        [playerId]: {
          ...player,
          statement: {
            ...player.statement,
            liabilities: {
              ...player.statement.liabilities,
              [liabilityType]: player.statement.liabilities[liabilityType] + amount
            },
            expenses: {
              ...player.statement.expenses,
              otherExpenses: player.statement.expenses.otherExpenses + interest // 暂时将利息加在其他支出上
            },
            assets: {
               ...player.statement.assets,
               cash: player.statement.assets.cash + amount // 贷款获得现金
            }
          }
        }
      };
      break;
    }
    case 'BUY_ASSET': {
      if (!state.config.enableAssetTrade) return state;
      const { playerId, assetId, cost, passiveIncome } = action.payload;
      const player = state.players[playerId];
      if (!player || !player.statement) return state;

      // 如果现金不足，返回错误或者不变的状态 (为了测试，我们这里简单拒绝购买)
      if (player.statement.assets.cash < cost) {
        // 现实中可以抛出事件或存入 error log，这里直接 return state 阻断操作
        return state; 
      }

      nextState.players = {
        ...nextState.players,
        [playerId]: {
          ...player,
          statement: {
            ...player.statement,
            assets: {
              ...player.statement.assets,
              cash: player.statement.assets.cash - cost // 扣除现金
            },
            income: {
              ...player.statement.income,
              passiveIncome: player.statement.income.passiveIncome + passiveIncome // 增加被动收入
            }
          }
        }
      };
      break;
    }
  }

  // 统一进行胜利条件检测 (模块 5)
  if (nextState.config.enableVictoryCheck) {
    for (const playerId of Object.keys(nextState.players)) {
      const player = nextState.players[playerId];
      if (player.statement) {
        const totalExpenses = Object.values(player.statement.expenses).reduce((sum, val) => sum + val, 0);
        // 如果被动收入 大于等于 总支出，且游戏没结束，则游戏结束（玩家财务自由）
        if (player.statement.income.passiveIncome >= totalExpenses && nextState.status !== 'FINISHED') {
          nextState.status = 'FINISHED';
          // 现实中还可以记录谁赢了，这里简化为全局结束
        }
      }
    }
  }

  return nextState;
}
