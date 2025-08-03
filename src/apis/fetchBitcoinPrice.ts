export const fetchBitcoinPrice = async () => {
  try {
    const response = await fetch(
      'https://api.coingecko.com/api/v3/simple/price?ids=bitcoin&vs_currencies=usd',
    );
    const data = await response.json();
    return data.bitcoin.usd; // Return the current price in USD
  } catch (error) {
    console.error('Error fetching Bitcoin price:', error);
  }
};
