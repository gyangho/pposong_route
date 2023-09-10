const axios = require('axios');
const convert = require('./convert_XY');

const path = require('path');
const dotenv = require('dotenv');
dotenv.config({ path: path.resolve(__dirname, ".env") });

const SubwayColorMap = {
  '수도권 1호선': '#0052A4',
  '수도권 1호선(급행)': '#0052A4',
  '수도권 1호선(특급)': '#0052A4',
  '수도권 2호선': '#00A84D',
  '수도권 3호선': '#EF7C1C',
  '수도권 4호선': '#00A5DE',
  '수도권 4호선(급행)': '#00A5DE',
  '수도권 5호선': '#996CAC',
  '수도권 6호선': '#CD7C2F',
  '수도권 7호선': '#747F00',
  '수도권 8호선': '#E6186C',
  '수도권 9호선': '#BDB092',
  '수도권 9호선(급행)': '#BDB092',
  '수도권 수인.분당선': '#F5A200',
  '수도권 수인.분당선(급행)': '#F5A200',
  '수도권 신분당선' : '#D31145',
  '수도권 공항철도': '#0090D2',
  '수도권 서해선': '#8FC31F',
  '경의중앙선': '#77C4A3',
  '경의중앙선(급행)': '#77C4A3',
  '수도권 에버라인': '#56AD2D',
  '수도권 경춘선': '#0C8E72',
  '경춘선(급행)': '#0C8E72',
  '수도권 의정부경전철': '#FDA600',
  '수도권 경강선': '#0054A6',
  '수도권 우이신설선': '#B0CE18',
  '수도권 서해선': '#81A914',
  '수도권 김포골드라인': '#A17800',
  '수도권 신림선': '#6789CA',
  '인천 1호선': '#7CA8D5',
  '인천 2호선': '#ED8B00',
  '대전 1호선': '#007448',
  '대구 1호선': '#D93F5C',
  '대구 2호선': '#00AA80',
  '대구 3호선': '#FFB100',
  '광주 1호선': '#009088',
  '부산 1호선': '#F06A00',
  '부산 2호선': '#81BF48',
  '부산 3호선': '#BB8C00',
  '부산 4호선': '#217DCB',
  '부산-김해경전철': '#8652A1',
};

const BusColorMap = {
  '1':  '#33CC99',  // 시내일반
  '3':  '#53b332',  // 지선
  '4':  '#e60012',  // 광역
  '11': '#0068b7',  // 간선
  '12': '#53b332',  // 지선
  '14': '#e60012',  // 광역
  '15': '#e60012'   // 광역
};

class Path{
  constructor(start, end, payment, totalTime, totalWalk, totalWalkTime, subPaths) {
    this.StartX = start.x;
    this.StartY = start.y;
    this.EndX = end.x;
    this.EndY = end.y;
    this.Payment = payment;
    this.TotalTime = totalTime;
    this.TotalWalk = totalWalk;
    this.TotalWalkTime = totalWalkTime;
    this.SubPaths = subPaths;
  }
}

class SubPath{
  constructor(type, sectionTime, stationCount, startX, startY, endX, endY, startName, endName) {
    this.Type = type;
    this.SectionTime = sectionTime;
    this.StationCount = stationCount;
    this.StartX = startX;
    this.StartY = startY;
    this.EndX = endX;
    this.EndY = endY;
    this.StartName = startName;
    this.EndName = endName;
  }
}

class Subway extends SubPath{
  constructor(sectionTime, stationCount, startX, startY, endX, endY, startName, endName, subwayName, subwayColor) {
    super('SUBWAY', sectionTime, stationCount, startX, startY, endX, endY, startName, endName);
    this.SubwayName = subwayName;
    this.SubwayColor = subwayColor;
  }
}

class Bus extends SubPath {
  constructor(sectionTime, stationCount, startX, startY, endX, endY, startName, endName, laneInfo) {
    super('BUS', sectionTime, stationCount, startX, startY, endX, endY, startName, endName);
    this.LaneInfo = laneInfo;
  }
}

class Walk extends SubPath {
  constructor(sectionTime, distance) {
    super('WALK', sectionTime, null, null, null, null, null, null, null);
    this.Distance = distance;
  }
}

async function GetRoot(startX, startY, endX, endY) {
  const options = {
    apiKey: `${process.env.ODSAY_KEY}`,
    OPT: 0,           // 경로검색결과 정렬방식
    SearchPathType:0  // 도시 내 경로수단을 지정한다
  }
  const url = `https://api.odsay.com/v1/api/searchPubTransPathT?&apiKey=${options.apiKey}&SX=${startX}&SY=${startY}&EX=${endX}&EY=${endY}&OPT=${options.OPT}&SearchPathType=${options.SearchPathType}`;

  try {
    const response = await axios.get(url);
    if (response.data && response.data.error)
      throw new Error('ODsay 대중교통 API 오류 발생 --> code: ' + response.data.error.msg);
    if (response.data.error)
      throw new Error('ODsay 대중교통 API 오류 발생 --> code : ' + response.data.error[0].code + ', message : ' + response.data.error[0].message);

    const ODsay_result = response.data.result;
    const Paths = []

    for (var path_idx = 0; path_idx < ODsay_result.path.length; path_idx++) {
        const path = ODsay_result.path[path_idx];
        var TotalWalkTime = 0;
        const SubPaths = [];

        for (var subpath_idx = 0; subpath_idx < path.subPath.length; subpath_idx++) {
            const subpath = path.subPath[subpath_idx];
            let SubPath;

            switch (subpath.trafficType) {
                case 1: // 지하철
                    var { start, end } = convert.ToXY(subpath.startY, subpath.startX, subpath.endY, subpath.endX);
                    const SubwayColor = SubwayColorMap[subpath.lane[0].name] || '#000000';
                    SubPath = new Subway(subpath.sectionTime, subpath.stationCount, start.x, start.y, end.x, end.y, subpath.startName, subpath.endName, subpath.lane[0].name, SubwayColor);
                    break;
                case 2: // 버스
                    var { start, end } = convert.ToXY(subpath.startY, subpath.startX, subpath.endY, subpath.endX);
                    const LaneInfo = subpath.lane.map(lane => ({
                        BusNo: lane.busNo,
                        BusID: lane.busID,
                        BusColor: BusColorMap[lane.type] || '#000000'
                    }));
                    SubPath = new Bus(subpath.sectionTime, subpath.stationCount, start.x, start.y, end.x, end.y, subpath.startName, subpath.endName, LaneInfo);
                    break;
                case 3: // 도보
                    SubPath = new Walk(subpath.sectionTime, subpath.distance);
                    TotalWalkTime += subpath.sectionTime;
                    break;
                default:
                    // 다른 교통 수단
                    break;
            }
            SubPaths.push(SubPath);
        }

        // 출발지, 도착지 위경도 --> X Y로 변환
        var { start, end } = convert.ToXY(startY, startX, endY, endX);
        const p = new Path(start, end, path.info.payment, path.info.totalTime, path.info.totalWalk, TotalWalkTime, SubPaths);

        Paths.push(p);
    }
    return Paths;
      
  } catch (err) {
    console.error(err);
  }
}

module.exports = {
  GetRoot: GetRoot
};