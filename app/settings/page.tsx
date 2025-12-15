'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import { User } from '@/lib/types'

export default function Settings() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [user, setUser] = useState<User | null>(null)
  const [formData, setFormData] = useState({
    business_name: '',
    phone: '',
    momo_number: '',
    email: ''
  })

  useEffect(() => {
    fetchUser()
  }, [])

  const fetchUser = async () => {
    try {
      const { data: { user: authUser } } = await supabase.auth.getUser()
      if (!authUser) {
        router.push('/')
        return
      }

      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', authUser.id)
        .single()

      if (error) throw error
      
      setUser(data)
      setFormData({
        business_name: data.business_name || '',
        phone: data.phone || '',
        momo_number: data.momo_number || '',
        email: data.email || ''
      })
    } catch (error) {
      console.error('Error fetching user:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)

    try {
      const { data: { user: authUser } } = await supabase.auth.getUser()
      if (!authUser) throw new Error('Not authenticated')

      const { error } = await supabase
        .from('users')
        .update({
          business_name: formData.business_name,
          phone: formData.phone,
          momo_number: formData.momo_number,
          updated_at: new Date().toISOString()
        })
        .eq('id', authUser.id)

      if (error) throw error

      alert('Settings saved successfully!')
      fetchUser()
    } catch (error: any) {
      alert('Error saving settings: ' + error.message)
    } finally {
      setSaving(false)
    }
  }

  const isPremium = user?.subscription_tier === 'premium' && 
    user?.subscription_expires_at && 
    new Date(user.subscription_expires_at) > new Date()

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading settings...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-green-600">Settings</h1>
          <button
            onClick={() => router.push('/dashboard')}
            className="text-gray-600 hover:text-gray-900"
          >
            ← Back
          </button>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Subscription Status Card */}
        <div className={`mb-6 p-6 rounded-lg ${isPremium ? 'bg-green-50 border-2 border-green-200' : 'bg-yellow-50 border-2 border-yellow-200'}`}>
          <div className="flex justify-between items-start">
            <div>
              <h2 className="text-lg font-semibold text-gray-900 mb-2">
                {isPremium ? '✨ Premium Account' : '🆓 Free Account'}
              </h2>
              <p className="text-sm text-gray-600 mb-3">
                {isPremium 
                  ? `Active until ${new Date(user.subscription_expires_at!).toLocaleDateString()}`
                  : 'Upgrade to unlock custom branding on invoices'
                }
              </p>
              {!isPremium && (
                <ul className="text-sm text-gray-600 space-y-1 mb-4">
                  <li>✓ Custom business name & logo on invoices</li>
                  <li>✓ Remove "Created with QuickInvoice" watermark</li>
                  <li>✓ Priority support</li>
                  <li>✓ Unlimited orders</li>
                </ul>
              )}
            </div>
          </div>
          {!isPremium && (
            <button
              onClick={() => alert('Payment integration coming soon! Contact us for early access.')}
              className="bg-green-600 text-white px-6 py-2 rounded-lg font-semibold hover:bg-green-700 transition"
            >
              Upgrade to Premium - GH₵50/month
            </button>
          )}
        </div>

        {/* Settings Form */}
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-6">Business Information</h2>

          <form onSubmit={handleSave} className="space-y-6">
            {/* Email (Read-only) */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Email Address
              </label>
              <input
                type="email"
                value={formData.email}
                disabled
                className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-100 text-gray-600 cursor-not-allowed"
              />
              <p className="text-xs text-gray-500 mt-1">Email cannot be changed</p>
            </div>

            {/* Business Name */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Business Name {isPremium && '✨'}
              </label>
              <input
                type="text"
                value={formData.business_name}
                onChange={(e) => setFormData({ ...formData, business_name: e.target.value })}
                placeholder="My Business"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
              />
              {!isPremium && (
                <p className="text-xs text-yellow-600 mt-1">
                  ⚠️ Premium required to display on invoices
                </p>
              )}
            </div>

            {/* Phone Number */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Phone Number
              </label>
              <input
                type="tel"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                placeholder="0244123456"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
              />
              <p className="text-xs text-gray-500 mt-1">Will be displayed on invoices</p>
            </div>

            {/* MoMo Number */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Mobile Money Number
              </label>
              <input
                type="tel"
                value={formData.momo_number}
                onChange={(e) => setFormData({ ...formData, momo_number: e.target.value })}
                placeholder="0244123456"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
              />
              <p className="text-xs text-gray-500 mt-1">Customers will see this for payments</p>
            </div>

            {/* Save Button */}
            <button
              type="submit"
              disabled={saving}
              className="w-full bg-green-600 text-white py-3 rounded-lg font-semibold hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition"
            >
              {saving ? 'Saving...' : 'Save Settings'}
            </button>
          </form>
        </div>

        {/* Account Info */}
        <div className="mt-6 bg-white rounded-lg shadow-lg p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Account Information</h2>
          <div className="space-y-3 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-600">Account Type:</span>
              <span className="font-medium">{user?.subscription_tier?.toUpperCase()}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Member Since:</span>
              <span className="font-medium">
                {user?.created_at ? new Date(user.created_at).toLocaleDateString() : 'N/A'}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}