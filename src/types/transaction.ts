export type TransactionType = "in" | "out";

export interface Transaction {
  id: string;
  user_id: string;
  type: TransactionType;
  name: string;
  amount: number;
  date: string;
  method: string | null;
  link: string | null;
  note: string | null;
  image_url: string | null;
  created_at: string;
}

export interface TransactionInput {
  type: TransactionType;
  name: string;
  amount: number;
  date: string;
  method: string | null;
  link: string | null;
  note: string | null;
  image: File | null;
}

export interface BackupFile {
  app: "Saldo";
  version: number;
  exportedAt: string;
  transactions: Transaction[];
}