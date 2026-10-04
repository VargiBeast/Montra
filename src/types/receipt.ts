export type ReceiptStatus = "pending" | "reviewed" | "confirmed" | "rejected";

export interface Receipt {
  id: string;
  user_id: string;
  image_path: string;
  merchant: string | null;
  total_amount: number | null;
  currency: string;
  receipt_date: string | null;
  status: ReceiptStatus;
  created_at: string;
  updated_at: string;
}
