const jwt = require("jsonwebtoken");

const JWT_SECRET = process.env.SUPABASE_JWT_SECRET;

const authenticateToken = (req, res, next) => {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];

  if (!token) {
    return res.status(401).json({
      error: "Access token required",
    });
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      console.error("JWT Verification failed", err.message);
      return res.status(403).json({
        error: "Invalid or expired token",
      });
    }
    req.user = user;
    next();
  });
};

module.exports =  authenticateToken;
