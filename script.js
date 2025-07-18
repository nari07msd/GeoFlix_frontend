// ========== CONFIG ==========
const BACKEND_URL = "https://geoflixbackend-production.up.railway.app";
const WEATHER_API_KEY = "82ef7eb8c710a4d63f28712218fd2b3e";

// ========== PAGE INITIALIZATION ==========
document.addEventListener("DOMContentLoaded", () => {
  const isDashboard = window.location.pathname.includes("dashboard");
  if (isDashboard) {
    fetchDashboardAnalytics();
  } else {
    initApp(); // index.html
  }
});

// ========== INDEX PAGE (index.html) ==========
async function initApp() {
  showLoading();
  try {
    const location = await fetchLocation();
    const weather = await fetchWeather(location.lat, location.lon);
    const trend = await fetchTrend(location.city);
    const category = await fetchRecommendation(weather);

    displayInfo(location, weather, trend, category);
    displayVideos(category);
  } catch (error) {
    console.error("App initialization failed:", error);
    document.getElementById("info").innerText = "Something went wrong.";
  }
  hideLoading();
}

function showLoading() {
  const loader = document.getElementById("loader");
  if (loader) loader.style.display = "block";
}
function hideLoading() {
  const loader = document.getElementById("loader");
  if (loader) loader.style.display = "none";
}

// ========== LOCATION ==========
async function fetchLocation() {
  const res = await fetch("https://ipapi.co/json");
  const data = await res.json();
  return {
    city: data.city,
    region: data.region,
    country: data.country_name,
    lat: data.latitude,
    lon: data.longitude,
  };
}

// ========== WEATHER ==========
async function fetchWeather(lat, lon) {
  const url = `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${WEATHER_API_KEY}&units=metric`;
  const res = await fetch(url);
  const data = await res.json();
  return {
    condition: data.weather[0].main,
    temperature: data.main.temp,
  };
}

// ========== TRENDS ==========
async function fetchTrend(city) {
  const res = await fetch(`${BACKEND_URL}/trends?city=${city}`);
  const data = await res.json();
  return data.trend;
}

// ========== RECOMMENDATION ==========
async function fetchRecommendation(weather) {
  const res = await fetch(`${BACKEND_URL}/ml-recommend`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(weather),
  });
  const data = await res.json();
  return data.category;
}

// ========== DISPLAY ==========
function displayInfo(location, weather, trend, category) {
  document.getElementById("location").innerText = `📍 ${location.city}, ${location.country}`;
  document.getElementById("weather").innerText = `☀️ Weather: ${weather.condition}, ${weather.temperature}°C`;
  document.getElementById("trends").innerText = `🔥 Trending: ${trend}`;
  document.getElementById("info").innerText = `🎬 Recommended Category: ${category}`;
}

function displayVideos(category) {
  const container = document.getElementById("videos");
  if (!container) return;

  container.innerHTML = "";
  const dummyVideos = [
    { title: `${category} Show 1`, img: "https://source.unsplash.com/featured/?movie" },
    { title: `${category} Experience`, img: "https://source.unsplash.com/featured/?cinema" },
    { title: `Top ${category} Picks`, img: "https://source.unsplash.com/featured/?entertainment" },
  ];

  dummyVideos.forEach((video) => {
    const card = document.createElement("div");
    card.className = "recommendation-card";
    card.innerHTML = `
      <img src="${video.img}" alt="${video.title}">
      <h3>${video.title}</h3>
      <a class="search-button" href="https://www.youtube.com/results?search_query=${category}" target="_blank">
        Watch on YouTube
      </a>
    `;
    container.appendChild(card);
  });
}

// ========== DASHBOARD PAGE (dashboard.html) ==========
async function fetchDashboardAnalytics() {
  const summaryDiv = document.getElementById("dashboard-summary");
  const chartDiv = document.getElementById("chart");

  try {
    const res = await fetch(`${BACKEND_URL}/dashboard`);
    const data = await res.json();

    if (data.message) {
      summaryDiv.innerHTML = `<p>${data.message}</p>`;
      return;
    }

    summaryDiv.innerHTML = `
      <p><strong>Total Predictions:</strong> ${data.total_predictions}</p>
      <p><strong>Most Common Category:</strong> ${data.most_common_category}</p>
      <p><strong>Average Temperature:</strong> ${data.average_temperature}°C</p>
    `;

    renderChart(data.condition_distribution);
  } catch (error) {
    console.error("Failed to fetch dashboard data:", error);
    summaryDiv.innerHTML = `<p style="color:red;">Error loading dashboard data</p>`;
  }
}

function renderChart(data) {
  const ctx = document.getElementById("chart").getContext("2d");
  new Chart(ctx, {
    type: "bar",
    data: {
      labels: Object.keys(data),
      datasets: [{
        label: "Weather Conditions",
        data: Object.values(data),
        backgroundColor: ["#ffa751", "#4b79a1", "#bdc3c7", "#e6dada"],
      }]
    },
    options: {
      responsive: true,
      plugins: {
        legend: { display: false },
        title: {
          display: true,
          text: "Weather Condition Distribution",
          font: { size: 18 }
        }
      }
    }
  });
}
