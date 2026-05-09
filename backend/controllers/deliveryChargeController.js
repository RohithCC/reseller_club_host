// ─────────────────────────────────────────────────────────────────────
//  controllers/deliveryChargeController.js
// ─────────────────────────────────────────────────────────────────────
import DeliveryCharge from "../models/DeliveryCharge.js";

// ── POST /api/delivery/calculate ─────────────────────────────────────
// Body: { subtotal, weight?, pincode?, method? }
// Returns the best matching rule + computed charge.
export const calculateDelivery = async (req, res) => {
  try {
    const { subtotal, weight = 0, pincode = "", method = "standard" } = req.body;

    if (typeof subtotal !== "number") {
      return res.status(400).json({ success: false, message: "Cart subtotal is required." });
    }

    // Find active rules for the requested method, ordered by priority
    const rules = await DeliveryCharge.find({ method, isActive: true }).sort({ priority: 1 });

    if (rules.length === 0) {
      return res.status(404).json({
        success: false,
        message: `No delivery option available for method "${method}".`,
      });
    }

    // Pick first rule whose pincode filter matches (empty list = matches all)
    const matchingRule =
      rules.find(
        (r) =>
          r.applicablePincodes.length === 0 ||
          (pincode && r.applicablePincodes.includes(pincode))
      ) || rules[0];

    const computed = matchingRule.computeCharge({ subtotal, weight, pincode });

    res.json({
      success: true,
      rule: {
        id: matchingRule._id,
        name: matchingRule.name,
        method: matchingRule.method,
        freeAbove: matchingRule.freeAbove,
        charge: matchingRule.charge,
      },
      ...computed,
      amountToFreeDelivery: Math.max(matchingRule.freeAbove - subtotal, 0),
    });
  } catch (err) {
    console.error("calculateDelivery:", err);
    res.status(500).json({ success: false, message: "Failed to calculate delivery." });
  }
};

// ── GET /api/delivery/options ────────────────────────────────────────
// Lists all active delivery methods (e.g. for a "choose delivery" UI)
export const listDeliveryOptions = async (req, res) => {
  try {
    const options = await DeliveryCharge.find({ isActive: true })
      .sort({ priority: 1 })
      .lean();
    res.json({ success: true, options });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ── Admin CRUD ───────────────────────────────────────────────────────
export const createDeliveryCharge = async (req, res) => {
  try {
    const rule = await DeliveryCharge.create(req.body);
    res.status(201).json({ success: true, rule });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

export const updateDeliveryCharge = async (req, res) => {
  try {
    const rule = await DeliveryCharge.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });
    if (!rule) return res.status(404).json({ success: false, message: "Rule not found." });
    res.json({ success: true, rule });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

export const deleteDeliveryCharge = async (req, res) => {
  try {
    const rule = await DeliveryCharge.findByIdAndDelete(req.params.id);
    if (!rule) return res.status(404).json({ success: false, message: "Rule not found." });
    res.json({ success: true, message: "Deleted." });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};