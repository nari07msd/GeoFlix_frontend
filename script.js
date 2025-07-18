document.addEventListener("DOMContentLoaded", () => {
  const path = window.location.pathname;

  if (path.includes("dashboard.html")) {
    fetchDashboardData();
  } else {
    initGeoFlix();
  }
});

/* ===== GEOFLIX RECOMMENDER LOGIC FOR index.html ===== */

function initGeoFlix() {
  showLoading(true);
  getUserLocation()
    .then((location) => {
      updateLocationUI(location);
      return Promise.all([location, getWeather(location)]);
    })
    .then(([location, weather]) => {
      updateWeatherUI(weather);
      return Promise.all([weather, getTrends(location.city)]);
    })
    .then(([weather, trends]) => {
      updateTrendsUI(trends);
      return getRecommendations(weather);
    })
    .then((videos) => {
      updateRecommendationsUI(videos);
      showLoading(false);
    })
    .catch((error) => {
      console.error("Initialization Error:", error);
      showLoading(false);
      alert("Failed to load data. Please try again.");
    });
}

function getUserLocation() {
  return fetch("https://ipapi.co/json/")
    .then((res) => res.json())
    .then((data) => ({
      city: data.city,
      region: data.region,
      country: data.country_name,
    }));
}

function updateLocationUI(location) {
  document.getElementById("location").textContent =
    `${location.city}, ${location.region}, ${location.country}`;
}

function getWeather(location) {
  const apiKey = "4a6c647a6a05f19478e81fcf3f83d264"; // OpenWeatherMap
  const url = `https://api.openweathermap.org/data/2.5/weather?q=${location.city}&appid=${apiKey}&units=metric`;

  return fetch(url)
    .then((res) => res.json())
    .then((data) => ({
      description: data.weather[0].main,
      temperature: data.main.temp,
    }));
}

function updateWeatherUI(weather) {
  document.getElementById("weather").textContent =
    `${weather.description}, ${weather.temperature.toFixed(1)}°C`;
  document.body.className = getWeatherClass(weather.description);
}

function getWeatherClass(desc) {
  const type = desc.toLowerCase();
  if (type.includes("sun")) return "sunny";
  if (type.includes("cloud")) return "cloudy";
  if (type.includes("rain")) return "rainy";
  if (type.includes("snow")) return "snowy";
  return "";
}

function getTrends(city) {
  return fetch(`https://api.popcat.xyz/trending?country=india`)
    .then((res) => res.json())
    .then((data) => data.trending.slice(0, 5)); // top 5 trends
}

function updateTrendsUI(trends) {
  document.getElementById("trends").textContent = trends.join(", ");
}

function getRecommendations(weather) {
  return fetch("http://localhost:8080/ml-recommend", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(weather),
  })
    .then((res) => res.json())
    .then((data) => fetchYouTubeVideos(data.category));
}

function fetchYouTubeVideos(category) {
  const videos = {
    travel: [
      {
        title: "Top 10 Travel Destinations",
        thumbnail: "https://img.youtube.com/vi/1h5iv6sECGU/0.jpg",
        link: "https://www.youtube.com/watch?v=1h5iv6sECGU",
      },
    ],
    music: [
      {
        title: "Relaxing Chill Music",
        thumbnail: "https://img.youtube.com/vi/5qap5aO4i9A/0.jpg",
        link: "https://www.youtube.com/watch?v=5qap5aO4i9A",
      },
    ],
    food: [
      {
        title: "Street Food Around the World",
        thumbnail: "https://img.youtube.com/vi/9fGkysB1zZw/0.jpg",
        link: "https://www.youtube.com/watch?v=9fGkysB1zZw",
      },
    ],
    news: [
      {
        title: "World News Live",
        thumbnail: "https://img.youtube.com/vi/21X5lGlDOfg/0.jpg",
        link: "https://www.youtube.com/watch?v=21X5lGlDOfg",
      },
    ],
    default: [
      {
        title: "Top Picks for You",
        thumbnail: "https://img.youtube.com/vi/oUFJJNQGwhk/0.jpg",
        link: "https://www.youtube.com/watch?v=oUFJJNQGwhk",
      },
    ],
  };

  return videos[category] || videos["default"];
}

function updateRecommendationsUI(videos) {
  const container = document.getElementById("videos");
  container.innerHTML = "";
  videos.forEach((video) => {
    const card = document.createElement("div");
    card.className = "recommendation-card";
    card.innerHTML = `
      <img src="${video.thumbnail}" alt="${video.title}">
      <h3>${video.title}</h3>
      <a class="search-button" href="${video.link}" target="_blank">Watch</a>
    `;
    container.appendChild(card);
  });
}

function showLoading(show) {
  const loader = document.querySelector(".loader");
  if (loader) loader.style.display = show ? "block" : "none";
}

/* ===== DASHBOARD ANALYTICS LOGIC FOR dashboard.html ===== */

function fetchDashboardData() {
  fetch("http://localhost:8080/dashboard")
    .then((response) => {
      if (!response.ok) {
        throw new Error("Network response was not OK");
      }
      return response.json();
    })
    .then((data) => {
      document.getElementById("total-requests").textContent =
        data.total_requests ?? "N/A";
      document.getElementById("common-weather").textContent =
        data.common_weather ?? "N/A";
      document.getElementById("ml-category").textContent =
        data.ml_category ?? "N/A";
      document.getElementById("top-city").textContent =
        data.top_city ?? "N/A";
    })
    .catch((error) => {
      console.error("Error fetching dashboard data:", error);
      document.getElementById("total-requests").textContent = "Error";
      document.getElementById("common-weather").textContent = "Error";
      document.getElementById("ml-category").textContent = "Error";
      document.getElementById("top-city").textContent = "Error";
    });
}
