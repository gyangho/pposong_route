const API_KEY = "341611f95d76874b2e5d207c40a6b07f"

function onGeoSuccess(position) {

    const lat = position.coords.latitude;
    const lon = position.coords.longitude;
    const url = `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${API_KEY}&units=metric`;

    fetch(url)
        .then((response) => response.json())
        .then((data) => {
            // 날씨
            const weather = document.querySelector(".weather-now");
            // 날씨 아이콘
            const weatherIcon = document.querySelector(".weather-icon");
            // 온도
            const temp = document.querySelector(".temp-now");
            // 체감 온도
            const tempFeel = document.querySelector(".temp-feel");
            // 습도
            const humid = document.querySelector(".humid");
            // 풍속
            const wind = document.querySelector(".wind");
            // 위치(동 이름)
            const location = document.querySelector(".location-name");

            location.innerText = data.name;

            temp.innerText = `${data.main.temp}°`;
            tempFeel.innerText = `체감온도 ${data.main.feels_like}°`;

            const weatherIconCode = data.weather[0].icon;
            weatherIcon.src = `image/weather-icon/${weatherIconCode}.png`;
            weather.innerText = data.weather[0].main;

            humid.innerText = `습도 ${data.main.humidity}%`;
            wind.innerText = `풍속 ${data.wind.speed}m/s`;

        })
}






function onGeoError() {
    alert("Error: 위치 추적을 허용해 주세요.");
}

navigator.geolocation.getCurrentPosition(onGeoSuccess, onGeoError);