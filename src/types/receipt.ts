export interface Receipt {
  id: string;
  user_id: string;
  image_path: string;
  extracted_text: string | null;
  amount: number | null;
  merchant: string | null;
  date: string | null;
  transaction_id: string | null;
  created_at: string;
}
