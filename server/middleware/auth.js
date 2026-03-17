const jwt = require("jsonwebtoken");
const User = require("../models/User");

async function auth(req, res, next) {
  const header = req.headers.authorization || "";
  const [scheme, token] = header.split(" ");

  if (scheme !== "Bearer" || !token) {
    return res.status(401).json({ message: "Unauthorized: token missing" });
  }

  const jwtSecret = process.env.JWT_SECRET;
  if (!jwtSecret) {
    return res.status(500).json({ message: "JWT secret is not configured" });
  }

  try {
    const decoded = jwt.verify(token, jwtSecret);
    const user = await User.findById(decoded.userId).select("_id email");

    if (!user) {
      return res.status(401).json({ message: "User not found" });
    }

    req.user = { userId: user._id.toString(), email: user.email };
    next();
  } catch {
    return res.status(401).json({ message: "Invalid token" });
  }
}

module.exports = auth;
