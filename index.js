const express = require("express");
var cors = require("cors");
require('dotenv').config()
const app = express();
const PORT =process.env.PORT||  3000;

const { Authentication } = require("./middlewares");

const { connection } = require("./db");
const { UserModel } = require("./models/userModel");
const { DoctorModel } = require("./models/doctorModel");

const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

app.use(express.json());

app.use(cors());
app.get("/", (req, res) => {
  res.json({ message: "working" });
});
app.post("/signup", async (req, res) => {
  const { email, password } = req.body;

  bcrypt.hash(password, 10, async function (err, hash) {
    if (err) {
      return res.json({ error: "Hashing error" });
    }
    try {
      const user = new UserModel({
        email,
        password: hash,
      });

      const Existinguser = await UserModel.findOne({ email: email });
      if (Existinguser) {
        res.status(300).json({
          message: "user already exist",
        });
      } else {
        await user.save();
        res.json(user);
      }
    } catch (err) {
      res.json({ error: "User creation error" });
    }
  });
});

app.post("/login", async (req, res) => {
  const { email, password } = req.body;
  const user = await UserModel.findOne({ email: email });

  if (!user) {
    return res.json({ error: "Invalid email or password" });
  }

  const hash = user.password;
  bcrypt.compare(password, hash, function (err, result) {
    if (err || !result) {
      return res.json({ error: "Invalid email or password" });
    }

    const userWithoutPassword = {
      _id: user._id,
      email: user.email,
    };

    var token = jwt.sign({ user: userWithoutPassword }, "Akash");
    res.json({ message: "Login successful", token });
  });
});
app.use(Authentication);

app.post("/appointments", async (req, res) => {
  let { name, image, experience, slots, specialization, location, date, fee } =
    req.body;

  name = name.toLowerCase();

  if (
    !name ||
    !experience ||
    !slots ||
    !location ||
    !date ||
    !fee ||
    !image ||
    !specialization
  ) {
    return res.json({ error: "All required fields must be provided" });
  }

  const appointment = new DoctorModel({
    name,
    image,
    experience,
    slots,
    specialization,
    location,
    date,
    fee,
  });

  await appointment.save();
  res.json(appointment);
});

app.get("/dashboard", async (req, res) => {
  let query = {};

  if (req.query.specialization) {
    query.specialization = req.query.specialization;
  }
  if (req.query.doctorName) {
    query.name = req.query.doctorName.toLowerCase();
  }
  const sortOptions = { date: 1 };

  try {
    const appointments = await DoctorModel.find(query).sort(sortOptions);
    res.json(appointments);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

app.put("/appointments/:id", async (req, res) => {
  const appointmentId = req.params.id;
 
  if (!appointmentId) {
    return res.status(400).json({ error: "Appointment ID is required" });
  }

  let { name, image, experience, slots, specialization, location, date, fee } = req.body;

  if (!name || !experience || !slots || !location || !date || !fee || !image || !specialization) {
    return res.status(400).json({ error: "All required fields must be provided" });
  }
  
  name = name.toLowerCase();
  try {
    const existingAppointment = await DoctorModel.findById(appointmentId);

    if (!existingAppointment) {
      return res.status(404).json({ error: "Appointment not found" });
    }

   
    existingAppointment.name = name;
    existingAppointment.image = image;
    existingAppointment.experience = experience;
    existingAppointment.slots = slots;
    existingAppointment.specialization = specialization;
    existingAppointment.location = location;
    existingAppointment.date = date;
    existingAppointment.fee = fee;

   
    await existingAppointment.save();

  
    res.json(existingAppointment);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Sommething went wrong' });
  }
}
)

app.listen(PORT, () => {
  try {
    connection;
    console.log(`Listening on port:${PORT}`);
  } catch (err) {
    console.error(err);
  }
});
