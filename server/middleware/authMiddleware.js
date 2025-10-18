const jwt = require("jsonwebtoken");

const authMiddleware = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res
      .status(401)
      .json({ message: "Authentication token is required." });
  }

  const token = authHeader.split(" ")[1];

  try {
    const decodedToken = jwt.verify(token, process.env.JWT_SECRET);
    req.userData = { userId: decodedToken.userId, role: decodedToken.role };
    next();
  } catch (error) {
    res.status(401).json({ message: "Authentication failed. Invalid token." });
  }
};

const roleMiddleware = (roles) => (req, res, next) => {
  if (!roles.includes(req.userData.role)) {
    return res
      .status(403)
      .json({ message: "Access denied. You do not have the required role." });
  }
  next();
};

module.exports = { authMiddleware, roleMiddleware };