const apiKey = "82ef7eb8c710a4d63f28712218fd2b3e";
const backendURL = "https://geoflixbackend-production.up.railway.app";

document.addEventListener("DOMContentLoaded", () => {
  initApp();
});

async function initApp() {
  try {
    showLoading(true);
    const locationData = await fetchLocation();
    displayLocation(locationData);

    const weatherData = await fetchWeather(locationData.lat, locationData.lon);
    displayWeather(weatherData);

    const category = await fetchMLRecommendation(weatherData);
    displayRecommendations(category);

    const trend = await fetchTrends(locationData.city);
    displayTrends(trend);
  } catch (error) {
    console.error("App Error:", error);
    document.getElementById("info").textContent = "Something went wrong.";
  } finally {
    showLoading(false);
  }
}

function showLoading(show) {
  const loader = document.getElementById("loader");
  if (loader) loader.style.display = show ? "block" : "none";
}

async function fetchLocation() {
  const res = await fetch("https://ipapi.co/json/");
  const data = await res.json();
  return {
    city: data.city,
    region: data.region,
    country: data.country_name,
    lat: data.latitude,
    lon: data.longitude,
  };
}

function displayLocation(location) {
  const el = document.getElementById("location");
  if (el) el.innerHTML = `<h3>📍 ${location.city}, ${location.region}, ${location.country}</h3>`;
}

async function fetchWeather(lat, lon) {
  const url = `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${apiKey}&units=metric`;
  const res = await fetch(url);
  const data = await res.json();
  return {
    condition: data.weather[0].main,
    temperature: data.main.temp,
  };
}

function displayWeather(weather) {
  const el = document.getElementById("weather");
  if (el) el.innerHTML = `<h3>🌤️ ${weather.condition}, ${weather.temperature}°C</h3>`;
}

async function fetchMLRecommendation(weather) {
  const res = await fetch(`${backendURL}/ml-recommend`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(weather),
  });
  const data = await res.json();
  return data.category;
}

function displayRecommendations(category) {
  const el = document.getElementById("videos");
  if (!el) return;

  const dummyVideos = [
    { title: "Action Packed Trailer", thumbnail: "https://via.placeholder.com/220x120?text=Action", category: "Action" },
    { title: "Heartfelt Drama", thumbnail: "https://via.placeholder.com/220x120?text=Drama", category: "Drama" },
    { title: "Light Comedy", thumbnail: "https://via.placeholder.com/220x120?text=Comedy", category: "Comedy" },
    { title: "Inspiring Documentary", thumbnail: "https://via.placeholder.com/220x120?text=Documentary", category: "Documentary" },
    { title: "Family Time", thumbnail: "https://via.placeholder.com/220x120?text=Family", category: "Family" },
  ];

  const filtered = dummyVideos.filter(video => video.category === category);

  el.innerHTML = `<h3>🎬 Recommended Category: ${category}</h3>`;
  filtered.forEach(video => {
    el.innerHTML += `
      <div class="recommendation-card">
        <img src="${video.thumbnail}" alt="${video.title}"/>
        <p>${video.title}</p>
        <a href="https://www.youtube.com/results?search_query=${video.title}" class="search-button" target="_blank">Watch</a>
      </div>
    `;
  });
}

async function fetchTrends(city) {
  const res = await fetch(`${backendURL}/trends?city=${city}`);
  const data = await res.json();
  return data.trend;
}

function displayTrends(trend) {
  const el = document.getElementById("trends");
  if (el) el.innerHTML = `<h3>🔥 Local Trend: ${trend}</h3>`;
}
