const express = require("express");
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const cors = require("cors");
const helmet = require("helmet");

const app = express();

console.log("SERVER FILE LOADED");

// ---------------- MIDDLEWARE ----------------

// CORS - Allow your frontend domain
const allowedOrigins = [
  'http://localhost:5173',
  'https://your-frontend-url.vercel.app' // Add your Vercel URL here after deployment
];

app.use(cors({
  origin: function(origin, callback) {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json());
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" }
}));

// ---------------- DATABASE ----------------
const MONGODB_URI = process.env.MONGODB_URI || "mongodb+srv://rathijp825_db_user:JPRathi825@testing01.rl1sp6o.mongodb.net/hospital?retryWrites=true&w=majority";

mongoose.connect(MONGODB_URI);

mongoose.connection.once("open", () => {
  console.log("MongoDB connected");
});

// ---------------- SCHEMA ----------------
const UserSchema = new mongoose.Schema({
  name: String,
  email: String,
  password: String,
  phone: String,
  role: { type: String, enum: ["doctor", "admin"] }
});

const User = mongoose.model("users_privates", UserSchema);

// ---------------- AUTH MIDDLEWARE ----------------
const JWT_SECRET = process.env.JWT_SECRET || "SECRET_KEY";

function auth(req, res, next) {
  const token = req.headers.authorization;
  if (!token) return res.status(401).json({ error: "No token" });

  try {
    req.user = jwt.verify(token, JWT_SECRET);
    next();
  } catch (err) {
    return res.status(401).json({ error: "Invalid token" });
  }
}

// ---------------- ROUTES ----------------

app.get("/", (req, res) => {
  res.json({ message: "Hospital API is running", status: "OK" });
});

app.get("/test", (req, res) => {
  res.json({ message: "Backend is working", timestamp: new Date() });
});

// Register
app.post("/api/register", async (req, res) => {
  try {
    const existingUser = await User.findOne({ email: req.body.email });
    if (existingUser) {
      return res.status(400).json({ error: "User already exists" });
    }

    const hashed = await bcrypt.hash(req.body.password, 10);

    const user = new User({
      name: req.body.name,
      email: req.body.email,
      password: hashed,
      phone: req.body.phone,
      role: req.body.role
    });

    await user.save();
    res.status(201).json({ message: "User registered successfully" });
  } catch (err) {
    console.error("Registration error:", err);
    res.status(500).json({ error: "Registration failed" });
  }
});

// Login
app.post("/api/login", async (req, res) => {
  try {
    const user = await User.findOne({ email: req.body.email });
    if (!user) return res.status(404).json({ error: "User not found" });

    const valid = await bcrypt.compare(req.body.password, user.password);
    if (!valid) return res.status(401).json({ error: "Invalid password" });

    const token = jwt.sign(
      { id: user._id, role: user.role },
      JWT_SECRET,
      { expiresIn: "1h" }
    );

    res.json({ token });
  } catch (err) {
    console.error("Login error:", err);
    res.status(500).json({ error: "Login failed" });
  }
});

// Profile
app.get("/api/profile", auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select("-password");
    if (!user) return res.status(404).json({ error: "Profile not found" });
    res.json(user);
  } catch (err) {
    console.error("Profile error:", err);
    res.status(500).json({ error: "Profile lookup failed" });
  }
});

// Admin route
app.get("/api/admin/users", auth, async (req, res) => {
  try {
    if (req.user.role !== "admin") {
      return res.status(403).json({ error: "Forbidden" });
    }
    const users = await User.find().select("-password");
    res.json(users);
  } catch (err) {
    console.error("Admin error:", err);
    res.status(500).json({ error: "Failed to fetch users" });
  }
});

// ---------------- SERVER ----------------
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));