export interface User {
  id: string
  email: string
  phone?: string
  business_name?: string
  business_logo_url?: string
  subscription_tier: 'free' | 'premium'
  subscription_expires_at?: string
  momo_number?: string
  created_at: string
}

export interface Order {
  id: string
  user_id: string
  order_number: string
  customer_name: string
  customer_phone: string
  items: OrderItem[]
  subtotal: number
  delivery_fee: number
  total: number
  status: 'unpaid' | 'paid' | 'delivered'
  payment_method?: string
  notes?: string
  invoice_url?: string
  created_at: string
  updated_at: string
}

export interface OrderItem {
  name: string
  quantity: number
  price: number
}