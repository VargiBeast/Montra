export interface RecurringPayment {
  id: string;
  user_id: string;
  description: string;
  amount: number;
  category: string | null;
  frequency: string;
  next_date: string;
  active: boolean;
  created_at: string;
}
