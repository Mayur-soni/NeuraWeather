const apiKey = '51179d408fddc7d19ac7611f5e2ddd42'; // Your OpenWeatherMap API key

// DOM Elements
const cityInput = document.getElementById('cityInput');
const searchBtn = document.getElementById('searchBtn');
const currentDay = document.getElementById('currentDay');
const currentTime = document.getElementById('currentTime');
const locationName = document.getElementById('locationName');
const currentConditions = document.getElementById('currentConditions');
const currentTemp = document.getElementById('currentTemp');
const currentWeatherIcon = document.getElementById('currentWeatherIcon');
const feelsLike = document.getElementById('feelsLike');
const humidity = document.getElementById('humidity');
const windSpeed = document.getElementById('windSpeed');
const pressure = document.getElementById('pressure');
const sunrise = document.getElementById('sunrise');
const sunset = document.getElementById('sunset');
const visibility = document.getElementById('visibility');
const cloudCover = document.getElementById('cloudCover');
const todayForecast = document.getElementById('todayForecast');
const hourlyForecast = document.getElementById('hourlyForecast');
const dailyForecast = document.getElementById('dailyForecast');
const tempUnit = document.getElementById('tempUnit');
const windUnit = document.getElementById('windUnit');
const darkModeToggle = document.getElementById('darkModeToggle');
const toggleThemeBtn = document.getElementById('toggleThemeBtn');
const themeIcon = document.getElementById('themeIcon');
const mapView = document.getElementById('mapView');

let map;
let currentCity = 'New York';

// Initialize the app
function initApp() {
    updateDateTime();
    setInterval(updateDateTime, 60000);
    
    // Set up event listeners
    searchBtn.addEventListener('click', handleSearch);
    cityInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') handleSearch();
    });
    
    tempUnit.addEventListener('change', () => {
        if (currentCity) fetchWeather(currentCity);
    });
    
    windUnit.addEventListener('change', () => {
        if (currentCity) fetchWeather(currentCity);
    });
    
    darkModeToggle.addEventListener('change', toggleTheme);
    toggleThemeBtn.addEventListener('click', toggleTheme);
    
    // Set default city to Ahmedabad
    currentCity = 'Ahmedabad';
    cityInput.value = currentCity;
    
    // Initialize map centered on Ahmedabad
    initMap(23.0225, 72.5714); // Ahmedabad coordinates
    
    // Fetch Ahmedabad weather immediately
    fetchWeather(currentCity);
    
    // Populate year select for calendar
    const yearSelect = document.getElementById('yearSelect');
    const currentYear = new Date().getFullYear();
    for (let year = currentYear - 5; year <= currentYear + 5; year++) {
        const option = document.createElement('option');
        option.value = year;
        option.textContent = year;
        if (year === currentYear) option.selected = true;
        yearSelect.appendChild(option);
    }
    
    // Calendar event listeners
    document.getElementById('monthSelect').addEventListener('change', updateCalendar);
    document.getElementById('yearSelect').addEventListener('change', updateCalendar);
}

// Update date and time display
function updateDateTime() {
    const now = new Date();
    const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    currentDay.textContent = now.toLocaleDateString(undefined, options);
    
    const timeOptions = { hour: '2-digit', minute: '2-digit' };
    currentTime.textContent = now.toLocaleTimeString(undefined, timeOptions);
}

// Handle city search
function handleSearch() {
    const city = cityInput.value.trim();
    if (city) {
        currentCity = city;
        fetchWeather(city);
    }
}

// Fetch weather data from API
async function fetchWeather(city) {
    try {
        const unit = tempUnit.value;
        const response = await fetch(`https://api.openweathermap.org/data/2.5/weather?q=${city}&units=${unit}&appid=${apiKey}`);
        const data = await response.json();
        
        if (data.cod !== 200) {
            alert('City not found. Please try again.');
            return;
        }
        
        // Update current weather display
        updateCurrentWeather(data);
        
        // Fetch forecast data
        const forecastResponse = await fetch(`https://api.openweathermap.org/data/2.5/forecast?q=${city}&units=${unit}&appid=${apiKey}`);
        const forecastData = await forecastResponse.json();
        
        // Update forecasts
        updateTodayForecast(forecastData.list);
        updateHourlyForecast(forecastData.list);
        updateDailyForecast(forecastData.list);
        
        // Update map
        updateMap(data.coord.lat, data.coord.lon);
        
    } catch (error) {
        console.error('Error fetching weather data:', error);
        alert('Error fetching weather data. Please try again.');
    }
}

// Update current weather display
function updateCurrentWeather(data) {
    const unitSymbol = tempUnit.value === 'imperial' ? '°F' : '°C';
    const windSpeedUnit = getWindSpeedUnit();
    
    locationName.textContent = `${data.name}, ${data.sys.country}`;
    currentConditions.textContent = data.weather[0].main;
    currentTemp.textContent = `${Math.round(data.main.temp)}${unitSymbol}`;
    currentWeatherIcon.src = `https://openweathermap.org/img/wn/${data.weather[0].icon}@2x.png`;
    feelsLike.textContent = `${Math.round(data.main.feels_like)}${unitSymbol}`;
    humidity.textContent = `${data.main.humidity}%`;
    windSpeed.textContent = `${convertWindSpeed(data.wind.speed)} ${windSpeedUnit}`;
    pressure.textContent = `${data.main.pressure} hPa`;
    
    // Convert sunrise/sunset times
    const sunriseTime = new Date(data.sys.sunrise * 1000);
    const sunsetTime = new Date(data.sys.sunset * 1000);
    sunrise.textContent = sunriseTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    sunset.textContent = sunsetTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    
    visibility.textContent = `${(data.visibility / 1000).toFixed(1)} km`;
    cloudCover.textContent = `${data.clouds.all}%`;
}

// Update today's forecast
function updateTodayForecast(forecastList) {
    todayForecast.innerHTML = '';
    const now = new Date();
    const currentHour = now.getHours();
    
    // Get forecasts for the next 12 hours
    const todayForecasts = forecastList.filter(item => {
        const forecastTime = new Date(item.dt * 1000);
        return forecastTime.getDate() === now.getDate() && 
               forecastTime.getMonth() === now.getMonth() && 
               forecastTime.getFullYear() === now.getFullYear() &&
               forecastTime.getHours() > currentHour;
    }).slice(0, 6); // Show next 6 forecasts
    
    todayForecasts.forEach(item => {
        const forecastTime = new Date(item.dt * 1000);
        const timeStr = forecastTime.toLocaleTimeString([], { hour: '2-digit' });
        const temp = Math.round(item.main.temp);
        const unitSymbol = tempUnit.value === 'imperial' ? '°F' : '°C';
        
        const forecastItem = document.createElement('div');
        forecastItem.className = 'hourly-item';
        forecastItem.innerHTML = `
            <span>${timeStr}</span>
            <img src="https://openweathermap.org/img/wn/${item.weather[0].icon}.png" alt="${item.weather[0].description}" class="weather-icon">
            <span>${temp}${unitSymbol}</span>
        `;
        
        todayForecast.appendChild(forecastItem);
    });
}

// Update hourly forecast
function updateHourlyForecast(forecastList) {
    hourlyForecast.innerHTML = '';
    const next24Hours = forecastList.slice(0, 8); // Get next 24 hours (3-hour intervals)
    
    next24Hours.forEach(item => {
        const forecastTime = new Date(item.dt * 1000);
        const timeStr = forecastTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        const temp = Math.round(item.main.temp);
        const unitSymbol = tempUnit.value === 'imperial' ? '°F' : '°C';
        
        const forecastItem = document.createElement('div');
        forecastItem.className = 'hourly-item';
        forecastItem.innerHTML = `
            <span>${timeStr}</span>
            <img src="https://openweathermap.org/img/wn/${item.weather[0].icon}.png" alt="${item.weather[0].description}" class="weather-icon">
            <span>${temp}${unitSymbol}</span>
            <span>${item.weather[0].main}</span>
        `;
        
        hourlyForecast.appendChild(forecastItem);
    });
}

// Update daily forecast
function updateDailyForecast(forecastList) {
    dailyForecast.innerHTML = '';
    const dailyData = {};
    
    // Group forecasts by day
    forecastList.forEach(item => {
        const date = new Date(item.dt * 1000);
        const dateStr = date.toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric' });
        
        if (!dailyData[dateStr]) {
            dailyData[dateStr] = {
                temps: [],
                icons: [],
                descriptions: []
            };
        }
        
        dailyData[dateStr].temps.push(item.main.temp);
        dailyData[dateStr].icons.push(item.weather[0].icon);
        dailyData[dateStr].descriptions.push(item.weather[0].main);
    });
    
    // Create cards for each day
    Object.keys(dailyData).slice(0, 5).forEach(date => {
        const dayData = dailyData[date];
        const avgTemp = Math.round(dayData.temps.reduce((a, b) => a + b, 0) / dayData.temps.length);
        const unitSymbol = tempUnit.value === 'imperial' ? '°F' : '°C';
        const mostCommonIcon = getMostCommonValue(dayData.icons);
        const mostCommonDesc = getMostCommonValue(dayData.descriptions);
        
        const forecastCard = document.createElement('div');
        forecastCard.className = 'weather-card';
        forecastCard.innerHTML = `
            <h5>${date}</h5>
            <img src="https://openweathermap.org/img/wn/${mostCommonIcon}@2x.png" alt="${mostCommonDesc}" class="weather-icon">
            <p>${mostCommonDesc}</p>
            <p>${avgTemp}${unitSymbol}</p>
        `;
        
        dailyForecast.appendChild(forecastCard);
    });
}

// Helper function to get most common value in array
function getMostCommonValue(arr) {
    const counts = {};
    arr.forEach(val => counts[val] = (counts[val] || 0) + 1);
    return Object.keys(counts).reduce((a, b) => counts[a] > counts[b] ? a : b);
}

// Initialize map
function initMap(lat, lon) {
    map = L.map('mapView').setView([lat, lon], 10);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
    }).addTo(map);
    
    L.marker([lat, lon]).addTo(map)
        .bindPopup('Current Location')
        .openPopup();
}

// Update map location
function updateMap(lat, lon) {
    if (!map) {
        initMap(lat, lon);
    } else {
        map.setView([lat, lon], 10);
        map.eachLayer(layer => {
            if (layer instanceof L.Marker) {
                map.removeLayer(layer);
            }
        });
        L.marker([lat, lon]).addTo(map)
            .bindPopup('Current Location')
            .openPopup();
    }
}

// Use geolocation to find user's location
function locateMe() {
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(position => {
            const lat = position.coords.latitude;
            const lon = position.coords.longitude;
            
            // Reverse geocode to get city name
            fetch(`https://api.openweathermap.org/geo/1.0/reverse?lat=${lat}&lon=${lon}&limit=1&appid=${apiKey}`)
                .then(response => response.json())
                .then(data => {
                    if (data && data.length > 0) {
                        const city = data[0].name;
                        cityInput.value = city;
                        currentCity = city;
                        fetchWeather(city);
                    }
                });
                
            updateMap(lat, lon);
        }, () => {
            alert('Unable to retrieve your location');
        });
    } else {
        alert('Geolocation is not supported by your browser');
    }
}

// Switch between pages
function switchPage(pageId) {
    document.querySelectorAll('.page-section').forEach(page => {
        page.classList.add('d-none');
    });
    
    document.getElementById(`page-${pageId}`).classList.remove('d-none');
    
    document.querySelectorAll('#sidebar .nav-link').forEach(link => {
        link.classList.remove('active');
    });
    event.target.classList.add('active');
    
    // If switching to map, update map size
    if (pageId === 'map' && map) {
        setTimeout(() => {
            map.invalidateSize();
        }, 300);
    }
    
    // If switching to calendar, update it
    if (pageId === 'calendar') {
        updateCalendar();
    }
}

// Update calendar display
function updateCalendar() {
    const monthSelect = document.getElementById('monthSelect');
    const yearSelect = document.getElementById('yearSelect');
    const month = monthSelect.value;
    const year = parseInt(yearSelect.value);
    
    generateCalendar(year, month);
}

// Generate calendar
function generateCalendar(year, selectedMonth = "all") {
    const container = document.getElementById('calendarContainer');
    container.innerHTML = '';

    const months = [
        "January", "February", "March", "April", "May", "June",
        "July", "August", "September", "October", "November", "December"
    ];

    const today = new Date();
    const todayDate = today.getDate();
    const todayMonth = today.getMonth();
    const todayYear = today.getFullYear();

    let start = 0, end = 11;
    if (selectedMonth !== "all") {
        start = parseInt(selectedMonth);
        end = start;
    }

    for (let m = start; m <= end; m++) {
        const daysInMonth = new Date(year, m + 1, 0).getDate();
        const firstDay = new Date(year, m, 1).getDay();

        let html = `<div class="card p-3 shadow-sm calendar-card">
            <h5 class="mb-3">${months[m]} ${year}</h5>
            <table class="table table-bordered text-center mb-0">
                <thead><tr>
                    <th>Su</th><th>Mo</th><th>Tu</th><th>We</th><th>Th</th><th>Fr</th><th>Sa</th>
                </tr></thead><tbody><tr>`;

        let dayCell = 0;
        for (let i = 0; i < firstDay; i++) {
            html += "<td></td>";
            dayCell++;
        }

        for (let d = 1; d <= daysInMonth; d++) {
            if (dayCell % 7 === 0 && d !== 1) html += "</tr><tr>";

            let highlightClass = '';
            if (year === todayYear && m === todayMonth && d === todayDate) {
                highlightClass = 'bg-primary text-white';
            }

            html += `<td class="${highlightClass}">${d}</td>`;
            dayCell++;
        }

        while (dayCell % 7 !== 0) {
            html += "<td></td>";
            dayCell++;
        }

        html += "</tr></tbody></table></div>";
        container.innerHTML += html;
    }
}

// Toggle dark/light theme
function toggleTheme() {
    document.body.setAttribute('data-theme', 
        document.body.getAttribute('data-theme') === 'dark' ? 'light' : 'dark');
    
    // Update icon
    if (document.body.getAttribute('data-theme') === 'dark') {
        themeIcon.className = 'fas fa-sun';
        darkModeToggle.checked = true;
    } else {
        themeIcon.className = 'fas fa-moon';
        darkModeToggle.checked = false;
    }
}

// Convert wind speed based on selected unit
function convertWindSpeed(speed) {
    const unit = windUnit.value;
    
    if (unit === 'mph') {
        return (speed * 2.237).toFixed(1); // m/s to mph
    } else if (unit === 'kmh') {
        return (speed * 3.6).toFixed(1); // m/s to km/h
    }
    return speed.toFixed(1); // default m/s
}

// Get wind speed unit label
function getWindSpeedUnit() {
    switch (windUnit.value) {
        case 'mph': return 'mph';
        case 'kmh': return 'km/h';
        default: return 'm/s';
    }
}

// Initialize the app when DOM is loaded
document.addEventListener('DOMContentLoaded', initApp);