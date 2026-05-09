// ─────────────────────────────────────────────────────────────────────
//  backend/middleware/auth.js
//
//  Accepts the token from EITHER header format:
//    1. Authorization: Bearer <token>   ← cartSlice.js / modern pattern
//    2. token: <token>                  ← legacy pattern used elsewhere
//
//  Sets req.userId (string) for use in controllers via getUserId().
//  Compatible with both req.user._id and req.userId patterns.
// ─────────────────────────────────────────────────────────────────────
import jwt from "jsonwebtoken";

const authUser = async (req, res, next) => {
  try {
    // ── 1. Extract token from whichever header is present ─────────────
    let token = null;

    const authHeader = req.headers["authorization"] || req.headers["Authorization"];
    if (authHeader && authHeader.startsWith("Bearer ")) {
      // Modern pattern: Authorization: Bearer <token>
      token = authHeader.slice(7).trim();
    } else if (req.headers["token"]) {
      // Legacy pattern: token: <token>
      token = req.headers["token"];
    }

    if (!token) {
      return res.status(401).json({
        success: false,
        message: "Not Authorized. Login Again",
      });
    }

    // ── 2. Verify ──────────────────────────────────────────────────────
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // ── 3. Attach to request ───────────────────────────────────────────
    // Support both { id } and { _id } payloads depending on how you sign tokens
    const userId = decoded.id ?? decoded._id ?? decoded.userId;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Invalid token payload. Login Again",
      });
    }

    // Set BOTH patterns so all controllers work regardless of which they read
    req.userId    = userId;
    req.user      = { _id: userId, id: userId };

    next();
  } catch (err) {
    console.error("authUser middleware:", err.message);
    return res.status(401).json({
      success: false,
      message: "Not Authorized. Login Again",
    });
  }
};

export default authUser;