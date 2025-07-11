// ===== Backend URL =====
const BACKEND_URL = "https://geoflixbackend-production.up.railway.app";

// ===== Configuration =====
const CONFIG = {
  WEATHER_API_KEY: "82ef7eb8c710a4d63f28712218fd2b3e", // Replace with your key
  FALLBACK_CITY: "New York",
  MOCK_VIDEOS: [
    {
      title: "City Exploration Ideas",
      description: "Best activities for current weather",
      thumbnail: "https://picsum.photos/300/200?city"
    },
    {
      title: "Local Culture Guide",
      description: "Discover hidden gems in your area",
      thumbnail: "https://picsum.photos/300/200?culture"
    }
  ]
};

// ===== DOM Elements =====
const elements = {
  form: document.getElementById("cityForm"),
  input: document.getElementById("cityInput"),
  location: document.getElementById("location"),
  weather: document.getElementById("weather"),
  trends: document.getElementById("trends"),
  videos: document.getElementById("videos")
};

// ===== Initialize App =====
document.addEventListener("DOMContentLoaded", initApp);

async function initApp() {
  elements.form.addEventListener("submit", handleFormSubmit);

  try {
    const city = await detectLocation();
    await updateDashboard(city);
  } catch (error) {
    console.log("Using fallback city:", error);
    await updateDashboard(CONFIG.FALLBACK_CITY);
  }
}

// ===== Core Functions =====
async function handleFormSubmit(e) {
  e.preventDefault();
  const city = elements.input.value.trim();
  if (!city) return;

  showLoadingState();
  await updateDashboard(city);
}

async function updateDashboard(city) {
  try {
    elements.location.textContent = `📍 ${city}`;

    const weather = await fetchWeather(city);
    const trend = await getLocalTrend(city);

    elements.trends.textContent = `🔥 Local Trend: ${trend}`;
    showRecommendations(weather, trend, city);
  } catch (error) {
    console.error("Dashboard error:", error);
    showMockVideos();
  }
}

// ===== Weather Functions =====
async function fetchWeather(city) {
  const response = await fetch(
    `https://api.openweathermap.org/data/2.5/weather?q=${city}&appid=${CONFIG.WEATHER_API_KEY}&units=metric`
  );
  const data = await response.json();

  if (data.cod !== 200) throw new Error("Weather fetch failed");

  elements.weather.textContent = `🌦 ${data.weather[0].description}, ${data.main.temp}°C`;
  updateBackground(data.weather[0].main);

  return {
    condition: data.weather[0].main,
    temp: data.main.temp
  };
}

function updateBackground(weatherCondition) {
  document.body.className = "";
  if (weatherCondition.includes("Rain")) document.body.classList.add("rainy");
  else if (weatherCondition.includes("Snow")) document.body.classList.add("snowy");
  else if (weatherCondition.includes("Clear")) document.body.classList.add("sunny");
  else document.body.classList.add("cloudy");
}

// ===== Recommendation System =====
function showRecommendations(weather, trend, city) {
  elements.videos.innerHTML = "";

  const suggestions = generateSuggestions(weather, trend, city);

  suggestions.forEach(item => {
    const card = document.createElement("div");
    card.className = "recommendation-card";
    card.innerHTML = `
      <img src="${item.thumbnail}" alt="${item.title}">
      <h3>${item.title}</h3>
      <p>${item.description}</p>
      <a href="https://www.youtube.com/results?search_query=${encodeURIComponent(item.searchQuery)}" 
         target="_blank" class="search-button">
        Search Videos
      </a>
    `;
    elements.videos.appendChild(card);
  });
}

function generateSuggestions(weather, trend, city) {
  const weatherThemes = {
    "Rain": ["Indoor activities", "Cozy cafes", "Rainy day recipes"],
    "Snow": ["Winter sports", "Hot chocolate recipes", "Snow photography"],
    "Clear": ["Outdoor adventures", "Sunset spots", "Picnic ideas"],
    "Cloudy": ["Museum tours", "Book recommendations", "Local history"]
  };

  const theme = weatherThemes[weather.condition] || ["Things to do"];

  return [
    {
      title: `${trend} in ${city}`,
      description: `Popular local activities`,
      thumbnail: "https://picsum.photos/300/200?urban",
      searchQuery: `${trend} in ${city}`
    },
    {
      title: `${weather.condition} Day Ideas`,
      description: theme[0],
      thumbnail: "https://picsum.photos/300/200?weather",
      searchQuery: `${theme[0]} ${city}`
    }
  ];
}

function showMockVideos() {
  elements.videos.innerHTML = CONFIG.MOCK_VIDEOS.map(video => `
    <div class="video-card">
      <img src="${video.thumbnail}" alt="${video.title}">
      <h3>${video.title}</h3>
      <p>${video.description}</p>
    </div>
  `).join("");
}

// ===== Location Helpers =====
async function detectLocation() {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) reject("Geolocation not supported");

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        try {
          const city = await reverseGeocode(pos.coords.latitude, pos.coords.longitude);
          resolve(city);
        } catch (error) {
          reject(error);
        }
      },
      () => reject("Permission denied")
    );
  });
}

async function reverseGeocode(lat, lon) {
  const response = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}`);
  const data = await response.json();
  return data.address.city || data.address.town || CONFIG.FALLBACK_CITY;
}

// ===== Backend Call =====
async function getLocalTrend(city) {
  try {
    const res = await fetch(`${BACKEND_URL}/trends?city=${encodeURIComponent(city)}`);
    const data = await res.json();
    return data.trend || "local culture";
  } catch (err) {
    console.error("Backend trend fetch failed:", err);
    return "local culture";
  }
}

function showLoadingState() {
  elements.videos.innerHTML = '<div class="loader"></div>';
}
