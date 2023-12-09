// 2023.12.02 김건학
// pposong.html의 대중교통 루트 그리는 함수 pposong.js로 분리

import { dfs_xy_conv } from "./convert_XY.js";
import { convertTimeFormat, addTime } from "./cal_time.js";

export function get_RouteLine(Route) {
  for (var idx = 0; idx < Route.SubPaths.length; idx++) {
    var subpath = Route.SubPaths[idx];
    var linePath = [];
    var Color;

    // 도보 구간
    if (subpath.Type == "WALK") continue;

    // 버스 구간
    if (subpath.Type == "BUS") Color = subpath.LaneInfo[0].BusColor;
    // 지하철 구간
    else if (subpath.Type == "SUBWAY") {
      Color = subpath.SubwayColor;
    }

    var stationinfo = subpath.StationInfo;
    for (var station_idx = 0; station_idx < stationinfo.length; station_idx++) {
      // line 저장
      linePath.push(
        new kakao.maps.LatLng(stationinfo[station_idx].Lat, stationinfo[station_idx].Lon)
      );
    }

    // 지도에 표시할 선을 생성합니다
    var polyline = new kakao.maps.Polyline({
      path: linePath, // 선을 구성하는 좌표배열 입니다
      strokeWeight: 10, // 선의 두께 입니다
      strokeColor: `${Color}`, // 선의 색깔입니다
      strokeOpacity: 1, // 선의 불투명도 입니다 1에서 0 사이의 값이며 0에 가까울수록 투명합니다
      strokeStyle: "solid", // 선의 스타일입니다
    });
    // 지도에 선을 표시합니다
    polyline.setMap(map);
  }
}

export function get_WalkData(Route, time) {
  var Walk_Data = [];
  var cur_time = time;
  var cur_basetime;

  for (var idx = 0; idx < Route.SubPaths.length; idx++) {
    var subpath = Route.SubPaths[idx];
    // 도보 구간
    if (subpath.Type == "WALK") {
      var MidLat = (subpath.StartLat + subpath.EndLat) / 2;
      var MidLon = (subpath.StartLon + subpath.EndLon) / 2;
      var xy = dfs_xy_conv("toXY", MidLat, MidLon);
      cur_basetime = convertTimeFormat(cur_time);

      var cur_walkdata = {
        MidLat: MidLat,
        MidLon: MidLon,
        X: xy.x,
        Y: xy.y,
        basetime: cur_basetime,
      };
      Walk_Data.push(cur_walkdata);
    }

    cur_time = addTime(cur_time, subpath.SectionTime);
  }

  return Walk_Data;
}
