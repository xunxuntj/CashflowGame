export interface GameConfig {
  enableMovement: boolean;
  enableJobs: boolean;
  enableFinance: boolean;
  enableAssetTrade: boolean;
  enableVictoryCheck: boolean;
}

export interface FinancialStatement {
  income: { salary: number; passiveIncome: number };
  expenses: { taxes: number; homeMortgagePayment: number; schoolLoanPayment: number; carLoanPayment: number; creditCardPayment: number; otherExpenses: number; childExpenses: number };
  assets: { cash: number };
  liabilities: { homeMortgage: number; schoolLoans: number; carLoans: number; creditCards: number; bankLoan: number };
  childrenCount: number;
}

export interface Job {
  id: string;
  nameKey: string;
  initialStatement: FinancialStatement;
}

export interface Player {
  id: string;
  name: string;
  position: number; // 棋盘坐标
  jobId?: string; // 职业 ID
  statement?: FinancialStatement; // 财务报表
}

export interface GameState {
  roomId: string;
  status: 'WAITING' | 'PLAYING' | 'FINISHED';
  config: GameConfig;
  players: Record<string, Player>;
  playerOrder: string[]; // 决定回合顺序的数组
  currentPlayerIndex: number;
}

export type GameAction = 
  | { type: 'JOIN_ROOM'; payload: { playerId: string; playerName: string } }
  | { type: 'START_GAME' }
  | { type: 'ROLL_DICE'; payload: { playerId: string; diceValue: number } }
  | { type: 'ASSIGN_JOB'; payload: { playerId: string; jobId: string } }
  | { type: 'PAYDAY'; payload: { playerId: string } }
  | { type: 'ADD_LIABILITY'; payload: { playerId: string; liabilityType: keyof FinancialStatement['liabilities']; amount: number; interest: number } }
  | { type: 'BUY_ASSET'; payload: { playerId: string; assetId: string; cost: number; passiveIncome: number } };
