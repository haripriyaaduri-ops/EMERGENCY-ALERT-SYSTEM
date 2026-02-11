const express = require("express");
const cors = require("cors");
const path = require("path");

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// 🔥 Static files from frontend folder
app.use(express.static(path.join(__dirname, "frontend")));

// Home route
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "frontend", "index.html"));
});

// Emergency Route
app.post("/emergency", (req, res) => {
  const { reason, latitude, longitude } = req.body;

  console.log("\n🚨 EMERGENCY ALERT RECEIVED 🚨");
  console.log("Reason:", reason);
  console.log("Latitude:", latitude);
  console.log("Longitude:", longitude);

  console.log(
    "📍 Location:",
    `https://www.google.com/maps?q=${latitude},${longitude}`
  );

  res.json({ message: "Alert received successfully" });
});

// Render Port
const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`✅ Server running on port ${PORT}`);
});
