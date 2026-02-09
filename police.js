setInterval(() => {
  fetch("http://localhost:3000/alert")
    .then(res => res.json())
    .then(data => {
      if (data) {
        document.getElementById("alertBox").innerHTML =
          "🚨 Emergency from " + data.vehicleType +
          "<br>Location: " + data.location +
          "<br>Issue: " + data.emergency;
      }
    });
}, 3000);
