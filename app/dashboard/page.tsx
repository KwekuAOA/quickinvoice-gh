'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import { Order } from '@/lib/types'
import Link from 'next/link'

export default function Dashboard() {
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [user, setUser] = useState<any>(null)
  const router = useRouter()

  useEffect(() => {
    checkUser()
    fetchOrders()
  }, [])

  const checkUser = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      router.push('/')
    } else {
      setUser(user)
    }
  }

  const fetchOrders = async () => {
    try {
      const { data, error } = await supabase
        .from('orders')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) throw error
      setOrders(data || [])
    } catch (error) {
      console.error('Error fetching orders:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/')
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'paid': return 'bg-green-100 text-green-800'
      case 'delivered': return 'bg-blue-100 text-blue-800'
      default: return 'bg-yellow-100 text-yellow-800'
    }
  }

  const stats = {
    total: orders.length,
    unpaid: orders.filter(o => o.status === 'unpaid').length,
    paid: orders.filter(o => o.status === 'paid').length,
    revenue: orders.filter(o => o.status === 'paid').reduce((sum, o) => sum + Number(o.total), 0)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-green-600">QuickInvoice GH</h1>
          <button
            onClick={handleLogout}
            className="text-sm text-gray-600 hover:text-gray-900"
          >
            Logout
          </button>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <p className="text-gray-600 text-sm">Total Orders</p>
            <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <p className="text-gray-600 text-sm">Unpaid</p>
            <p className="text-2xl font-bold text-yellow-600">{stats.unpaid}</p>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <p className="text-gray-600 text-sm">Paid</p>
            <p className="text-2xl font-bold text-green-600">{stats.paid}</p>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <p className="text-gray-600 text-sm">Revenue</p>
            <p className="text-2xl font-bold text-gray-900">GH₵{stats.revenue.toFixed(2)}</p>
          </div>
        </div>

        {/* Create Order Button */}
        <div className="mb-6">
          <Link
            href="/orders/new"
            className="inline-block bg-green-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-green-700 transition"
          >
            + Create New Order
          </Link>
        </div>

        {/* Orders List */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">Recent Orders</h2>
          </div>

          {orders.length === 0 ? (
            <div className="p-12 text-center text-gray-500">
              <p className="text-lg mb-2">No orders yet</p>
              <p className="text-sm">Create your first order to get started!</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {orders.map((order) => (
                <Link
                  key={order.id}
                  href={`/orders/${order.id}`}
                  className="block p-6 hover:bg-gray-50 transition"
                >
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <span className="font-semibold text-gray-900">
                          {order.order_number}
                        </span>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(order.status)}`}>
                          {order.status.toUpperCase()}
                        </span>
                      </div>
                      <p className="text-gray-600">{order.customer_name}</p>
                      <p className="text-sm text-gray-500">{order.customer_phone}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-bold text-gray-900">GH₵{order.total}</p>
                      <p className="text-xs text-gray-500">
                        {new Date(order.created_at).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}