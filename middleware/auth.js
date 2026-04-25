const jwt = require("jsonwebtoken");

module.exports = function (req, res, next) {
  const token = req.headers.authorization;
  if (!token) return res.sendStatus(401);

  try {
    const data = jwt.verify(token, process.env.JWT_SECRET);
    req.user = data;
    next();
  } catch {
    res.sendStatus(403);
  }
};