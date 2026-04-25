require("dotenv").config();
const express = require("express");
const cors = require("cors");
const PORT = process.env.PORT || 4000;
const app = express();
app.use(
  cors({
    origin: process.env.FRONTEND_URL,
    credentials: true,
  })
);
app.use(express.json());

const authRoutes = require("./routes/auth");
const vaultRoutes = require("./routes/vault");

app.use("/", authRoutes);        // /login, /register
app.use("/vault", vaultRoutes);  // vault APIs

app.listen(PORT, () => {
  console.log("Server running on 4000");
});