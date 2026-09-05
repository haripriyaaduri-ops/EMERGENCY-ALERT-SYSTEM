const express = require("express");
const path = require("path");
const cors = require("cors");
const http = require("http");
const WebSocket = require("ws");
const { spawn } = require("child_process");

const app = express();

// ==========================================
// MIDDLEWARE
// ==========================================

app.use(cors());
app.use(express.json());

// ==========================================
// SERVE FRONTEND
// ==========================================

app.use(
  express.static(
    path.join(__dirname, "..", "frontend")
  )
);

// ==========================================
// HOME PAGE
// ==========================================

app.get("/", (req, res) => {
  res.sendFile(
    path.join(
      __dirname,
      "..",
      "frontend",
      "index.html"
    )
  );
});

// ==========================================
// POLICE DASHBOARD
// ==========================================

app.get("/police", (req, res) => {
  res.sendFile(
    path.join(
      __dirname,
      "..",
      "frontend",
      "police.html"
    )
  );
});

// ==========================================
// ML TRAFFIC PREDICTION API
// ==========================================

app.post("/predict-traffic", (req, res) => {
  const {
    vehicle_count,
    average_speed,
    distance_km,
    time_of_day
  } = req.body;

  // ========================================
  // CHECK INPUT VALUES
  // ========================================

  if (
    vehicle_count === undefined ||
    average_speed === undefined ||
    distance_km === undefined ||
    time_of_day === undefined
  ) {
    return res.status(400).json({
      success: false,
      message: "Missing traffic input values"
    });
  }

  console.log("\n🤖 ML Prediction Request:");
  console.log("Vehicle Count:", vehicle_count);
  console.log("Average Speed:", average_speed);
  console.log("Distance:", distance_km);
  console.log("Time:", time_of_day);

  // ========================================
  // RUN PYTHON ML SCRIPT
  // ========================================

  const python = spawn(
    "python3",
    [
      "predict.py",
      String(vehicle_count),
      String(average_speed),
      String(distance_km),
      String(time_of_day)
    ],
    {
      cwd: path.join(__dirname, "..", "ml")
    }
  );

  let output = "";
  let errorOutput = "";

  // ========================================
  // RECEIVE PYTHON OUTPUT
  // ========================================

  python.stdout.on("data", (data) => {
    output += data.toString();
  });

  // ========================================
  // RECEIVE PYTHON ERRORS
  // ========================================

  python.stderr.on("data", (data) => {
    errorOutput += data.toString();
  });

  // ========================================
  // PYTHON PROCESS FINISHED
  // ========================================

  python.on("close", (code) => {
    if (code !== 0) {
      console.log("❌ ML prediction failed:");
      console.log(errorOutput);

      return res.status(500).json({
        success: false,
        message: "ML prediction failed",
        error: errorOutput
      });
    }

    try {
      const result = JSON.parse(
        output.trim()
      );

      console.log(
        "🤖 Predicted Delay:",
        result.predicted_delay,
        "minutes"
      );

      res.json({
        success: true,
        predicted_delay:
          result.predicted_delay
      });

    } catch (error) {
      console.log(
        "❌ Error reading ML result:",
        error.message
      );

      res.status(500).json({
        success: false,
        message:
          "Invalid ML prediction result"
      });
    }
  });

  // ========================================
  // PYTHON PROCESS ERROR
  // ========================================

  python.on("error", (error) => {
    console.log(
      "❌ Unable to start Python:",
      error.message
    );

    if (!res.headersSent) {
      res.status(500).json({
        success: false,
        message: "Python runtime error",
        error: error.message
      });
    }
  });
});

// ==========================================
// CREATE HTTP SERVER
// ==========================================

const server = http.createServer(app);

// ==========================================
// CREATE WEBSOCKET SERVER
// ==========================================

const wss = new WebSocket.Server({
  server: server,
  path: "/ws"
});

// ==========================================
// STORE CONNECTED CLIENTS
// ==========================================

const clients = new Set();

// ==========================================
// WEBSOCKET CONNECTION
// ==========================================

wss.on("connection", (socket) => {
  console.log(
    "🔌 New WebSocket client connected"
  );

  clients.add(socket);

  // ========================================
  // RECEIVE MESSAGE
  // ========================================

  socket.on("message", (message) => {
    try {
      const data = JSON.parse(
        message.toString()
      );

      console.log(
        "🚨 Emergency Alert Received:"
      );

      console.log(data);

      // ======================================
      // SEND ALERT TO ALL CONNECTED CLIENTS
      // ======================================

      clients.forEach((client) => {
        if (
          client.readyState ===
          WebSocket.OPEN
        ) {
          client.send(
            JSON.stringify(data)
          );
        }
      });

    } catch (error) {
      console.log(
        "❌ Error processing emergency alert:",
        error.message
      );
    }
  });

  // ========================================
  // CLIENT DISCONNECTED
  // ========================================

  socket.on("close", () => {
    console.log(
      "🔌 WebSocket client disconnected"
    );

    clients.delete(socket);
  });

  // ========================================
  // CONNECTION ERROR
  // ========================================

  socket.on("error", (error) => {
    console.log(
      "⚠️ WebSocket error:",
      error.message
    );

    clients.delete(socket);
  });
});

// ==========================================
// START SERVER
// ==========================================

const PORT =
  process.env.PORT || 3000;

server.listen(
  PORT,
  "0.0.0.0",
  () => {
    console.log(
      "🚑 Smart Emergency Traffic Alert Server running on port " +
      PORT
    );

    console.log(
      "👤 User page: http://localhost:" +
      PORT
    );

    console.log(
      "👮 Police dashboard: http://localhost:" +
      PORT +
      "/police"
    );
  }
);