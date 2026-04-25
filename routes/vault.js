const express = require("express");
const router = express.Router();

const pool = require("../db");
const auth = require("../middleware/auth");
const { encrypt, decrypt } = require("../utils/crypto");

// GET vault items
router.get("/", auth, async (req, res) => {
  try {
    const result = await pool.query(
      "SELECT * FROM vault WHERE user_id=$1 ORDER BY id DESC",
      [req.user.id]
    );

    const now = Date.now();

    const data = await Promise.all(
      result.rows.map(async (item) => {
        const unlockMs = new Date(item.unlock_time).getTime();
        const isRecurring = item.lock_days !== null;

        // Specific time: unlock once and stay open forever
        if (!isRecurring) {
          if (now >= unlockMs) {
            return {
              ...item,
              password: decrypt(item.password,req.user.id),
              unlocked: true,
            };
          }

          return {
            ...item,
            password: null,
            unlocked: false,
          };
        }

        // Recurring safety check
        if (!item.open_minutes) {
          return {
            ...item,
            password: null,
            unlocked: false,
          };
        }

        const closeMs = unlockMs + item.open_minutes * 60 * 1000;

        // Recurring: currently inside open window
        if (now >= unlockMs && now <= closeMs) {
          return {
            ...item,
            password: decrypt(item.password,req.user.id),
            unlocked: true,
          };
        }

        // Recurring: window expired, schedule next unlock
        if (now > closeMs) {
          const nextUnlock = new Date(unlockMs);
          nextUnlock.setDate(nextUnlock.getDate() + Number(item.lock_days));

          await pool.query(
            "UPDATE vault SET unlock_time=$1 WHERE id=$2 AND user_id=$3",
            [nextUnlock.toISOString(), item.id, req.user.id]
          );

          return {
            ...item,
            unlock_time: nextUnlock.toISOString(),
            password: null,
            unlocked: false,
          };
        }

        // Recurring: not opened yet
        return {
          ...item,
          password: null,
          unlocked: false,
        };
      })
    );

    res.json(data);
  } catch (err) {
    console.error("GET /vault error:", err);
    res.status(500).json({ error: "Failed to load vault" });
  }
});

// ADD vault item
router.post("/", auth, async (req, res) => {
  try {
    const { title, password, unlockTime, lockDays, openMinutes } = req.body;

    const finalLockDays = lockDays ? Number(lockDays) : null;
    const finalOpenMinutes = finalLockDays ? Number(openMinutes) : null;

    await pool.query(
      `
      INSERT INTO vault 
      (title, password, unlock_time, lock_days, open_minutes, user_id)
      VALUES ($1, $2, $3, $4, $5, $6)
      `,
      [
        title,
        encrypt(password,req.user.id),
        unlockTime,
        finalLockDays,
        finalOpenMinutes,
        req.user.id,
      ]
    );

    res.json({ success: true });
  } catch (err) {
    console.error("POST /vault error:", err);
    res.status(500).json({ error: "Failed to add vault item" });
  }
});

// DELETE vault item
router.delete("/:id", auth, async (req, res) => {
  try {
    await pool.query(
      "DELETE FROM vault WHERE id=$1 AND user_id=$2",
      [req.params.id, req.user.id]
    );

    res.json({ success: true });
  } catch (err) {
    console.error("DELETE /vault error:", err);
    res.status(500).json({ error: "Failed to delete vault item" });
  }
});

module.exports = router;