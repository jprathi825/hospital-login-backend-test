const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

// Use the SAME connection string as server.js
mongoose.connect(
  "mongodb+srv://rathijp825_db_user:8m0xsA9FrsLmFktx@testing01.rl1sp6o.mongodb.net/hospital"
);

// Schema (same as server.js)
const UserSchema = new mongoose.Schema({
  name: String,
  email: String,
  password: String,
  phone: String,
  role: String
});

const User = mongoose.model("users_privates", UserSchema);

async function seedUsers() {
  const users = [
    {
      name: "Dr John",
      email: "john@hospital.com",
      password: await bcrypt.hash("doctor123", 10),
      phone: "9999999999",
      role: "doctor"
    },
    {
      name: "Admin User",
      email: "admin@hospital.com",
      password: await bcrypt.hash("admin123", 10),
      phone: "8888888888",
      role: "admin"
    }
  ];

  await User.insertMany(users);
  console.log("Test users created successfully");
  process.exit();
}

seedUsers();
