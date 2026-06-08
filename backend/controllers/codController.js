import CodAvailability from "../models/CodAvailability.js"

// ── POST /api/cod/check ──────────────────────────────────────────────
// Body: { state, orderValue }
export const checkCodAvailability = async (req, res) => {
  try {
    const { state, orderValue = 0 } = req.body
    if (!state) return res.json({ success: false, message: "State is required." })

    const record = await CodAvailability.findOne({ state }).lean()
    if (!record || !record.enabled) {
      return res.json({ success: true, available: false })
    }

    let available = true
    let reason = null
    if (record.minOrderValue > 0 && orderValue < record.minOrderValue) {
      available = false
      reason = `Minimum order value for COD is ₹${record.minOrderValue}`
    }
    if (record.maxOrderValue > 0 && orderValue > record.maxOrderValue) {
      available = false
      reason = `Maximum order value for COD is ₹${record.maxOrderValue}`
    }

    res.json({ success: true, available, reason, minOrderValue: record.minOrderValue, maxOrderValue: record.maxOrderValue })
  } catch (err) {
    console.error("checkCodAvailability:", err)
    res.status(500).json({ success: false, message: err.message })
  }
}

// ── GET /api/cod/admin ────────────────────────────────────────────────
export const adminListCodSettings = async (req, res) => {
  try {
    const settings = await CodAvailability.find().sort({ state: 1 }).lean()
    res.json({ success: true, settings })
  } catch (err) {
    res.status(500).json({ success: false, message: err.message })
  }
}

// ── PUT /api/cod/admin/:state ─────────────────────────────────────────
export const adminUpdateCodSetting = async (req, res) => {
  try {
    const { state } = req.params
    const { enabled, minOrderValue, maxOrderValue } = req.body
    const record = await CodAvailability.findOneAndUpdate(
      { state },
      { enabled, minOrderValue: minOrderValue || 0, maxOrderValue: maxOrderValue || 0 },
      { upsert: true, new: true, runValidators: true }
    ).lean()
    res.json({ success: true, setting: record })
  } catch (err) {
    res.status(400).json({ success: false, message: err.message })
  }
}
