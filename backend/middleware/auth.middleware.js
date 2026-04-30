import jwt from 'jsonwebtoken';
import User from '../models/user.model.js';

function extractToken(req) {
  const auth = req.headers.authorization;
  if (auth?.startsWith('Bearer ')) return auth.slice(7);
  return req.cookies?.token || null;
}

export const protect = (roles = []) => async (req, res, next) => {
  try {
    const token = extractToken(req);
    if (!token) return res.status(401).json({ message: 'Non authentifié' });

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id).select('-password');

    if (!user) return res.status(401).json({ message: 'Utilisateur introuvable' });

    if (roles.length > 0 && !roles.includes(user.role)) {
      return res.status(403).json({ message: 'Accès refusé' });
    }

    req.user = user;
    next();
  } catch (err) {
    if (err?.name === 'TokenExpiredError') {
      return res.status(401).json({ message: 'Token expiré' });
    }
    return res.status(401).json({ message: 'Token invalide' });
  }
};
