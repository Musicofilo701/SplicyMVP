
export interface OrderItem {
  id: string;
  price: number;
  name?: string;
}

export interface Order {
  table_id: string;
  items: OrderItem[];
  created_at?: string;
}

export interface Payment {
  table_id: string;
  amount: number;
  item_ids?: string[];
  customer_name?: string;
  created_at?: string;
}

export interface Restaurant {
  id: string;
  name: string;
  email: string;
  pos_system?: string;
  api_key: string;
  created_at?: string;
}
