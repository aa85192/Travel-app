export interface Settlement {
  from: string;
  to: string;
  amount: number;
}

export function calculateSettlement(balances: { [participantId: string]: number }): Settlement[] {
  const settlements: Settlement[] = [];
  
  // Separate debtors and creditors
  const debtors = Object.entries(balances)
    .filter(([_, balance]) => balance < -0.01)
    .map(([id, balance]) => ({ id, balance: Math.abs(balance) }))
    .sort((a, b) => b.balance - a.balance);

  const creditors = Object.entries(balances)
    .filter(([_, balance]) => balance > 0.01)
    .map(([id, balance]) => ({ id, balance }))
    .sort((a, b) => b.balance - a.balance);

  let i = 0;
  let j = 0;

  while (i < debtors.length && j < creditors.length) {
    const amount = Math.min(debtors[i].balance, creditors[j].balance);
    
    if (amount > 0.01) {
      settlements.push({
        from: debtors[i].id,
        to: creditors[j].id,
        amount: Number(amount.toFixed(2))
      });
    }

    debtors[i].balance -= amount;
    creditors[j].balance -= amount;

    if (debtors[i].balance < 0.01) i++;
    if (creditors[j].balance < 0.01) j++;
  }

  return settlements;
}
