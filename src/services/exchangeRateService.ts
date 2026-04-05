export async function fetchExchangeRates(baseCurrency: string = 'TWD') {
  try {
    const response = await fetch(`https://open.er-api.com/v6/latest/${baseCurrency}`);
    if (!response.ok) throw new Error('Failed to fetch exchange rates');
    const data = await response.json();
    return data.rates;
  } catch (error) {
    console.error('Error fetching exchange rates:', error);
    return null;
  }
}

export function convertCurrency(amount: number, fromRate: number, toRate: number) {
  // If rates are relative to same base, we can convert
  // amount * (toRate / fromRate)
  return amount * (toRate / fromRate);
}
