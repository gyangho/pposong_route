const axios = require("axios");
const convert = require("./convert_XY");

const path = require("path");
const dotenv = require("dotenv");
const json = require("body-parser/lib/types/json");
dotenv.config({ path: path.resolve(__dirname, ".env") });

const SubwayColorMap = {
  "수도권 1호선": "#0052A4",
  "수도권 1호선(급행)": "#0052A4",
  "수도권 1호선(특급)": "#0052A4",
  "수도권 2호선": "#00A84D",
  "수도권 3호선": "#EF7C1C",
  "수도권 4호선": "#00A5DE",
  "수도권 4호선(급행)": "#00A5DE",
  "수도권 5호선": "#996CAC",
  "수도권 6호선": "#CD7C2F",
  "수도권 7호선": "#747F00",
  "수도권 8호선": "#E6186C",
  "수도권 9호선": "#BDB092",
  "수도권 9호선(급행)": "#BDB092",
  "수도권 수인.분당선": "#F5A200",
  "수도권 수인.분당선(급행)": "#F5A200",
  "수도권 신분당선": "#D31145",
  "수도권 공항철도": "#0090D2",
  "수도권 서해선": "#8FC31F",
  경의중앙선: "#77C4A3",
  "경의중앙선(급행)": "#77C4A3",
  "수도권 에버라인": "#56AD2D",
  "수도권 경춘선": "#0C8E72",
  "경춘선(급행)": "#0C8E72",
  "수도권 의정부경전철": "#FDA600",
  "수도권 경강선": "#0054A6",
  "수도권 우이신설선": "#B0CE18",
  "수도권 서해선": "#81A914",
  "수도권 김포골드라인": "#A17800",
  "수도권 신림선": "#6789CA",
  "인천 1호선": "#7CA8D5",
  "인천 2호선": "#ED8B00",
  "대전 1호선": "#007448",
  "대구 1호선": "#D93F5C",
  "대구 2호선": "#00AA80",
  "대구 3호선": "#FFB100",
  "광주 1호선": "#009088",
  "부산 1호선": "#F06A00",
  "부산 2호선": "#81BF48",
  "부산 3호선": "#BB8C00",
  "부산 4호선": "#217DCB",
  "부산-김해경전철": "#8652A1",
};

const BusColorMap = {
  1: "#33CC99", // 시내일반
  3: "#53b332", // 지선
  4: "#e60012", // 광역
  11: "#0068b7", // 간선
  12: "#53b332", // 지선
  14: "#e60012", // 광역
  15: "#e60012", // 광역
};

class Path {
  constructor(start, end, path, TotalWalkTime, subPaths, mid_Lat, mid_Lon) {
    this.StartX = start.x;
    this.StartLat = parseFloat(start.lat);
    this.StartY = start.y;
    this.StartLon = parseFloat(start.lon);
    this.EndX = end.x;
    this.EndLat = parseFloat(end.lat);
    this.EndY = end.y;
    this.EndLon = parseFloat(end.lon);
    this.Payment = path.info.payment;
    this.TotalTime = path.info.totalTime;
    this.TotalWalk = path.info.totalWalk;
    this.TotalWalkTime = TotalWalkTime;
    this.SubPaths = subPaths;
    this.mid_Lat = mid_Lat;
    this.mid_Lon = mid_Lon;
  }
}

class SubPath {
  constructor(type, subpath, stationInfo) {
    this.Type = type;
    this.SectionTime = subpath.sectionTime;
    this.StationCount = subpath.stationCount;
    this.StartLat = subpath.startX;
    this.StartLon = subpath.startY;
    this.EndLat = subpath.endX;
    this.EndLon = subpath.endY;
    this.StartName = subpath.startName;
    this.EndName = subpath.endName;
    this.StationInfo = stationInfo;
  }
}

class Subway extends SubPath {
  constructor(subpath, subwayName, subwayColor, StationInfo, start, end) {
    super("SUBWAY", subpath, StationInfo);
    this.SubwayName = subwayName;
    this.SubwayColor = subwayColor;
    this.StartX = start.x;
    this.StartY = start.y;
    this.EndX = end.x;
    this.EndY = end.y;
  }
}

class Bus extends SubPath {
  constructor(subpath, LaneInfo, StationInfo, start, end) {
    super("BUS", subpath, StationInfo);
    this.LaneInfo = LaneInfo;
    this.StartX = start.x;
    this.StartY = start.y;
    this.EndX = end.x;
    this.EndY = end.y;
  }
}

class Walk extends SubPath {
  constructor(subpath) {
    super("WALK", subpath);
    this.Distance = subpath.distance;
  }
}

function getStationList(stations) {
  // 지나가는 정류장들 정보(이름, 위도, 경도) 저장
  const StationInfo = stations.map((station) => ({
    Name: station.stationName,
    Lat: parseFloat(station.y),
    Lon: parseFloat(station.x),
  }));
  return StationInfo;
}

async function GetRoot(startX, startY, endX, endY) {
  const options = {
    apiKey: `${process.env.ODSAY_KEY}`,
    OPT: 0, // 경로검색결과 정렬방식
    SearchPathType: 0, // 도시 내 경로수단을 지정한다
    SX: `${startX}`,
    SY: `${startY}`,
    EX: `${endX}`,
    EY: `${endY}`,
  };

  const url = `https://api.odsay.com/v1/api/searchPubTransPathT`;

  try {
    const response = await axios.get(url, { params: options });
    if (response.status == 200) {
      const Paths = [];

      response.data.result.path.forEach((path) => {
        var TotalWalkTime = 0;
        // 2023.11.30 김건학
        // 지도 표현에 사용할 위도, 경도의 중간값 저장하는 변수
        var mid_Lat = 0;
        var mid_Lon = 0;
        var totalCount = 0;

        const SubPaths = [];
        // 2023.11.30 김건학
        // subpath에 저장할 위도, 경도, x, y를 담은 start, end 추가
        path.subPath.forEach((subpath) => {
          let SubPath, StationInfo;
          switch (subpath.trafficType) {
            case 1: // 지하철
              var { start, end } = convert.ToXY(
                subpath.startY,
                subpath.startX,
                subpath.endY,
                subpath.endX
              );
              const SubwayColor = SubwayColorMap[subpath.lane[0].name] || "#000000";
              StationInfo = getStationList(subpath.passStopList.stations);

              SubPath = new Subway(
                subpath,
                subpath.lane[0].name,
                SubwayColor,
                StationInfo,
                start,
                end
              );

              subpath.passStopList.stations.forEach((station) => {
                mid_Lat += parseFloat(station.y);
                mid_Lon += parseFloat(station.x);
                totalCount++;
              });
              break;
            case 2: // 버스
              var { start, end } = convert.ToXY(
                subpath.startY,
                subpath.startX,
                subpath.endY,
                subpath.endX
              );
              const LaneInfo = subpath.lane.map((lane) => ({
                BusNo: lane.busNo,
                BusID: lane.busID,
                BusColor: BusColorMap[lane.type] || "#000000",
              }));
              StationInfo = getStationList(subpath.passStopList.stations);

              subpath.passStopList.stations.forEach((station) => {
                mid_Lat += parseFloat(station.y);
                mid_Lon += parseFloat(station.x);
                totalCount++;
              });

              SubPath = new Bus(subpath, LaneInfo, StationInfo, start, end);
              break;
            case 3: // 도보
              SubPath = new Walk(subpath);
              TotalWalkTime += subpath.sectionTime;
              break;
            default:
              // 다른 교통 수단
              break;
          }
          SubPaths.push(SubPath);
        });
        // 출발지, 도착지 위경도 --> X Y로 변환
        var { start, end } = convert.ToXY(startY, startX, endY, endX);
        const p = new Path(
          start,
          end,
          path,
          TotalWalkTime,
          SubPaths,
          mid_Lat / totalCount,
          mid_Lon / totalCount
        );
        Paths.push(p);
      });
      return Paths;
    } else {
      console.error(`HTTP 요청 실패, 상태 코드 : ${response.status}`);
    }
  } catch (err) {
    if (err.response) {
      console.error(`HTTP 요청 실패, 상태 코드 : ${response.status}`);
    } else if (err.request) {
      console.error(`네트워크 문제 : ${err.message}`);
    } else console.error(`오류 발생 : ${err.message}`);
  }
}

module.exports = {
  GetRoot: GetRoot,
};
