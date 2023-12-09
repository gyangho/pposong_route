/* 지도 확대/축소 레벨 설정 */
const ZOOMIN = 8;
const ZOOMOUT = 4;

/*북마크 기능 */
function toggleBookmark() { //북마크 버튼 클릭 시 아이콘 효과
    const bottomBox = document.querySelector('.bottom');
    const bookmarkIcon = document.querySelector('.fa-bookmark');
    bottomBox.classList.toggle('active');
    bottomBox.classList.remove('initial');
    bookmarkIcon.classList.toggle('active');
}
// 북마크 버튼 클릭 시 화면 하단 bottom 박스에 bookmark.html 내용 fetch
document.querySelector('.bookmark-btn').addEventListener('click', function () {
    fetch('bookmark.html')
        .then(response => response.text())
        .then(data => {
            //초기화(이전에 추가된 요소 제거)
            const elementToDelete = document.querySelector('.bookmark-screen');
            if (elementToDelete) {
                elementToDelete.remove();
            }
            // 가져온 HTML을 파싱하여 DOM으로 변환
            const parser = new DOMParser();
            const htmlDocument = parser.parseFromString(data, 'text/html');
            // 원하는 요소를 가져오기 위해 해당 선택자로 요소 추출
            const extractedElement = htmlDocument.querySelector('.bookmark-screen');
            // 추출한 요소 삽입
            document.querySelector('.bottom').appendChild(extractedElement);
        })
        .catch(error => {
            console.error('Error.', error);
        });
});

/* 현재 위치에 마크업 및 포커스 기능*/
let marker = null;
function showLocation() {
    // 위치 버튼 클릭 시 아이콘 효과
    const locationIcon = document.querySelector('.fa-location-crosshairs');
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
            marker.setMap(null);
            marker = null;
            map.setLevel(ZOOMIN);
            return;
        }
        // 현위치에 마커 생성
        marker = new kakao.maps.Marker({
            map: map,
            position: locPosition
        });
        // 지도 중심좌표를 현위치로 변경
        map.setLevel(ZOOMOUT);
        map.setCenter(locPosition);
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