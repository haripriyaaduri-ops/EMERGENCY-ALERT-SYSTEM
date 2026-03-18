// Connect to WebSocket server
const socket = new WebSocket("wss://YOUR-NGROK-URL/ws");

let latitude = null;
let longitude = null;

// Fetch Location
navigator.geolocation.getCurrentPosition(
  (position) => {
    latitude = position.coords.latitude;
    longitude = position.coords.longitude;

    document.getElementById("locationText").innerText =
      "📍 Location fetched successfully";

    document.getElementById("coords").innerText =
      `Latitude: ${latitude}\nLongitude: ${longitude}`;
  },
  () => {
    document.getElementById("locationText").innerText =
      "❌ Unable to fetch location";
  }
);

function sendAlert() {
  document.getElementById("sosSound").play();
  if (navigator.vibrate) {
  navigator.vibrate([500, 300, 500, 300, 800]);
}
  if (!latitude || !longitude) {
    alert("Location not ready yet!");
    return;
  }
  const url = `https://www.google.com/maps?q=${latitude},${longitude}`;
  window.open(url, "_blank");
}

  const emergencyType = document.getElementById("emergencyType").value;

  const data = {
    type: emergencyType,
    latitude: latitude,
    longitude: longitude,
    time: new Date().toLocaleString(),
  };

  socket.send(JSON.stringify(data));
  alert("🚨 Emergency Alert Sent Successfully!");
