const backendUrl = "https://geoflixbackend-production.up.railway.app"; // replace if changed

document.addEventListener("DOMContentLoaded", () => {
  const isDashboard = window.location.pathname.includes("dashboard");

  if (isDashboard) {
    loadDashboard();
  } else {
    initApp();
  }
});

function initApp() {
  const loading = document.getElementById("loading");
  const result = document.getElementById("result");
  const error = document.getElementById("error");

  loading.style.display = "block";

  if (!navigator.geolocation) {
    showError("Geolocation not supported");
    return;
  }

  navigator.geolocation.getCurrentPosition(async (position) => {
    const lat = position.coords.latitude;
    const lon = position.coords.longitude;

    try {
      const cityRes = await fetch(`https://ipapi.co/json/`);
      const cityData = await cityRes.json();
      const city = cityData.city || "Global";

      const weatherRes = await fetch(
        `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=82ef7eb8c710a4d63f28712218fd2b3e&units=metric`
      );
      const weatherData = await weatherRes.json();

      const condition = weatherData.weather[0].main;
      const temperature = weatherData.main.temp;

      const mlRes = await fetch(`${backendUrl}/ml-recommend`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ condition, temperature }),
      });

      const mlData = await mlRes.json();

      const trendRes = await fetch(`${backendUrl}/trends?city=${city}`);
      const trendData = await trendRes.json();

      document.getElementById("category").textContent = mlData.category;
      document.getElementById("trend").textContent = trendData.trend;

      loading.style.display = "none";
      result.style.display = "block";
    } catch (err) {
      console.error(err);
      showError("Failed to fetch data.");
    }
  }, () => showError("Location access denied."));
}

function loadDashboard() {
  const dashError = document.getElementById("dash_error");

  fetch(`${backendUrl}/dashboard`)
    .then(res => res.json())
    .then(data => {
      if (data.message) {
        dashError.style.display = "block";
        return;
      }

      document.getElementById("total_predictions").textContent = data.total_predictions;
      document.getElementById("most_common_category").textContent = data.most_common_category;
      document.getElementById("average_temperature").textContent = data.average_temperature;

      const ul = document.getElementById("condition_distribution");
      ul.innerHTML = "";
      for (const [condition, count] of Object.entries(data.condition_distribution)) {
        const li = document.createElement("li");
        li.textContent = `${condition}: ${count}`;
        ul.appendChild(li);
      }
    })
    .catch(err => {
      console.error(err);
      dashError.style.display = "block";
    });
}

function showError(message) {
  document.getElementById("loading").style.display = "none";
  const error = document.getElementById("error");
  if (error) {
    error.textContent = message;
    error.style.display = "block";
  }
}
