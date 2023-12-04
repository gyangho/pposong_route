// 격자
var locArr = [
  [61, 129],
  [62, 129],
  [59, 128],
  [60, 128],
  [61, 128],
  [62, 128],
  [57, 127],
  [58, 127],
  [59, 127],
  [60, 127],
  [61, 127],
  [62, 127],
  [63, 127],
  [57, 126],
  [58, 126],
  [59, 126],
  [60, 126],
  [61, 126],
  [62, 126],
  [63, 126],
  [57, 125],
  [58, 125],
  [59, 125],
  [60, 125],
  [61, 125],
  [62, 125],
  [63, 125],
  [58, 124],
  [59, 124],
  [61, 124],
];

// 위도
var lat_line = [
  37.69173846, 37.64577895, 37.60262058, 37.55674696, 37.51063517, 37.46494092, 37.42198141,
];
// 경도
var lon_line = [
  126.7851093, 126.8432583, 126.9010823, 126.9599082, 127.0180783, 127.0766389, 127.1340031,
  127.1921521,
];

var grid_count = 30;
var grid_bounds = [];
var grid_objects = new Array(grid_count);

// sw : 남서, ne : 북동
var sw, ne;

for (let lat_idx = 1; lat_idx < lat_line.length; lat_idx++) {
  for (let lon_idx = 0; lon_idx < lon_line.length - 1; lon_idx++) {
    // 격자가 서울 밖이면 continue
    if (lat_idx == 1 && lon_idx != 4 && lon_idx != 5) continue;
    else if (lat_idx == 2 && lon_idx != 2 && lon_idx != 3 && lon_idx != 4 && lon_idx != 5) continue;
    else if (lat_idx == 6 && lon_idx != 1 && lon_idx != 2 && lon_idx != 4) continue;

    sw = new kakao.maps.LatLng(lat_line[lat_idx - 1], lon_line[lon_idx]); // 남서
    ne = new kakao.maps.LatLng(lat_line[lat_idx], lon_line[lon_idx + 1]); // 북동

    grid_bounds.push(new kakao.maps.LatLngBounds(sw, ne));
  }
}

function hideGrid(grid_objects) {
  for (var idx = 0; idx < grid_count; idx++) {
    if (grid_objects[idx]) {
      grid_objects[idx].setMap(null);
    }
  }
}
// 강수량에 따른 격자 색(하늘색 --> 검정색)
function getFillColor(rainfall) {
  var fillColor = "#000000";

  if (rainfall === 0) {
    fillColor = "#FFFFFF";
  } else if (rainfall === 1) {
    fillColor = "#daf4f7";
  } else if (rainfall < 2) {
    fillColor = "#cce8f3";
  } else if (rainfall < 4) {
    fillColor = "#b9dcf0";
  } else if (rainfall < 6) {
    fillColor = "#a7d0ec";
  } else if (rainfall < 8) {
    fillColor = "#94c4e9";
  } else if (rainfall < 10) {
    fillColor = "#82b8e5";
  } else if (rainfall < 12) {
    fillColor = "#6faee2";
  } else if (rainfall < 14) {
    fillColor = "#5da2de";
  } else if (rainfall < 16) {
    fillColor = "#4a96db";
  } else if (rainfall < 18) {
    fillColor = "#388ad7";
  } else if (rainfall < 20) {
    fillColor = "#257ed4";
  } else if (rainfall < 22) {
    fillColor = "#1372d0";
  } else if (rainfall < 24) {
    fillColor = "#0066cd";
  } else if (rainfall < 26) {
    fillColor = "#005abb";
  } else if (rainfall < 28) {
    fillColor = "#0042a9";
  } else if (rainfall === 30) {
    fillColor = "#003097";
  } else if (rainfall === 50) {
    fillColor = "#001885";
  }

  return fillColor;
}

function showGrid(time) {
  // grid_objects = new Array(grid_count);

  hideGrid(grid_objects);
  // 격자 개수만큼 반복
  for (var idx = 0; idx < grid_count; idx++) {
    var fillColor = getFillColor(receivedData[idx][time].RN1);
    var fillOpacity = fillColor === "#FFFFFF" ? 0 : 0.4; // 조건에 따라 fillOpacity 설정

    grid_objects[idx] = new kakao.maps.Rectangle({
      bounds: grid_bounds[idx], // 그려질 사각형의 영역정보입니다
      strokeWeight: 3, // 선의 두께입니다
      strokeColor: "#FF0000", // 선의 색깔입니다
      strokeOpacity: 1, // 선의 불투명도 입니다 1에서 0 사이의 값이며 0에 가까울수록 투명합니다
      strokeStyle: "solid", // 선의 스타일입니다
      fillColor: fillColor, // 채우기 색깔입니다
      fillOpacity: fillOpacity, // 채우기 불투명도 입니다
    });

    // 지도에 사각형을 표시합니다
    grid_objects[idx].setMap(map);
  }
}

window.showGrid = showGrid; // 전역 스코프에 showGrid 함수 추가
