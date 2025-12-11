"use client";

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter, useParams } from 'next/navigation'
import { Order, User } from '@/lib/types'
import { generateInvoicePDF } from '@/lib/generatePDF'

export default function OrderDetail() {
  const router = useRouter()
  const { id } = useParams() as { id: string }
  const [order, setOrder] = useState<Order | null>(null)
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [generating, setGenerating] = useState(false)

  useEffect(() => {
    if (!id) return;
    fetchOrder()
    fetchUser()
  }, [id])

  const fetchOrder = async () => {
    try {
      const { data, error } = await supabase
        .from('orders')
        .select('*')
        .eq('id', id)
        .single()

      if (error) throw error
      setOrder(data)
    } catch (error) {
      console.error('Error fetching order:', error)
      alert('Order not found')
      router.push('/dashboard')
    } finally {
      setLoading(false)
    }
  }

  const fetchUser = async () => {
    try {
      const { data: { user: authUser } } = await supabase.auth.getUser()
      if (!authUser) return

      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', authUser.id)
        .single()

      if (error) throw error
      setUser(data)
    } catch (error) {
      console.error('Error fetching user:', error)
    }
  }

  const updateStatus = async (newStatus: string) => {
    try {
      const { error } = await supabase
        .from('orders')
        .update({
          status: newStatus,
          updated_at: new Date().toISOString()
        })
        .eq('id', id)

      if (error) throw error
      setOrder(order ? { ...order, status: newStatus as any } : null)
    } catch (error: any) {
      alert('Error updating status: ' + error.message)
    }
  }

  const deleteOrder = async () => {
    if (!confirm('Are you sure you want to delete this order?')) return

    try {
      const { error } = await supabase
        .from('orders')
        .delete()
        .eq('id', id)

      if (error) throw error
      router.push('/dashboard')
    } catch (error: any) {
      alert('Error deleting order: ' + error.message)
    }
  }

  const generateAndSharePDF = async () => {
    if (!order) return
    
    setGenerating(true)
    try {
      const pdfDataUrl = await generateInvoicePDF(order, user)

      const { error } = await supabase
        .from('orders')
        .update({ invoice_url: pdfDataUrl })
        .eq('id', id)

      if (error) throw error

      const message = `*Invoice #${order.order_number}*

Hi ${order.customer_name},

Your invoice is ready! Total: GH₵${order.total}

View your invoice: ${window.location.origin}/orders/${order.id}

Thank you for your business!`

      const whatsappUrl = `https://wa.me/${order.customer_phone.replace(/\D/g, '')}?text=${encodeURIComponent(message)}`
      window.open(whatsappUrl, '_blank')
      window.open(pdfDataUrl, '_blank')

    } catch (error: any) {
      alert('Error generating invoice: ' + error.message)
    } finally {
      setGenerating(false)
    }
  }

  const downloadPDF = async () => {
    if (!order) return
    
    setGenerating(true)
    try {
      const pdfDataUrl = await generateInvoicePDF(order, user)

      const link = document.createElement('a')
      link.href = pdfDataUrl
      link.download = `${order.order_number}.pdf`
      link.click()

      await supabase
        .from('orders')
        .update({ invoice_url: pdfDataUrl })
        .eq('id', id)

    } catch (error: any) {
      alert('Error downloading invoice: ' + error.message)
    } finally {
      setGenerating(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading order...</p>
        </div>
      </div>
    )
  }

  if (!order) return null

  return (
    <div className="min-h-screen bg-gray-50">
      {<div className="min-h-screen bg-gray-50">
      <div className="max-w-3xl mx-auto px-4 py-8">
        <div className="mb-6">
          <button
            onClick={() => router.push('/dashboard')}
            className="text-green-600 hover:text-green-700 font-medium"
          >
            ← Back to Dashboard
          </button>
        </div>

        <div className="bg-white rounded-lg shadow-lg p-6">
          {/* Header */}
          <div className="flex justify-between items-start mb-6">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">{order.order_number}</h1>
              <p className="text-sm text-gray-500 mt-1">
                Created {new Date(order.created_at).toLocaleString()}
              </p>
            </div>
            <button
              onClick={deleteOrder}
              className="text-red-600 hover:text-red-700 text-sm font-medium"
            >
              Delete Order
            </button>
          </div>

          {/* Status Update */}
          <div className="mb-6 p-4 bg-gray-50 rounded-lg">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Order Status
            </label>
            <select
              value={order.status}
              onChange={(e) => updateStatus(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
            >
              <option value="unpaid">Unpaid</option>
              <option value="paid">Paid</option>
              <option value="delivered">Delivered</option>
            </select>
          </div>

          {/* Customer Info */}
          <div className="mb-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-3">Customer Details</h2>
            <div className="space-y-2">
              <p className="text-gray-700">
                <span className="font-medium">Name:</span> {order.customer_name}
              </p>
              <p className="text-gray-700">
                <span className="font-medium">Phone:</span> {order.customer_phone}
              </p>
            </div>
          </div>

          {/* Order Items */}
          <div className="mb-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-3">Order Items</h2>
            <div className="border border-gray-200 rounded-lg overflow-hidden">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">Item</th>
                    <th className="px-4 py-2 text-center text-sm font-medium text-gray-700">Qty</th>
                    <th className="px-4 py-2 text-right text-sm font-medium text-gray-700">Price</th>
                    <th className="px-4 py-2 text-right text-sm font-medium text-gray-700">Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {order.items.map((item, index) => (
                    <tr key={index}>
                      <td className="px-4 py-3 text-gray-900">{item.name}</td>
                      <td className="px-4 py-3 text-center text-gray-600">{item.quantity}</td>
                      <td className="px-4 py-3 text-right text-gray-600">GH₵{item.price.toFixed(2)}</td>
                      <td className="px-4 py-3 text-right text-gray-900 font-medium">
                        GH₵{(item.quantity * item.price).toFixed(2)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Order Summary */}
          <div className="border-t border-gray-200 pt-4 space-y-2 mb-6">
            <div className="flex justify-between text-gray-600">
              <span>Subtotal:</span>
              <span>GH₵{order.subtotal.toFixed(2)}</span>
            </div>
            {order.delivery_fee > 0 && (
              <div className="flex justify-between text-gray-600">
                <span>Delivery Fee:</span>
                <span>GH₵{order.delivery_fee.toFixed(2)}</span>
              </div>
            )}
            <div className="flex justify-between text-xl font-bold text-gray-900 pt-2 border-t border-gray-200">
              <span>Total:</span>
              <span>GH₵{order.total.toFixed(2)}</span>
            </div>
          </div>

          {/* Notes */}
          {order.notes && (
            <div className="mb-6 p-4 bg-yellow-50 rounded-lg">
              <h3 className="text-sm font-medium text-gray-700 mb-1">Notes</h3>
              <p className="text-gray-600">{order.notes}</p>
            </div>
          )}

          {/* Action Buttons */}
          <div className="space-y-3">
            <button
              onClick={generateAndSharePDF}
              disabled={generating}
              className="w-full bg-green-600 text-white py-3 rounded-lg font-semibold hover:bg-green-700 transition flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {generating ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                  Generating Invoice...
                </>
              ) : (
                <>
                  <span>📱</span>
                  Generate Invoice & Share via WhatsApp
                </>
              )}
            </button>

            <button
              onClick={downloadPDF}
              disabled={generating}
              className="w-full bg-gray-600 text-white py-3 rounded-lg font-semibold hover:bg-gray-700 transition flex items-center justify-center gap-2 disabled:opacity-50"
            >
              <span>📥</span>
              Download PDF Invoice
            </button>
          </div>
        </div>
      </div>
    </div>
  }
    </div>
)
}