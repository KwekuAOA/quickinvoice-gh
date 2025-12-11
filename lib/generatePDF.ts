import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'
import { Order, User } from './types'

export const generateInvoicePDF = async (
  order: Order,
  user: User | null
): Promise<string> => {
  const doc = new jsPDF()

  // Check if user has premium subscription
  const isPremium = user?.subscription_tier === 'premium' && 
    user?.subscription_expires_at && 
    new Date(user.subscription_expires_at) > new Date()

 const primaryGreen: [number, number, number] = [34, 197, 94] // green-500
const darkGray: [number, number, number] = [31, 41, 55] // gray-800
const lightGray: [number, number, number] = [156, 163, 175] // gray-400

  // Header - Business Name
  doc.setFontSize(24)
  doc.setTextColor(primaryGreen[0], primaryGreen[1], primaryGreen[2])
  
  if (isPremium && user?.business_name) {
    doc.text(user.business_name, 20, 25)
  } else {
    doc.text('QuickInvoice GH', 20, 25)
  }

  // Invoice Number and Date
  doc.setFontSize(10)
  doc.setTextColor(darkGray[0], darkGray[1], darkGray[2])
  doc.text(`Invoice: ${order.order_number}`, 20, 35)
  doc.text(`Date: ${new Date(order.created_at).toLocaleDateString()}`, 20, 40)

  // Status Badge
  doc.setFontSize(12)
  if (order.status === 'paid') {
    doc.setTextColor(34, 197, 94) // green
    doc.text('PAID', 170, 35)
  } else if (order.status === 'delivered') {
    doc.setTextColor(59, 130, 246) // blue
    doc.text('DELIVERED', 160, 35)
  } else {
    doc.setTextColor(234, 179, 8) // yellow
    doc.text('UNPAID', 165, 35)
  }

  // Divider Line
  doc.setDrawColor(lightGray[0], lightGray[1], lightGray[2])
  doc.line(20, 45, 190, 45)

  // Customer Details
  doc.setFontSize(11)
  doc.setTextColor(darkGray[0], darkGray[1], darkGray[2])
  doc.text('Bill To:', 20, 55)
  doc.setFontSize(10)
  doc.text(order.customer_name, 20, 62)
  doc.text(order.customer_phone, 20, 68)

  // Seller Details (if premium)
  if (isPremium && user?.phone) {
    doc.setFontSize(11)
    doc.text('From:', 130, 55)
    doc.setFontSize(10)
    doc.text(user.business_name || 'My Business', 130, 62)
    doc.text(user.phone, 130, 68)
    if (user.momo_number) {
      doc.text(`MoMo: ${user.momo_number}`, 130, 74)
    }
  }

  // Items Table
  const tableData = order.items.map(item => [
    item.name,
    item.quantity.toString(),
    `GH₵${item.price.toFixed(2)}`,
    `GH₵${(item.quantity * item.price).toFixed(2)}`
  ])

  autoTable(doc, {
    startY: 85,
    head: [['Item', 'Qty', 'Price', 'Total']],
    body: tableData,
    theme: 'striped',
    headStyles: {
      fillColor: primaryGreen,
      textColor: [255, 255, 255],
      fontSize: 10,
      fontStyle: 'bold'
    },
    bodyStyles: {
      fontSize: 9,
      textColor: darkGray
    },
    columnStyles: {
      0: { cellWidth: 80 },
      1: { cellWidth: 30, halign: 'center' },
      2: { cellWidth: 40, halign: 'right' },
      3: { cellWidth: 40, halign: 'right' }
    }
  })

  // Get final Y position after table
  const finalY = (doc as any).lastAutoTable.finalY + 10

  // Summary Section
  doc.setFontSize(10)
  doc.text('Subtotal:', 130, finalY)
  doc.text(`GH₵${order.subtotal.toFixed(2)}`, 170, finalY, { align: 'right' })

  if (order.delivery_fee > 0) {
    doc.text('Delivery Fee:', 130, finalY + 7)
    doc.text(`GH₵${order.delivery_fee.toFixed(2)}`, 170, finalY + 7, { align: 'right' })
  }

  // Total
  doc.setFontSize(12)
  doc.setFont('helvetica', 'bold')
  const totalY = order.delivery_fee > 0 ? finalY + 14 : finalY + 7
  doc.line(130, totalY - 2, 190, totalY - 2)
  doc.text('TOTAL:', 130, totalY + 5)
  doc.text(`GH₵${order.total.toFixed(2)}`, 170, totalY + 5, { align: 'right' })

  // Notes
  if (order.notes) {
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(9)
    doc.setTextColor(lightGray[0], lightGray[1], lightGray[2])
    doc.text('Notes:', 20, totalY + 20)
    doc.setTextColor(darkGray[0], darkGray[1], darkGray[2])
    const splitNotes = doc.splitTextToSize(order.notes, 170)
    doc.text(splitNotes, 20, totalY + 26)
  }

  // Footer
  doc.setFontSize(8)
  doc.setTextColor(lightGray[0], lightGray[1], lightGray[2])
  
  if (!isPremium) {
    // Watermark for free users
    doc.text('Created with QuickInvoice GH', 105, 285, { align: 'center' })
  }
  
  doc.text(`Generated on ${new Date().toLocaleString()}`, 105, 290, { align: 'center' })

  // Convert to data URL
  const pdfDataUrl = doc.output('dataurlstring')
  return pdfDataUrl
}