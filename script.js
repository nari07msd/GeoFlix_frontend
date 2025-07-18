const BACKEND_URL = "https://geoflixbackend-production.up.railway.app";
const WEATHER_API_KEY = "82ef7eb8c710a4d63f28712218fd2b3e";

// Helpers for UI
function showLoading() {
    const loading = document.getElementById("loading");
    if (loading) loading.style.display = "block";
}

function hideLoading() {
    const loading = document.getElementById("loading");
    if (loading) loading.style.display = "none";
}

function showError(message) {
    const error = document.getElementById("error");
    if (error) {
        error.innerText = message;
        error.style.display = "block";
    }
}

// === GeoFlix Recommendation Logic ===
async function loadGeoFlix() {
    showLoading();

    try {
        // Get location
        const locRes = await fetch("https://ipapi.co/json/");
        const locData = await locRes.json();
        const city = locData.city;

        // Get weather
        const weatherRes = await fetch(`https://api.openweathermap.org/data/2.5/weather?q=${city}&appid=${WEATHER_API_KEY}&units=metric`);
        const weatherData = await weatherRes.json();
        const condition = weatherData.weather[0].main;
        const temperature = weatherData.main.temp;

        // Get ML Recommendation
        const mlRes = await fetch(`${BACKEND_URL}/ml-recommend`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ condition, temperature })
        });
        const mlData = await mlRes.json();

        // Get Trends
        const trendRes = await fetch(`${BACKEND_URL}/trends?city=${city}`);
        const trendData = await trendRes.json();

        // Update UI
        document.getElementById("location").innerText = city;
        document.getElementById("condition").innerText = condition;
        document.getElementById("temperature").innerText = `${temperature}°C`;
        document.getElementById("category").innerText = mlData.category;
        document.getElementById("trend").innerText = trendData.trend;

    } catch (err) {
        console.error(err);
        showError("Something went wrong.");
    }

    hideLoading();
}

// === Dashboard Analytics Logic ===
async function loadDashboard() {
    showLoading();

    try {
        const res = await fetch(`${BACKEND_URL}/dashboard`);
        const data = await res.json();

        if (data.message) {
            document.getElementById("analytics").innerText = data.message;
        } else {
            document.getElementById("total").innerText = data.total_predictions;
            document.getElementById("common").innerText = data.most_common_category;
            document.getElementById("average").innerText = `${data.average_temperature}°C`;

            const condList = document.getElementById("conditions");
            condList.innerHTML = "";
            for (let cond in data.condition_distribution) {
                const li = document.createElement("li");
                li.innerText = `${cond}: ${data.condition_distribution[cond]}`;
                condList.appendChild(li);
            }
        }
    } catch (err) {
        console.error(err);
        showError("Failed to load dashboard.");
    }

    hideLoading();
}

// === Page Initialization ===
document.addEventListener("DOMContentLoaded", () => {
    if (document.getElementById("category")) {
        loadGeoFlix();
    } else if (document.getElementById("analytics")) {
        loadDashboard();
    }
});
