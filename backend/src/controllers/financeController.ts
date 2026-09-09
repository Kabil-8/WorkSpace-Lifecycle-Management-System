import { Response } from 'express'
import { FeeAccount, FeeStructure } from '../models/Finance.js'
import User from '../models/User.js'
import { eventBus, Events } from '../events/eventBus.js'
import { logger } from '../config/logger.js'
import crypto from 'crypto'

export class FinanceController {
  /**
   * Get fee account for a student (student gets own, admin/parent gets by studentId)
   */
  static async getStudentFeeAccount(req: any, res: Response) {
    try {
      let studentId = req.user._id.toString()

      // Admin/faculty/parent can query for specific student
      if (req.params.studentId && ['admin', 'super_admin', 'parent', 'placement_officer'].includes(req.user.role)) {
        studentId = req.params.studentId
      }

      const accounts = await FeeAccount.find({ studentId })
        .sort({ academicYear: -1, semester: -1 })
        .lean()

      const student = await User.findById(studentId).select('name rollNumber department semester').lean()

      return res.json({ success: true, data: { student, accounts } })
    } catch (err: any) {
      return res.status(500).json({ success: false, message: err.message })
    }
  }

  /**
   * Get fee structure for given academic year and semester
   */
  static async getFeeStructure(req: any, res: Response) {
    try {
      const { academicYear, semester, department } = req.query
      const filter: any = { isActive: true }
      if (academicYear) filter.academicYear = academicYear
      if (semester) filter.semester = parseInt(semester as string)
      if (department) filter.department = { $in: [department, 'All Departments'] }

      const structures = await FeeStructure.find(filter).lean()
      return res.json({ success: true, data: structures })
    } catch (err: any) {
      return res.status(500).json({ success: false, message: err.message })
    }
  }

  /**
   * Admin: create fee structure for a semester
   */
  static async createFeeStructure(req: any, res: Response) {
    try {
      const structure = await FeeStructure.create(req.body)
      return res.status(201).json({ success: true, data: structure })
    } catch (err: any) {
      return res.status(500).json({ success: false, message: err.message })
    }
  }

  /**
   * Admin: create fee account for a student
   */
  static async createFeeAccount(req: any, res: Response) {
    try {
      const { studentId, academicYear, semester, totalDue, dueDate } = req.body
      const account = await FeeAccount.create({ studentId, academicYear, semester, totalDue, dueDate })

      // Notify student
      const student = await User.findById(studentId).select('name').lean()
      eventBus.emit(Events.FEE_DUE, {
        userId: studentId,
        amount: totalDue,
        dueDate,
        studentName: (student as any)?.name,
      })

      return res.status(201).json({ success: true, data: account })
    } catch (err: any) {
      return res.status(500).json({ success: false, message: err.message })
    }
  }

  /**
   * Admin: record manual payment (cash/DD/offline)
   */
  static async recordPayment(req: any, res: Response) {
    try {
      const { accountId } = req.params
      const { amount, method, transactionId, notes } = req.body

      const account = await FeeAccount.findById(accountId)
      if (!account) return res.status(404).json({ success: false, message: 'Fee account not found.' })

      const receiptNumber = `RCPT-${Date.now()}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`
      account.payments.push({ amount, method: method || 'cash', transactionId, receiptNumber, notes, paidAt: new Date() })
      account.totalPaid += amount
      await account.save() // pre-save hook computes totalPending + status

      logger.info({ accountId, amount, method }, '[FinanceController] Payment recorded')
      return res.json({ success: true, message: 'Payment recorded.', receiptNumber, data: account })
    } catch (err: any) {
      return res.status(500).json({ success: false, message: err.message })
    }
  }

  /**
   * Initiate Razorpay order for online payment
   * Server-side order creation — amount and description come from DB, not client
   */
  static async initRazorpayOrder(req: any, res: Response) {
    try {
      const { accountId } = req.params
      const account = await FeeAccount.findById(accountId)
      if (!account) return res.status(404).json({ success: false, message: 'Fee account not found.' })
      if (account.totalPending <= 0) return res.status(400).json({ success: false, message: 'No pending fees.' })

      const RAZORPAY_KEY_ID = process.env.RAZORPAY_KEY_ID
      const RAZORPAY_KEY_SECRET = process.env.RAZORPAY_KEY_SECRET

      if (!RAZORPAY_KEY_ID || !RAZORPAY_KEY_SECRET) {
        return res.status(503).json({
          success: false,
          message: 'Payment gateway not configured. Please contact admin.',
        })
      }

      // Create Razorpay order via API
      const orderData = {
        amount: Math.round(account.totalPending * 100), // amount in paise
        currency: 'INR',
        receipt: `receipt_${accountId}_${Date.now()}`,
        notes: {
          studentId: account.studentId.toString(),
          semester: account.semester,
          academicYear: account.academicYear,
        },
      }

      const response = await fetch('https://api.razorpay.com/v1/orders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Basic ${Buffer.from(`${RAZORPAY_KEY_ID}:${RAZORPAY_KEY_SECRET}`).toString('base64')}`,
        },
        body: JSON.stringify(orderData),
      })

      if (!response.ok) {
        const errText = await response.text()
        logger.error({ err: errText }, '[FinanceController] Razorpay order creation failed')
        return res.status(502).json({ success: false, message: 'Payment gateway error.' })
      }

      const order: any = await response.json()

      return res.json({
        success: true,
        data: {
          orderId: order.id,
          amount: account.totalPending,
          currency: 'INR',
          keyId: RAZORPAY_KEY_ID,
          accountId: account._id,
        },
      })
    } catch (err: any) {
      return res.status(500).json({ success: false, message: err.message })
    }
  }

  /**
   * Verify Razorpay payment signature (server-side HMAC validation)
   */
  static async verifyRazorpayPayment(req: any, res: Response) {
    try {
      const { razorpay_order_id, razorpay_payment_id, razorpay_signature, accountId } = req.body

      const RAZORPAY_KEY_SECRET = process.env.RAZORPAY_KEY_SECRET
      if (!RAZORPAY_KEY_SECRET) {
        return res.status(503).json({ success: false, message: 'Payment gateway not configured.' })
      }

      // Verify HMAC signature
      const expectedSignature = crypto
        .createHmac('sha256', RAZORPAY_KEY_SECRET)
        .update(`${razorpay_order_id}|${razorpay_payment_id}`)
        .digest('hex')

      if (expectedSignature !== razorpay_signature) {
        logger.warn({ razorpay_order_id }, '[FinanceController] Payment signature verification FAILED')
        return res.status(400).json({ success: false, message: 'Payment verification failed. Signature mismatch.' })
      }

      // Record verified payment
      const account = await FeeAccount.findById(accountId)
      if (!account) return res.status(404).json({ success: false, message: 'Fee account not found.' })

      const receiptNumber = `RCPT-RZP-${razorpay_payment_id.slice(-6).toUpperCase()}`
      account.payments.push({
        amount: account.totalPending,
        method: 'online',
        transactionId: razorpay_payment_id,
        razorpayOrderId: razorpay_order_id,
        razorpayPaymentId: razorpay_payment_id,
        receiptNumber,
        paidAt: new Date(),
      })
      account.totalPaid += account.totalPending
      await account.save()

      eventBus.emit(Events.FEE_PAID, {
        userId: account.studentId.toString(),
        amount: account.totalPaid,
        paymentId: razorpay_payment_id,
      })

      logger.info({ accountId, paymentId: razorpay_payment_id }, '[FinanceController] Razorpay payment verified and recorded')
      return res.json({ success: true, message: 'Payment verified and recorded!', receiptNumber })
    } catch (err: any) {
      return res.status(500).json({ success: false, message: err.message })
    }
  }

  /**
   * Admin: fee collection overview
   */
  static async getCollectionStats(req: any, res: Response) {
    try {
      const { academicYear } = req.query
      const filter: any = {}
      if (academicYear) filter.academicYear = academicYear

      const stats = await FeeAccount.aggregate([
        { $match: filter },
        {
          $group: {
            _id: '$status',
            count: { $sum: 1 },
            totalDue: { $sum: '$totalDue' },
            totalPaid: { $sum: '$totalPaid' },
            totalPending: { $sum: '$totalPending' },
          },
        },
      ])

      const totals = stats.reduce(
        (acc, s) => ({
          totalDue: acc.totalDue + s.totalDue,
          totalPaid: acc.totalPaid + s.totalPaid,
          totalPending: acc.totalPending + s.totalPending,
          totalAccounts: acc.totalAccounts + s.count,
        }),
        { totalDue: 0, totalPaid: 0, totalPending: 0, totalAccounts: 0 }
      )

      return res.json({ success: true, data: { byStatus: stats, totals } })
    } catch (err: any) {
      return res.status(500).json({ success: false, message: err.message })
    }
  }
}
