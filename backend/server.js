const express = require("express");
const cors = require("cors");

const app = express();
app.use(cors());
app.use(express.json());

app.post("/emergency", (req, res) => {
  const { reason, latitude, longitude } = req.body;

  console.log("\n🚨 EMERGENCY ALERT RECEIVED");
  console.log("Reason:", reason);
  console.log("Latitude:", latitude);
  console.log("Longitude:", longitude);
  console.log(
    "📍 Google Maps:",
    `https://www.google.com/maps?q=${latitude},${longitude}`
  );

  res.json({ message: "Alert received" });
});

app.listen(3000, () => {
  console.log("✅ Server running on http://localhost:3000");
});
