import express from "express";
import cors from "cors";
import dotenv from "dotenv";

dotenv.config();

import { query } from "./config/db.js";

const app = express();
const PORT = process.env.PORT || 5000;

app.use(
  cors({
    origin: process.env.CLIENT_URL || "http://localhost:3000",
    credentials: true,
  }),
);
app.use(express.json());

app.get("/api/health", (req, res) => {
  res.json({
    status: "ok",
    message: "FixMyArea API is running",
    timestamp: new Date().toISOString(),
  });
});

app.get("/api/hello", (req, res) => {
  res.json({ message: "Hello, Daniyal!" });
});

app.get("/api/db-test", async (req, res) => {
  try {
    const { rows } = await query(
      "SELECT NOW() AS current_time, current_database() AS db_name",
    );
    res.json({
      connected: true,
      serverTime: rows[0].current_time,
      database: rows[0].db_name,
    });
  } catch (err) {
    res.status(500).json({ connected: false, error: err.message });
  }
});

app.listen(PORT, () => {
  console.log(`🚀 Server running at http://localhost:${PORT}`);
});
