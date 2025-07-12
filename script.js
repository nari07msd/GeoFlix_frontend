// ===== Dark Mode =====
function toggleDarkMode() {
  const body = document.body;
  body.classList.toggle('dark-mode');
  
  // Save preference to localStorage
  const isDarkMode = body.classList.contains('dark-mode');
  localStorage.setItem('geoFlixDarkMode', isDarkMode);
  
  // Update toggle state
  const darkToggle = document.querySelector('#darkToggle input');
  if (darkToggle) {
    darkToggle.checked = isDarkMode;
  }
}

function initializeDarkMode() {
  const savedMode = localStorage.getItem('geoFlixDarkMode') === 'true';
  if (savedMode) {
    document.body.classList.add('dark-mode');
    const darkToggle = document.querySelector('#darkToggle input');
    if (darkToggle) {
      darkToggle.checked = true;
    }
  }
}

// ===== Backend URL =====
const BACKEND_URL = "https://geoflixbackend-production.up.railway.app";

// ===== Configuration =====
const CONFIG = {
  WEATHER_API_KEY: "82ef7eb8c710a4d63f28712218fd2b3e",
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
document.addEventListener("DOMContentLoaded", function() {
  initializeDarkMode();
  initApp();
});

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
    const trendCategory = await getLocalTrend(city, weather);

    elements.trends.textContent = `🔥 ${trendCategory}`;
    showRecommendations(weather, trendCategory, city);
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
    <div class="recommendation-card">
      <img src="${video.thumbnail}" alt="${video.title}">
      <h3>${video.title}</h3>
      <p>${video.description}</p>
      <button class="search-button">Search Videos</button>
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
async function getLocalTrend(city, weather) {
  try {
    // 1. Get trend
    const trendRes = await fetch(`${BACKEND_URL}/trends?city=${encodeURIComponent(city)}`);
    const trendData = await trendRes.json();
    const trend = trendData.trend || "local culture";

    // 2. Get ML prediction
    const mlRes = await fetch(`${BACKEND_URL}/ml-recommend`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        condition: weather.condition,
        temperature: weather.temp
      })
    });

    const mlData = await mlRes.json();
    const category = mlData.category || "relax";

    return `${trend} & ${category}`;
  } catch (err) {
    console.error("Trend or ML backend failed:", err);
    return "local culture & relax";
  }
}

function showLoadingState() {
  elements.videos.innerHTML = '<div class="loader"></div>';
}

// Expose toggle function to window for HTML onclick
window.toggleDarkMode = toggleDarkMode;
