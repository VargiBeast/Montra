export interface Receipt {
  id: string;
  user_id: string;
  image_path: string;
  extracted_text: string | null;
  /** Prefer amount; fall back to total_amount from older schema */
  amount: number | null;
  total_amount?: number | null;
  merchant: string | null;
  date: string | null;
  receipt_date?: string | null;
  currency?: string | null;
  status?: string | null;
  transaction_id: string | null;
  created_at: string;
}
