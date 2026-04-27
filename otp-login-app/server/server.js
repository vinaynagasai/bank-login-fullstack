const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const bcrypt = require("bcryptjs");

console.log("RUNNING FILE:", __filename);

const app = express();
app.use(cors());
app.use(express.json());

/* =========================
   ✅ MongoDB Connection
========================= */
mongoose
  .connect("mongodb://127.0.0.1:27017/loginDB")
  .then(() => {
    console.log("MongoDB connected");
    console.log("Connected DB:", mongoose.connection.name);
  })
  .catch((err) => console.log(err));

/* =========================
   ✅ USER (LOGIN)
========================= */
const userSchema = new mongoose.Schema({
  employeeId: { type: String, required: true, unique: true },
  password: { type: String, required: true },
});

const User = mongoose.model("User", userSchema);

/* =========================
   ✅ EMPLOYEE (MEMBERS DATA)
========================= */
const employeeSchema = new mongoose.Schema({
  name: { type: String, required: true },
  employeeId: { type: String, required: true, unique: true }, // 🔥 FIX
  branch: { type: String, required: true },
  role: { type: String, enum: ["manager", "staff"], required: true },
});

const Employee = mongoose.model("Employee", employeeSchema);

/* =========================
   🔹 CREATE USER (LOGIN)
========================= */
app.post("/create-user", async (req, res) => {
  try {
    const { employeeId } = req.body;

    if (!employeeId) {
      return res.status(400).json({ message: "Employee ID required ❌" });
    }

    const existing = await User.findOne({ employeeId });
    if (existing) {
      return res.json({ message: "User already exists ⚠️" });
    }

    const hashed = await bcrypt.hash("1234", 10);

    await User.create({
      employeeId,
      password: hashed,
    });

    res.json({ message: "User created (password = 1234) ✅" });
  } catch (err) {
    console.log(err);
    res.status(500).json({ message: "Server error ❌" });
  }
});

/* =========================
   🔹 LOGIN
========================= */
app.post("/login", async (req, res) => {
  try {
    const { employeeId, password } = req.body;

    if (!employeeId || !password) {
      return res.status(400).json({ message: "All fields required ❌" });
    }

    const user = await User.findOne({ employeeId });

    if (!user) {
      return res.status(403).json({ message: "Access denied 🚫" });
    }

    const match = await bcrypt.compare(password, user.password);

    if (!match) {
      return res.status(400).json({ message: "Wrong password ❌" });
    }

    const employee = await Employee.findOne({ employeeId });

    res.json({
      message: "Login successful ✅",
      employee,
    });

  } catch (err) {
    console.log(err);
    res.status(500).json({ message: "Server error ❌" });
  }
});

/* =========================
   🔹 RESET PASSWORD
========================= */
app.post("/reset-password", async (req, res) => {
  try {
    const { employeeId, oldPassword, newPassword } = req.body;

    if (!employeeId || !oldPassword || !newPassword) {
      return res.status(400).json({ message: "All fields required ❌" });
    }

    const user = await User.findOne({ employeeId });

    if (!user) {
      return res.status(404).json({ message: "User not found ❌" });
    }

    const match = await bcrypt.compare(oldPassword, user.password);

    if (!match) {
      return res.status(400).json({ message: "Old password incorrect ❌" });
    }

    const hashed = await bcrypt.hash(newPassword, 10);

    await User.updateOne({ employeeId }, { password: hashed });

    res.json({ message: "Password updated ✅" });
  } catch (err) {
    console.log(err);
    res.status(500).json({ message: "Server error ❌" });
  }
});

/* =========================
   🔹 ADD EMPLOYEE
========================= */
app.post("/add-employee", async (req, res) => {
  try {
    const { name, employeeId, branch, role } = req.body;

    if (!name || !employeeId || !branch || !role) {
      return res.status(400).json({ message: "All fields required ❌" });
    }

    const existing = await Employee.findOne({ employeeId });
    if (existing) {
      return res.json({ message: "Employee already exists ⚠️" });
    }

    const emp = await Employee.create({
      name,
      employeeId,
      branch,
      role,
    });

    res.json(emp);
  } catch (err) {
    console.log(err);
    res.status(500).json({ message: "Error ❌" });
  }
});

/* =========================
   🔹 GET ALL EMPLOYEES
========================= */
app.get("/employees", async (req, res) => {
  const data = await Employee.find();
  res.json(data);
});

/* =========================
   🔹 GET EMPLOYEE BY ID
========================= */
app.get("/employee/:id", async (req, res) => {
  const emp = await Employee.findOne({ employeeId: req.params.id });
  res.json(emp);
});

/* =========================
   🚀 START SERVER
========================= */
app.listen(5000, () => console.log("Server running on port 5000"));