import jwt from "jsonwebtoken";
import dotenv from 'dotenv';
dotenv.config();

const jwtAuth = (req, res, next) => {
  // Get token from Authorization header: "Bearer <token>"
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  // Extract token part after "Bearer "
  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded; // attach decoded payload to req.user
    next();
  } catch (error) {
    return res.status(403).json({ message: "Invalid token" });
  }
};

export default jwtAuth;
