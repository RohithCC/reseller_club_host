import contactModel from '../models/contactModel.js'
import nodemailer   from 'nodemailer'

// ── Helper: send email ────────────────────────────────────────────────────────
const sendEmail = async ({ to, subject, html }) => {
  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,   // Gmail App Password
    },
  })
  await transporter.sendMail({ from: process.env.EMAIL_USER, to, subject, html })
}

// ─── SUBMIT CONTACT FORM ──────────────────────────────────────────────────────
// POST /api/contact/submit
// Body: { name, email, phone, subject, message }
const submitContact = async (req, res) => {
  try {
    const { name, email, phone, subject, message } = req.body

    // Validation
    if (!name || !email || !subject || !message)
      return res.json({ success: false, message: 'Name, email, subject and message are required.' })

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
      return res.json({ success: false, message: 'Please enter a valid email address.' })

    if (message.trim().length < 10)
      return res.json({ success: false, message: 'Message must be at least 10 characters.' })

    // Save to DB
    const contact = new contactModel({ name, email, phone, subject, message })
    await contact.save()

    // ── Email 1: Notify store owner ──────────────────────────────────────────
    await sendEmail({
      to:      process.env.EMAIL_USER,
      subject: `📩 New Contact: ${subject} — ${name}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 580px; margin: auto; border: 1px solid #e5e7eb; border-radius: 12px; overflow: hidden;">
          <div style="background: #1d4ed8; padding: 20px 28px;">
            <h2 style="color: #fff; margin: 0; font-size: 20px;">New Contact Form Submission</h2>
          </div>
          <div style="padding: 24px 28px;">
            <table style="width: 100%; border-collapse: collapse; font-size: 14px;">
              <tr><td style="padding: 8px 0; color: #6b7280; width: 110px;">Name</td>      <td style="padding: 8px 0; font-weight: bold; color: #111;">${name}</td></tr>
              <tr><td style="padding: 8px 0; color: #6b7280;">Email</td>     <td style="padding: 8px 0;"><a href="mailto:${email}" style="color:#1d4ed8;">${email}</a></td></tr>
              <tr><td style="padding: 8px 0; color: #6b7280;">Phone</td>     <td style="padding: 8px 0; color: #111;">${phone || '—'}</td></tr>
              <tr><td style="padding: 8px 0; color: #6b7280;">Subject</td>   <td style="padding: 8px 0; color: #111;">${subject}</td></tr>
            </table>
            <div style="background: #f9fafb; border-radius: 8px; padding: 16px; margin-top: 12px;">
              <p style="margin: 0; font-size: 14px; color: #374151; white-space: pre-wrap;">${message}</p>
            </div>
          </div>
          <div style="background: #f3f4f6; padding: 14px 28px; font-size: 12px; color: #9ca3af; text-align: center;">
            Amulya Electronics — Contact Form
          </div>
        </div>
      `,
    })

    // ── Email 2: Auto-reply to user ──────────────────────────────────────────
    await sendEmail({
      to:      email,
      subject: `We received your message — Amulya Electronics`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 580px; margin: auto; border: 1px solid #e5e7eb; border-radius: 12px; overflow: hidden;">
          <div style="background: #1d4ed8; padding: 20px 28px;">
            <h2 style="color: #fff; margin: 0; font-size: 20px;">Thanks for reaching out, ${name}!</h2>
          </div>
          <div style="padding: 24px 28px; font-size: 14px; color: #374151; line-height: 1.7;">
            <p>We've received your message and our team will get back to you within <strong>24 hours</strong>.</p>
            <p style="margin-top: 12px;"><strong>Your message:</strong></p>
            <div style="background: #f9fafb; border-left: 4px solid #1d4ed8; padding: 12px 16px; border-radius: 4px; color: #4b5563;">
              ${message}
            </div>
            <p style="margin-top: 20px;">Need urgent help? Chat with us on WhatsApp:<br/>
              <a href="https://wa.me/918310787546" style="color:#16a34a; font-weight:bold;">+91 83107 87546</a>
            </p>
          </div>
          <div style="background: #f3f4f6; padding: 14px 28px; font-size: 12px; color: #9ca3af; text-align: center;">
            Amulya Electronics, Dharwad – 580001 | Mon–Sun 9AM–8PM
          </div>
        </div>
      `,
    })

    res.json({ success: true, message: 'Message sent successfully! We\'ll reply within 24 hours.' })

  } catch (error) {
    console.log('Contact submit error:', error)
    res.json({ success: false, message: error.message })
  }
}

// ─── GET ALL CONTACTS (Admin) ─────────────────────────────────────────────────
// GET /api/contact/all
const getAllContacts = async (req, res) => {
  try {
    const contacts = await contactModel
      .find()
      .sort({ createdAt: -1 })   // newest first
    res.json({ success: true, contacts })
  } catch (error) {
    console.log(error)
    res.json({ success: false, message: error.message })
  }
}

// ─── UPDATE STATUS (Admin) ────────────────────────────────────────────────────
// PATCH /api/contact/:id/status
// Body: { status: 'read' | 'replied' }
const updateContactStatus = async (req, res) => {
  try {
    const { id }     = req.params
    const { status } = req.body

    if (!['new', 'read', 'replied'].includes(status))
      return res.json({ success: false, message: 'Invalid status value.' })

    await contactModel.findByIdAndUpdate(id, { status })
    res.json({ success: true, message: 'Status updated.' })
  } catch (error) {
    console.log(error)
    res.json({ success: false, message: error.message })
  }
}

export { submitContact, getAllContacts, updateContactStatus }
