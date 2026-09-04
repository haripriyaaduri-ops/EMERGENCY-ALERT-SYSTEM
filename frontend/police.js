// ==========================================
// SMART EMERGENCY TRAFFIC POLICE DASHBOARD
// Leaflet + OpenStreetMap Version
// ==========================================

let map = null;
let emergencyMarker = null;
let hospitalMarkers = [];

let latestLatitude = null;
let latestLongitude = null;


// ==========================================
// INITIALIZE POLICE MAP
// ==========================================

function initPoliceMap() {

  const defaultLatitude = 16.6937;
  const defaultLongitude = 81.4632;

  map = L.map("policeMap").setView(
    [defaultLatitude, defaultLongitude],
    14
  );

  // OpenStreetMap tiles
  L.tileLayer(
    "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
    {
      maxZoom: 19,
      attribution: "&copy; OpenStreetMap contributors"
    }
  ).addTo(map);

  console.log("Leaflet map initialized successfully");
}


// ==========================================
// SHOW EMERGENCY VEHICLE LOCATION
// ==========================================

function showEmergencyLocation(latitude, longitude) {

  if (!map) {
    console.log("Map is not initialized yet");
    return;
  }

  latestLatitude = latitude;
  latestLongitude = longitude;

  // Remove previous emergency marker
  if (emergencyMarker) {
    map.removeLayer(emergencyMarker);
  }

  // Create emergency marker
  emergencyMarker = L.marker(
    [latitude, longitude]
  ).addTo(map);

  emergencyMarker.bindPopup(
    "<b>🚨 Emergency Vehicle</b><br>" +
    "Location received from vehicle."
  ).openPopup();

  // Move map to emergency vehicle
  map.setView(
    [latitude, longitude],
    16
  );

  console.log(
    "Emergency location:",
    latitude,
    longitude
  );

  // Find nearby hospitals
  findNearbyHospitals(latitude, longitude);
}


// ==========================================
// FIND NEARBY HOSPITALS
// ==========================================

async function findNearbyHospitals(latitude, longitude) {

  const hospitalList =
    document.getElementById("hospitalList");

  hospitalList.innerHTML =
    "<p>🔍 Searching nearby hospitals...</p>";

  // Remove old hospital markers
  hospitalMarkers.forEach(marker => {
    map.removeLayer(marker);
  });

  hospitalMarkers = [];

  const radius = 5000;

  const query = `
    [out:json];
    (
      node["amenity"="hospital"](around:${radius},${latitude},${longitude});
      way["amenity"="hospital"](around:${radius},${latitude},${longitude});
      relation["amenity"="hospital"](around:${radius},${latitude},${longitude});
    );
    out center;
  `;

  const url =
    "https://overpass-api.de/api/interpreter?data=" +
    encodeURIComponent(query);

  try {

    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(
        "Hospital API request failed"
      );
    }

    const data = await response.json();

    const hospitals = data.elements || [];

    if (hospitals.length === 0) {

      hospitalList.innerHTML =
        "<p>⚠️ No hospitals found within 5 km.</p>";

      return;
    }

    displayHospitalList(
      hospitals,
      latitude,
      longitude
    );

  } catch (error) {

    console.error(
      "Hospital search error:",
      error
    );

    hospitalList.innerHTML = `
      <p>
        ⚠️ Unable to load nearby hospitals.
      </p>

      <button onclick="findNearbyHospitals(
        ${latitude},
        ${longitude}
      )">
        🔄 Try Again
      </button>
    `;
  }
}


// ==========================================
// DISPLAY HOSPITAL LIST
// ==========================================

function displayHospitalList(
  hospitals,
  emergencyLatitude,
  emergencyLongitude
) {

  const hospitalList =
    document.getElementById("hospitalList");

  hospitalList.innerHTML = "";

  // Sort hospitals by approximate distance
  hospitals.sort((a, b) => {

    const aLat =
      a.lat ?? a.center?.lat;

    const aLng =
      a.lon ?? a.center?.lon;

    const bLat =
      b.lat ?? b.center?.lat;

    const bLng =
      b.lon ?? b.center?.lon;

    const distanceA =
      calculateDistance(
        emergencyLatitude,
        emergencyLongitude,
        aLat,
        aLng
      );

    const distanceB =
      calculateDistance(
        emergencyLatitude,
        emergencyLongitude,
        bLat,
        bLng
      );

    return distanceA - distanceB;
  });


  // Show maximum 10 hospitals
  hospitals
    .slice(0, 10)
    .forEach((hospital, index) => {

      const hospitalLatitude =
        hospital.lat ??
        hospital.center?.lat;

      const hospitalLongitude =
        hospital.lon ??
        hospital.center?.lon;

      if (
        hospitalLatitude === undefined ||
        hospitalLongitude === undefined
      ) {
        return;
      }

      const tags =
        hospital.tags || {};

      const hospitalName =
        tags.name ||
        "Hospital";

      const street =
        tags["addr:street"] || "";

      const city =
        tags["addr:city"] || "";

      const address =
        [street, city]
          .filter(Boolean)
          .join(", ") ||
        "Address not available";

      const distance =
        calculateDistance(
          emergencyLatitude,
          emergencyLongitude,
          hospitalLatitude,
          hospitalLongitude
        );


      // Add marker to map
      const marker =
        L.marker([
          hospitalLatitude,
          hospitalLongitude
        ]).addTo(map);

      marker.bindPopup(`
        <b>🏥 ${hospitalName}</b><br>
        ${address}<br>
        Distance: ${distance.toFixed(2)} km
      `);

      hospitalMarkers.push(marker);


      // Hospital card
      const card =
        document.createElement("div");

      card.className =
        "hospital-card";

      card.innerHTML = `
        <h3>
          🏥 ${index + 1}. ${hospitalName}
        </h3>

        <p>
          📍 ${address}
        </p>

        <p>
          📏 Distance:
          <b>${distance.toFixed(2)} km</b>
        </p>

        <p>
          Coordinates:
          ${hospitalLatitude.toFixed(6)},
          ${hospitalLongitude.toFixed(6)}
        </p>

        <a
          class="direction-btn"
          href="https://www.openstreetmap.org/directions?engine=fossgis_osrm_car&route=${emergencyLatitude}%2C${emergencyLongitude}%3B${hospitalLatitude}%2C${hospitalLongitude}"
          target="_blank"
        >
          🧭 Get Directions
        </a>
      `;

      hospitalList.appendChild(card);

    });
}


// ==========================================
// CALCULATE DISTANCE
// ==========================================

function calculateDistance(
  lat1,
  lon1,
  lat2,
  lon2
) {

  const earthRadius = 6371;

  const dLat =
    (lat2 - lat1) *
    Math.PI / 180;

  const dLon =
    (lon2 - lon1) *
    Math.PI / 180;

  const a =
    Math.sin(dLat / 2) *
    Math.sin(dLat / 2) +

    Math.cos(lat1 * Math.PI / 180) *
    Math.cos(lat2 * Math.PI / 180) *

    Math.sin(dLon / 2) *
    Math.sin(dLon / 2);

  const c =
    2 * Math.atan2(
      Math.sqrt(a),
      Math.sqrt(1 - a)
    );

  return earthRadius * c;
}


// ==========================================
// RECEIVE EMERGENCY ALERT
// ==========================================

function receiveEmergencyAlert(data) {

  console.log(
    "Emergency alert received:",
    data
  );

  const {
    vehicleNumber,
    emergencyType,
    emergencyDetails,
    latitude,
    longitude,
    predictedDelay,
    timestamp
  } = data;


  // Show location
  showEmergencyLocation(
    latitude,
    longitude
  );


  // Remove "No alerts" message
  const noAlert =
    document.getElementById("noAlert");

  if (noAlert) {
    noAlert.remove();
  }


  // Create alert card
  const alertCard =
    document.createElement("div");

  alertCard.className =
    "alert-card";

  alertCard.innerHTML = `

    <h3>
      🚨 ACTIVE EMERGENCY
    </h3>

    <p>
      <b>Vehicle Number:</b>
      ${vehicleNumber || "N/A"}
    </p>

    <p>
      <b>Emergency Type:</b>
      ${emergencyType || "N/A"}
    </p>

    <p>
      <b>Details:</b>
      ${emergencyDetails || "N/A"}
    </p>

    <p>
      <b>Latitude:</b>
      ${latitude}
    </p>

    <p>
      <b>Longitude:</b>
      ${longitude}
    </p>

    <p>
      <b>Predicted Traffic Delay:</b>
      ${predictedDelay || 0} minutes
    </p>

    <p>
      <b>Status:</b>
      <span class="status-active">
        ACTIVE
      </span>
    </p>

    <p>
      <b>Time:</b>
      ${timestamp
        ? new Date(timestamp).toLocaleString()
        : new Date().toLocaleString()}
    </p>

    <a
      class="map-link"
      href="https://www.openstreetmap.org/?mlat=${latitude}&mlon=${longitude}#map=17/${latitude}/${longitude}"
      target="_blank"
    >
      📍 Open Emergency Location
    </a>

  `;


  document
    .getElementById("alertBox")
    .appendChild(alertCard);
}


// ==========================================
// WEBSOCKET CONNECTION
// ==========================================

function connectWebSocket() {

  const status =
    document.getElementById(
      "connectionStatus"
    );

  const protocol =
    location.protocol === "https:"
      ? "wss:"
      : "ws:";

  const socket =
    new WebSocket(
      `${protocol}//${location.host}/ws`
    );


  socket.onopen = function () {

    console.log(
      "Police dashboard connected"
    );

    status.innerHTML =
      "🟢 Connected to Emergency Alert Server";

    status.style.color =
      "#2ecc71";
  };


  socket.onmessage = function (event) {

    try {

      const data =
        JSON.parse(event.data);

      console.log(
        "WebSocket message:",
        data
      );

      if (
        data.vehicleNumber &&
        data.latitude &&
        data.longitude
      ) {

        receiveEmergencyAlert(data);

      }

    } catch (error) {

      console.error(
        "Invalid WebSocket data:",
        error
      );
    }
  };


  socket.onerror = function (error) {

    console.error(
      "WebSocket error:",
      error
    );

    status.innerHTML =
      "🔴 WebSocket connection error";

    status.style.color =
      "red";
  };


  socket.onclose = function () {

    console.log(
      "WebSocket connection closed"
    );

    status.innerHTML =
      "🟠 Server disconnected. Reconnecting...";

    status.style.color =
      "#f39c12";

    setTimeout(
      connectWebSocket,
      3000
    );
  };
}


// ==========================================
// PAGE LOAD
// ==========================================

document.addEventListener(
  "DOMContentLoaded",
  function () {

    console.log(
      "Police dashboard loading..."
    );

    initPoliceMap();

    connectWebSocket();

  }
);