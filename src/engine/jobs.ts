import { Job } from './types';

export const JOBS: Record<string, Job> = {
  janitor: {
    id: 'janitor',
    nameKey: 'jobs.janitor',
    initialStatement: {
      income: { salary: 1600, passiveIncome: 0 },
      expenses: { taxes: 280, homeMortgagePayment: 200, schoolLoanPayment: 0, carLoanPayment: 60, creditCardPayment: 60, otherExpenses: 300, childExpenses: 0 },
      assets: { cash: 560 }, // 初始储蓄
      liabilities: { homeMortgage: 20000, schoolLoans: 0, carLoans: 4000, creditCards: 2000, bankLoan: 0 },
      childrenCount: 0
    }
  },
  doctor: {
    id: 'doctor',
    nameKey: 'jobs.doctor',
    initialStatement: {
      income: { salary: 13200, passiveIncome: 0 },
      expenses: { taxes: 3420, homeMortgagePayment: 1900, schoolLoanPayment: 750, carLoanPayment: 380, creditCardPayment: 270, otherExpenses: 2880, childExpenses: 0 },
      assets: { cash: 3500 }, // 初始储蓄
      liabilities: { homeMortgage: 202000, schoolLoans: 150000, carLoans: 19000, creditCards: 9000, bankLoan: 0 },
      childrenCount: 0
    }
  }
};
