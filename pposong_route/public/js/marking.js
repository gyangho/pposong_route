//2023.12.09 채수아 생성
function getWeatherContent(weatherData) {
    return `
        <div style="padding:5px; background-color: #9fd8f6; border-radius: 12px; width:200px;">
            <p>습도 <img src="/image/22.png" width="15px" height="18px">: ${weatherData.REH}</p>
            <p>기온 <i class="fa-solid fa-temperature-three-quarters"></i> : ${weatherData.T1H}</p>
            <p>바람 <i class="fa-solid fa-wind"></i> : ${weatherData.WSD}</p>
            <p>1시간당 강수량 <i class="fa-solid fa-droplet"></i> : ${weatherData.RN1}</p>
            <p>예상되는 맞을 강수 <i class="fa-regular fa-circle-question"></i> : ${weatherData.section_RN1}</p>
        </div>`;
}

async function markingWeather(seq) {

    var PathCount = WalkData[seq].length;

    for (var i = 0; i < PathCount; i++) {

        var targetLatitude = WalkData[seq][i].MidLat;//동적 위도
        var targetLongitude = WalkData[seq][i].MidLon;//동적 경도

        var weatherData = WalkWeatherData[seq].walkData[i];//날씨 데이터 가져오기

        // 특정 위치에 강수량 글씨 표시
        // var markerPosition = new kakao.maps.LatLng(targetLatitude, targetLongitude);

        var imageSrc = '/image/23.png', // 마커이미지의 주소
            imageSize = new kakao.maps.Size(30, 35), // 마커이미지의 크기
            imageOption = { offset: new kakao.maps.Point(15, 17.5) };//point 지점에서 얼마나 떨어지게 이미지 넣을건지

        var markerImage = new kakao.maps.MarkerImage(imageSrc, imageSize, imageOption),
            markerPosition = new kakao.maps.LatLng(targetLatitude, targetLongitude);

        // 마커 추가
        var marker = new kakao.maps.Marker({
            position: markerPosition,
            image: markerImage
        });

        marker.setMap(map);//지도에 표시
        // markers.push(marker);//배열에 새로운 마커 추가

        // 인포윈도우 추가
        var infowindow = new kakao.maps.InfoWindow({
            content: getWeatherContent(weatherData),
            position: markerPosition
        });

        infowindow.open(map, marker);
    }
}