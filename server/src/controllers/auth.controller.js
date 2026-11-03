import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { query } from "../config/db.js";

// Helper: generate a JWT for a user
function signToken(user) {
  return jwt.sign(
    { userId: user.id, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: "7d" },
  );
}

// POST /api/auth/register
export async function register(req, res) {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res
        .status(400)
        .json({ error: "name, email, and password are required" });
    }
    if (password.length < 6) {
      return res
        .status(400)
        .json({ error: "Password must be at least 6 characters" });
    }

    const existing = await query("SELECT id FROM users WHERE email = $1", [
      email,
    ]);
    if (existing.rows.length > 0) {
      return res.status(409).json({ error: "Email already registered" });
    }

    const passwordHash = await bcrypt.hash(password, 10);

    const { rows } = await query(
      `INSERT INTO users (name, email, password_hash)
       VALUES ($1, $2, $3)
       RETURNING id, name, email, role, created_at`,
      [name, email, passwordHash],
    );

    const user = rows[0];
    const token = signToken(user);

    res.status(201).json({ user, token });
  } catch (err) {
    console.error("register error:", err);
    res.status(500).json({ error: "Registration failed" });
  }
}

// POST /api/auth/login
export async function login(req, res) {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: "email and password are required" });
    }

    const { rows } = await query(
      "SELECT id, name, email, password_hash, role FROM users WHERE email = $1",
      [email],
    );

    if (rows.length === 0) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    const user = rows[0];
    const passwordMatches = await bcrypt.compare(password, user.password_hash);

    if (!passwordMatches) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    const { password_hash, ...safeUser } = user;
    const token = signToken(user);

    res.json({ user: safeUser, token });
  } catch (err) {
    console.error("login error:", err);
    res.status(500).json({ error: "Login failed" });
  }
}

// GET /api/auth/me  (protected)
export async function me(req, res) {
  try {
    const { rows } = await query(
      "SELECT id, name, email, role, created_at FROM users WHERE id = $1",
      [req.user.id],
    );

    if (rows.length === 0) {
      return res.status(404).json({ error: "User not found" });
    }

    res.json({ user: rows[0] });
  } catch (err) {
    console.error("me error:", err);
    res.status(500).json({ error: "Failed to fetch profile" });
  }
}
