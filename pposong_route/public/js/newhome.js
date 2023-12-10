/* 지도 확대/축소 레벨 설정 */
const ZOOMIN = 4;
const ZOOMOUT = 9;

/* 날씨 정보 데이터 받아오는 부분 */
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

            // location.innerText =`${data.name}`;
            location.innerText = `내 위치 현재온도`;
            temp.innerText = `${parseInt(data.main.temp)}°`;
            tempFeel.innerText = `체감온도 ${parseInt(data.main.feels_like)}°`;

            const weatherIconCode = data.weather[0].icon;
            weatherIcon.src = `image/weather-icon/${weatherIconCode}.png`;
            weather.innerText = data.weather[0].main;

            humid.innerText = `${data.main.humidity}%`;
            wind.innerText = `${data.wind.speed}m/s`;

        })
}

function onGeoError() {
    alert("Error: 위치 추적을 허용해 주세요.");
}

/* bottom-bar experimental */
// 날씨 버튼 클릭 시 날씨 show
document.querySelector('.weather-btn').addEventListener('click', function () {

    const bottomBar = document.querySelector('.bottom-bar');
    const content = document.querySelector('.content');
    const weatherIcon = document.querySelector('.weather-btn i');
    const bookmarkIcon = document.querySelector('.bookmark-btn i');

    // 아이콘 효과
    weatherIcon.classList.toggle('active');
    // 하단 창 띄우기
    bottomBar.removeAttribute('hidden');

    if (weatherIcon.classList.contains('active')) {
        // 하단 창 보이게 하기(slide-up)
        bottomBar.classList.remove('hide-bottom-bar');
        // content에 날씨 정보 띄울 공간 생성
        content.innerHTML = `
    <div class="home-component">
      <div class="home-column home-weather fixed">
          <div class="location">
              <i class="fa-solid fa-location-arrow"></i>
              <span class="location-name text"></span>
          </div>
              <span class="temp-now">--.--°</span>
              <span class="temp-feel text">체감온도 --.--°</span>
      </div>
      <div class="home-column home-weather fixed">
          <span class="text">날씨 상태</span>
          <img class="weather-icon"/>
          <span class="weather-now text">Weather</span>
      </div>
      <div class="home-column home-weather fixed">
          <div class="etc-info">
          <span>습도<span><br>
          <span class="humid">--%</span>
          </div>
          <div class="etc-info">
          <span>풍속</span>
          <span class="wind">-.-m/s</span>
          </div>    
      </div>
    </div>`;
        // content에 날씨 정보 넣기
        navigator.geolocation.getCurrentPosition(onGeoSuccess, onGeoError);

        // 북마크active된 상태에서 클릭되었을 때 -> 북마크 아이콘 active 해제
        if (bookmarkIcon.classList.contains('active')) {
            bookmarkIcon.classList.remove('active');
        }
    } else { // 날씨버튼 클릭되었으나 active아닐때, 
        // 하단 창 내리기(slide-down)
        weatherIcon.classList.remove('active');
        bottomBar.classList.add("hide-bottom-bar");
    }
});

// 북마크 버튼 클릭 시 북마크 show
document.querySelector('.bookmark-btn').addEventListener('click', function () {

    const bottomBar = document.querySelector('.bottom-bar');
    const content = document.querySelector('.content');
    const weatherIcon = document.querySelector('.weather-btn i');
    const bookmarkIcon = document.querySelector('.bookmark-btn i')

    bookmarkIcon.classList.toggle('active'); //아이콘 효과

    bottomBar.removeAttribute('hidden');

    if (bookmarkIcon.classList.contains('active')) {
        // 하단 창 보이게 하기(slide-up)
        bottomBar.classList.remove('hide-bottom-bar');
        // 기존 content 내용 북마크 내용으로 변경 (하단 창에 북마크 show)
        content.innerHTML = `
    <div class="bookmark-component">
      
      <div class="bookmark-column">
        <div class="bookmark__route-icon">
        <i class="fa-solid fa-route fa-xl"></i>
        </div>
        <div class="bookmark__info">
          <h4 class="bookmark__location">9호선 신반포역<i class="fa-solid fa-arrow-right"></i>숭실대학교 정보과학관</h4>
          <h6 class="bookmark__vehicle">
            <i class="fa-solid fa-bus"></i>540, 643
            <i class="fa-solid fa-chevron-right"></i>
            <i class="fa-solid fa-bus"></i>752
          </h6>
        </div>
      </div>
      
      <div class="bookmark-column">
        <div class="bookmark__star-icon">
          <i class="fa-solid fa-star fa-xl"></i>
        </div>
      </div>

    </div>
    
    <div class="bookmark-component">
      
      <div class="bookmark-column">
        <div class="bookmark__route-icon">
        <i class="fa-solid fa-route fa-xl"></i>
        </div>
        <div class="bookmark__info">
          <h4 class="bookmark__location">스타벅스 남성역점<i class="fa-solid fa-arrow-right"></i>숭실대학교 정보과학관</h4>
          <h6 class="bookmark__vehicle">
            <i class="fa-solid fa-bus"></i>752
          </h6>
        </div>
      </div>
      
      <div class="bookmark-column">
        <div class="bookmark__star-icon">
          <i class="fa-solid fa-star fa-xl"></i>
        </div>
      </div>

    </div>`;

        if (weatherIcon.classList.contains('active')) { // 날씨active된 상태에서 클릭되었을 때 -> 날씨 아이콘 active 해제
            weatherIcon.classList.remove('active');
        }
    }
    else { // 북마크버튼 클릭되었으나 active아닐때, 
        // 하단 창 내리기(slide-down)
        bookmarkIcon.classList.remove('active');
        bottomBar.classList.add("hide-bottom-bar");
    }
});

////////////////////////////////////////////////////////////////////


/* 현재 위치에 마크업 및 포커스 기능*/
let marker = null;
function showLocation() {
    // 위치 버튼 클릭 시 아이콘 효과
    const locationIcon = document.querySelector('.location-btn i');
    locationIcon.classList.toggle('active');
    const locationIconClicked = locationIcon.classList.contains('active');

    // HTML5의 geolocation으로 사용할 수 있는지 확인합니다
    if (navigator.geolocation) {
        // GeoLocation을 이용해서 접속 위치를 얻어옵니다
        navigator.geolocation.getCurrentPosition(function (position) {

            var lat = position.coords.latitude, // 위도
                lon = position.coords.longitude; // 경도

            var locPosition = new kakao.maps.LatLng(lat, lon); // 마커가 표시될 위치를 geolocation으로 얻어온 좌표로 생성합니다       
            // 마커를 표시합니다
            displayMarker(locPosition);
        });

    } else { // HTML5의 GeoLocation을 사용할 수 없을때 마커 표시 위치를 설정합니다
        var locPosition = new kakao.maps.LatLng(37.566826, 126.9786567)
        displayMarker(locPosition);
    }
    //지도 위 마커 표시 함수
    function displayMarker(locPosition) {
        // 재클릭시 마크업 제거 및 지도 중심 좌표 서울 중심좌표로 변경
        if (marker) {
            var seoulCenter = new kakao.maps.LatLng(37.566826, 126.9786567);
            map.setCenter(seoulCenter);
            map.setLevel(ZOOMOUT);
            marker.setMap(null);
            marker = null;
            return;
        }
        // 현위치에 마커 생성
        marker = new kakao.maps.Marker({
            map: map,
            position: locPosition
        });
        // 지도 중심좌표를 현위치로 변경
        map.setCenter(locPosition);
        map.setLevel(ZOOMIN);
    }
}

/* 1시간 간격의 시간 값 세팅 함수*/
function calculateTime() {
    let currentTime = new Date();
    let hour = currentTime.getHours();
    let minute = currentTime.getMinutes();
    let formattedTime;
    const timeNavBtns = document.querySelectorAll('.time-nav__btn');

    // 24시간 표시법 적용
    for (let i = 0; i < timeNavBtns.length; i++) {
        let calculateHour = hour + i;
        if (calculateHour >= 24) {
            calculateHour -= 24;
        }
        // 시간값 00:00 형식으로 변환
        calculateHour = calculateHour.toString().padStart(2, '0');
        minute = minute.toString().padStart(2, '0');
        formattedTime = calculateHour + ':' + minute;
        // 버튼의 시간 값 변경
        timeNavBtns[i].innerText = formattedTime;
    }
}
calculateTime();


//2023.12.10 이경호
// 길찾기 버튼 클릭시 Odsay API 호출
document.querySelector('.searchBox').addEventListener('submit', function (event) {
    event.preventDefault();
    async function getRoutes() {
        let routesfield = document.getElementById('routes');
        let url = `https://dydtkwk.ddns.net/api/Odsay`;
        let response = await axios.get(url, {
            params: {
                start: document.getElementById('start-field').value,
                end: document.getElementById('end-field').value,
                start_lat: document.getElementById('start-lat').value,
                start_lon: document.getElementById('start-lon').value,
                end_lat: document.getElementById('end-lat').value,
                end_lon: document.getElementById('end-lon').value,
            }
        });
        routesfield.value = JSON.stringify(response.data);
    }
    getRoutes()
        .then(() => {
            event.target.submit();
        })
        .catch(error => {
            console.error('Error:', error);
        });
});