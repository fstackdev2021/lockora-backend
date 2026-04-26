const express = require("express");
const router = express.Router();
const pool = require("../db");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");



// REGISTER
router.post("/register", async (req, res) => {
  const { username, password } = req.body;

  const hashed = await bcrypt.hash(password, 10);

  try {
    await pool.query(
      "INSERT INTO users (username, password) VALUES ($1, $2)",
      [username, hashed]
    );
    res.json({ message: "User created" });
  } catch {
    res.status(400).json({ error: "User exists" });
  }
});

// LOGIN
router.post("/login", async (req, res) => {
  const { username, password } = req.body;

  const result = await pool.query(
    "SELECT * FROM users WHERE username=$1",
    [username]
  );

  if (result.rows.length === 0)
    return res.status(401).json({ error: "Invalid user" });

  const user = result.rows[0];

  const match = await bcrypt.compare(password, user.password);
  if (!match)
    return res.status(401).json({ error: "Wrong password" });

  const token = jwt.sign({ id: user.id }, process.env.JWT_SECRET, {
    expiresIn: "15m",
  });


  res.json({
    token,
    user: {
      id: user.id,
      username: user.username,
    }
  });
});

module.exports = router;