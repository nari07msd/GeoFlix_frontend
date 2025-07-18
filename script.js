const weatherApiKey = "82ef7eb8c710a4d63f28712218fd2b3e";
const backendUrl = "https://geoflixbackend-production.up.railway.app";

// DOM Elements
const recommendationDiv = document.getElementById("recommendation");
const loadingDiv = document.getElementById("loading");

function showLoading() {
  if (loadingDiv) loadingDiv.style.display = "block";
  if (recommendationDiv) recommendationDiv.style.display = "none";
}

function hideLoading() {
  if (loadingDiv) loadingDiv.style.display = "none";
  if (recommendationDiv) recommendationDiv.style.display = "block";
}

function displayRecommendation(category) {
  recommendationDiv.innerHTML = `<h3>Recommended Category: ${category}</h3>`;
  hideLoading();
}

function initApp() {
  showLoading();

  if (!navigator.geolocation) {
    alert("Geolocation is not supported.");
    return;
  }

  navigator.geolocation.getCurrentPosition(success, error);
}

function success(position) {
  const lat = position.coords.latitude;
  const lon = position.coords.longitude;
  fetchWeather(lat, lon);
}

function error(err) {
  alert("Location access is required.");
  console.error("Geolocation error:", err);
}

function fetchWeather(lat, lon) {
  const url = `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${weatherApiKey}&units=metric`;

  fetch(url)
    .then(res => res.json())
    .then(data => {
      console.log("✅ Weather data:", data);
      const condition = data.weather[0].main;
      const temp = data.main.temp;
      getRecommendation(condition, temp);
    })
    .catch(err => {
      alert("Failed to get weather data.");
      console.error("Weather error:", err);
    });
}

function getRecommendation(condition, temperature) {
  fetch(`${backendUrl}/recommend`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ condition, temperature }),
  })
    .then(res => res.json())
    .then(data => {
      console.log("✅ Recommendation response:", data);
      if (data.recommendation) {
        displayRecommendation(data.recommendation);
      } else {
        recommendationDiv.innerHTML = "<p>No recommendation available.</p>";
        hideLoading();
      }
    })
    .catch(err => {
      alert("Failed to get recommendation.");
      console.error("Recommendation fetch error:", err);
    });
}

// Start app
document.addEventListener("DOMContentLoaded", initApp);
