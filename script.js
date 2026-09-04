// =====================================================
// 🚨 SMART EMERGENCY TRAFFIC ALERT
// USER SIDE
// Leaflet + Firebase + WebSocket + GPS + ML
// =====================================================


// ==========================
// FIREBASE IMPORTS
// ==========================

import {
  initializeApp
} from "https://www.gstatic.com/firebasejs/12.0.0/firebase-app.js";

import {
  getFirestore,
  collection,
  addDoc
} from "https://www.gstatic.com/firebasejs/12.0.0/firebase-firestore.js";


// ==========================
// FIREBASE CONFIG
// ==========================

const firebaseConfig = {

  apiKey: "AIzaSyCakCd30-BLJ3jipNZpAvpotIU_8_ZKUYk",

  authDomain:
    "emergency-traffic-alert.firebaseapp.com",

  projectId:
    "emergency-traffic-alert",

  storageBucket:
    "emergency-traffic-alert.firebasestorage.app",

  messagingSenderId:
    "501754447763",

  appId:
    "1:501754447763:web:3d7d02d3c8d8a539d6ca66"
};


// ==========================
// INITIALIZE FIREBASE
// ==========================

const app =
  initializeApp(firebaseConfig);

const db =
  getFirestore(app);

console.log("🔥 Firebase connected");


// ==========================
// VARIABLES
// ==========================

let latitude = null;
let longitude = null;

let map = null;
let marker = null;

let socket = null;


// ==========================
// INITIALIZE LEAFLET MAP
// ==========================

function initMap() {

  const mapElement =
    document.getElementById("map");

  if (!mapElement) {

    console.error(
      "❌ Map element not found"
    );

    return;
  }

  const defaultLatitude =
    16.6937;

  const defaultLongitude =
    81.4632;

  map =
    L.map("map").setView(
      [
        defaultLatitude,
        defaultLongitude
      ],
      16
    );


  // ==========================
  // OPENSTREETMAP
  // ==========================

  L.tileLayer(
    "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
    {
      maxZoom: 19,

      attribution:
        "&copy; OpenStreetMap contributors"
    }
  ).addTo(map);


  // ==========================
  // EMERGENCY VEHICLE MARKER
  // ==========================

  marker =
    L.marker(
      [
        defaultLatitude,
        defaultLongitude
      ]
    ).addTo(map);

  marker.bindPopup(
    "<b>🚨 Emergency Vehicle</b><br>" +
    "Waiting for GPS location..."
  );


  console.log(
    "🗺️ Leaflet map initialized"
  );


  if (
    latitude !== null &&
    longitude !== null
  ) {

    updateMapLocation();

  }

}


// ==========================
// UPDATE MAP LOCATION
// ==========================

function updateMapLocation() {

  if (
    latitude === null ||
    longitude === null
  ) {

    return;

  }


  if (
    !map ||
    !marker
  ) {

    return;

  }


  const currentLocation = [

    latitude,

    longitude

  ];


  marker.setLatLng(
    currentLocation
  );


  marker.bindPopup(

    "<b>🚨 Your Emergency Vehicle</b><br>" +

    `📍 ${latitude.toFixed(6)}, ` +

    `${longitude.toFixed(6)}`

  );


  map.setView(
    currentLocation,
    17
  );


  console.log(
    "📍 Map updated:",
    latitude,
    longitude
  );

}


// =====================================================
// ENGLISH ADDRESS CONVERSION
// =====================================================

async function getEnglishAddress(
  latitude,
  longitude
) {

  try {

    const response =
      await fetch(

        `https://nominatim.openstreetmap.org/reverse` +

        `?lat=${latitude}` +

        `&lon=${longitude}` +

        `&format=json` +

        `&addressdetails=1` +

        `&namedetails=1` +

        `&accept-language=en`

      );


    if (!response.ok) {

      throw new Error(
        "Address service unavailable"
      );

    }


    const data =
      await response.json();


    const address =
      data.address || {};


    const names =
      data.namedetails || {};


    // ==========================
    // GET ENGLISH NAME
    // ==========================

    function getEnglishName(
      teluguValue,
      englishValue
    ) {

      if (!teluguValue) {

        return englishValue || null;

      }


      // Exact place-name translations
      // for the current demo location.

      const translations = {

        "సరిపల్లె":
          "Saripalle",

        "సరిపల్లి":
          "Saripalle",

        "గణపవరం":
          "Ganapavaram",

        "పశ్చిమ గోదావరి":
          "West Godavari",

        "ఆంధ్ర ప్రదేశ్":
          "Andhra Pradesh",

        "ఆంధ్రప్రదేశ్":
          "Andhra Pradesh",

        "భారతదేశం":
          "India",

        "భారత్":
          "India"

      };


      if (
        translations[teluguValue]
      ) {

        return translations[
          teluguValue
        ];

      }


      // OSM English name

      if (
        englishValue &&
        /^[A-Za-z0-9 .,'()-]+$/.test(
          englishValue
        )
      ) {

        return englishValue;

      }


      // OSM name:en

      if (
        names["name:en"]
      ) {

        return names["name:en"];

      }


      return englishValue || teluguValue;

    }


    // ==========================
    // EXTRACT PLACE NAMES
    // ==========================

    const village =
      getEnglishName(
        address.village,
        names["name:en"] || address.village
      );


    const town =
      getEnglishName(
        address.town,
        names["name:en"] || address.town
      );


    const city =
      getEnglishName(
        address.city,
        names["name:en"] || address.city
      );


    const municipality =
      getEnglishName(
        address.municipality,
        names["name:en"] || address.municipality
      );


    const county =
      getEnglishName(
        address.county,
        names["name:en"] || address.county
      );


    const stateDistrict =
      getEnglishName(
        address.state_district,
        names["name:en"] || address.state_district
      );


    const state =
      getEnglishName(
        address.state,
        names["name:en"] || address.state
      );


    const country =
      getEnglishName(
        address.country,
        names["name:en"] || address.country
      );


    // ==========================
    // ROAD
    // ==========================

    const road =
      address.road || null;


    // ==========================
    // BUILD ADDRESS
    // ==========================

    const addressParts = [

      road,

      village,

      town,

      city,

      municipality,

      county,

      stateDistrict,

      state,

      address.postcode,

      country

    ].filter(Boolean);


    // ==========================
    // REMOVE DUPLICATES
    // ==========================

    const uniqueParts =
      [...new Set(addressParts)];


    // ==========================
    // REMOVE TELUGU VALUES
    // ==========================

    const englishOnlyParts =
      uniqueParts.filter(
        part =>
          !/[\u0C00-\u0C7F]/.test(part)
      );


    const englishAddress =
      englishOnlyParts.join(", ");


    console.log(
      "📍 English Address:",
      englishAddress
    );


    return englishAddress;


  }

  catch (error) {

    console.error(
      "❌ Address lookup error:",
      error
    );


    return null;

  }

}


// ==========================
// GET CURRENT GPS LOCATION
// ==========================

function getCurrentLocation() {

  const locationText =
    document.getElementById(
      "locationText"
    );


  const coords =
    document.getElementById(
      "coords"
    );


  // ==========================
  // CHECK GEOLOCATION
  // ==========================

  if (!navigator.geolocation) {

    if (locationText) {

      locationText.textContent =
        "❌ Geolocation is not supported.";

    }

    return;

  }


  // ==========================
  // INITIAL MESSAGE
  // ==========================

  if (locationText) {

    locationText.textContent =
      "📍 Detecting your location...";

  }


  if (coords) {

    coords.textContent =
      "Please wait...";

  }


  // ==========================
  // GET GPS
  // ==========================

  navigator.geolocation.getCurrentPosition(

    async function(position) {

      // ==========================
      // SAVE GPS
      // ==========================

      latitude =
        position.coords.latitude;

      longitude =
        position.coords.longitude;


      console.log(
        "📍 GPS:",
        latitude,
        longitude
      );


      // ==========================
      // SHOW COORDINATES
      // ==========================

      if (coords) {

        coords.textContent =

          `Latitude: ${latitude.toFixed(6)} | ` +

          `Longitude: ${longitude.toFixed(6)}`;

      }


      // ==========================
      // ADDRESS
      // ==========================

      if (locationText) {

        locationText.textContent =
          "🔍 Finding your English address...";

      }


      const englishAddress =
        await getEnglishAddress(
          latitude,
          longitude
        );


      // ==========================
      // SHOW ENGLISH ADDRESS
      // ==========================

      if (locationText) {

        if (englishAddress) {

          locationText.textContent =
            `📍 ${englishAddress}`;

        }

        else {

          locationText.textContent =
            "✅ Your current location detected";

        }

      }


      // ==========================
      // UPDATE MAP
      // ==========================

      updateMapLocation();

    },


    // ==========================
    // GPS ERROR
    // ==========================

    function(error) {

      console.error(
        "❌ GPS Error:",
        error
      );


      if (locationText) {

        locationText.textContent =
          "❌ Unable to detect location";

      }


      if (coords) {

        coords.textContent =
          "Please allow location permission.";

      }

    },


    // ==========================
    // GPS OPTIONS
    // ==========================

    {

      enableHighAccuracy: true,

      timeout: 10000,

      maximumAge: 0

    }

  );

}


// ==========================
// WEBSOCKET
// ==========================

function connectWebSocket() {

  try {

    const protocol =

      location.protocol === "https:"

        ? "wss:"

        : "ws:";


    socket =

      new WebSocket(

        `${protocol}//${location.host}/ws`

      );


    socket.onopen =
      function() {

        console.log(
          "🟢 WebSocket connected"
        );

      };


    socket.onmessage =
      function(event) {

        console.log(
          "📨 Server message:",
          event.data
        );

      };


    socket.onerror =
      function(error) {

        console.error(
          "❌ WebSocket error:",
          error
        );

      };


    socket.onclose =
      function() {

        console.log(
          "🟠 WebSocket disconnected"
        );

      };

  }

  catch (error) {

    console.error(
      "❌ WebSocket connection failed:",
      error
    );

  }

}


// ==========================
// ML TRAFFIC PREDICTION
// ==========================

async function predictTrafficDelay() {

  try {

    const trafficData = {

      vehicle_count: 100,

      average_speed: 20,

      distance_km: 5,

      time_of_day:
        new Date().getHours()

    };


    console.log(
      "🤖 Sending data to ML:",
      trafficData
    );


    const response =
      await fetch(

        "/predict-traffic",

        {

          method: "POST",

          headers: {

            "Content-Type":
              "application/json"

          },

          body:
            JSON.stringify(
              trafficData
            )

        }

      );


    if (!response.ok) {

      throw new Error(
        "ML server error"
      );

    }


    const result =
      await response.json();


    console.log(
      "🤖 ML result:",
      result
    );


    if (

      result.success &&

      result.predicted_delay !==
      undefined

    ) {

      return result.predicted_delay;

    }


    return null;

  }

  catch (error) {

    console.error(
      "❌ ML prediction error:",
      error
    );


    return null;

  }

}


// ==========================
// SEND EMERGENCY ALERT
// ==========================

async function sendAlert() {

  const vehicleElement =
    document.getElementById(
      "vehicleNumber"
    );


  const typeElement =
    document.getElementById(
      "emergencyType"
    );


  const detailsElement =
    document.getElementById(
      "emergencyDetails"
    );


  const statusMessage =
    document.getElementById(
      "statusMessage"
    );


  // ==========================
  // GET FORM DATA
  // ==========================

  const vehicleNumber =

    vehicleElement

      ? vehicleElement.value.trim()

      : "";


  const emergencyType =

    typeElement

      ? typeElement.value

      : "";


  const emergencyDetails =

    detailsElement

      ? detailsElement.value.trim()

      : "";


  // ==========================
  // VALIDATION
  // ==========================

  if (!vehicleNumber) {

    alert(
      "🚗 Please enter vehicle number."
    );

    return;

  }


  if (

    latitude === null ||

    longitude === null

  ) {

    alert(
      "📍 Please wait until your location is detected."
    );


    getCurrentLocation();

    return;

  }


  // ==========================
  // STATUS
  // ==========================

  if (statusMessage) {

    statusMessage.textContent =
      "🤖 Analyzing traffic...";


    statusMessage.style.color =
      "#f1c40f";

  }


  // ==========================
  // ML
  // ==========================

  const predictedDelay =
    await predictTrafficDelay();


  // ==========================
  // EMERGENCY DATA
  // ==========================

  const emergencyData = {

    vehicleNumber:
      vehicleNumber.toUpperCase(),

    emergencyType:
      emergencyType,

    emergencyDetails:
      emergencyDetails,

    latitude:
      latitude,

    longitude:
      longitude,

    predictedDelay:
      predictedDelay,

    timestamp:
      new Date().toISOString(),

    status:
      "ACTIVE"

  };


  console.log(
    "🚨 Emergency:",
    emergencyData
  );


  // ==========================
  // SOS SOUND
  // ==========================

  const sosSound =
    document.getElementById(
      "sosSound"
    );


  if (sosSound) {

    try {

      sosSound.currentTime = 0;

      await sosSound.play();

    }

    catch (error) {

      console.log(
        "🔊 SOS sound unavailable"
      );

    }

  }


  // ==========================
  // VIBRATION
  // ==========================

  if (navigator.vibrate) {

    navigator.vibrate(
      [300, 200, 300]
    );

  }


  // ==========================
  // SEND WEBSOCKET
  // ==========================

  if (

    socket &&

    socket.readyState ===
    WebSocket.OPEN

  ) {

    socket.send(

      JSON.stringify(
        emergencyData
      )

    );


    console.log(
      "📡 Alert sent to police dashboard"
    );

  }

  else {

    console.log(
      "⚠️ WebSocket not connected"
    );

  }


  // ==========================
  // SAVE FIREBASE
  // ==========================

  try {

    await addDoc(

      collection(
        db,
        "emergencyAlerts"
      ),

      emergencyData

    );


    console.log(
      "🔥 Alert saved to Firebase"
    );


    // ==========================
    // SUCCESS MESSAGE
    // ==========================

    if (statusMessage) {

      if (
        predictedDelay !== null
      ) {

        statusMessage.textContent =

          `🚨 Alert sent successfully! ` +

          `Predicted delay: ` +

          `${predictedDelay} minutes`;

      }

      else {

        statusMessage.textContent =
          "🚨 Emergency alert sent successfully!";

      }


      statusMessage.style.color =
        "#2ecc71";

    }


    // ==========================
    // SUCCESS ALERT
    // ==========================

    alert(

      predictedDelay !== null

        ? `🚨 EMERGENCY ALERT SENT!\n\n` +

          `Vehicle: ` +

          `${vehicleNumber.toUpperCase()}\n` +

          `Traffic Delay: ` +

          `${predictedDelay} minutes`

        : "🚨 Emergency alert sent successfully!"

    );

  }


  catch (error) {

    console.error(
      "❌ Firebase error:",
      error
    );


    if (statusMessage) {

      statusMessage.textContent =
        "❌ Failed to save emergency alert.";

      statusMessage.style.color =
        "red";

    }


    alert(
      "❌ Failed to save emergency alert."
    );

  }

}


// ==========================
// OPEN LOCATION
// ==========================

function openInMaps() {

  if (

    latitude === null ||

    longitude === null

  ) {

    alert(
      "📍 Location is not available yet."
    );

    return;

  }


  const url =

    `https://www.openstreetmap.org/` +

    `?mlat=${latitude}` +

    `&mlon=${longitude}` +

    `#map=17/${latitude}/${longitude}`;


  window.open(
    url,
    "_blank"
  );

}


// ==========================
// PAGE LOAD
// ==========================

window.addEventListener(

  "DOMContentLoaded",

  function() {

    console.log(
      "🚀 Smart Emergency Traffic Alert started"
    );


    // ==========================
    // GPS
    // ==========================

    getCurrentLocation();


    // ==========================
    // WEBSOCKET
    // ==========================

    connectWebSocket();


    // ==========================
    // LEAFLET MAP
    // ==========================

    initMap();

  }

);


// ==========================
// MAKE FUNCTIONS AVAILABLE
// ==========================

window.sendAlert =
  sendAlert;


window.openInMaps =
  openInMaps;