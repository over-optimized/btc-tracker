export interface Transaction {
  id: string;
  date: Date;
  exchange: string;
  type: string;
  usdAmount: number;
  btcAmount: number;
  price: number;
}
