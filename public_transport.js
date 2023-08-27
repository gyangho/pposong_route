const convert = require('./convert_XY.js');
const fetch = require('node-fetch');

const routeColorMap = {
    '수도권1호선': '#0052A4',
    '수도권1호선(급행)': '#0052A4',
    '수도권1호선(특급)': '#0052A4',
    '수도권2호선': '#00A84D',
    '수도권3호선': '#EF7C1C',
    '수도권4호선': '#00A5DE',
    '수도권4호선(급행)': '#00A5DE',
    '수도권5호선': '#996CAC',
    '수도권6호선': '#CD7C2F',
    '수도권7호선': '#747F00',
    '수도권8호선': '#E6186C',
    '수도권9호선': '#BDB092',
    '수도권9호선(급행)': '#BDB092',
    '수인분당선': '#F5A200',
    '수인분당선(급행)': '#F5A200',
    '공항철도': '#0090D2',
    '경의중앙선': '#77C4A3',
    '경의중앙선(급행)': '#77C4A3',
    '에버라인': '#56AD2D',
    '경춘선': '#0C8E72',
    '경춘선(급행)': '#0C8E72',
    '신분당선': '#D4003B',
    '의정부경전철': '#FDA600',
    '경강선': '#0054A6',
    '우이신설선': '#B0CE18',
    '서해선': '#81A914',
    '김포골드라인': '#A17800',
    '신림선': '#6789CA',
    '인천1호선': '#7CA8D5',
    '인천2호선': '#ED8B00',
    '대전1호선': '#007448',
    '대구1호선': '#D93F5C',
    '대구2호선': '#00AA80',
    '대구3호선': '#FFB100',
    '광주1호선': '#009088',
    '부산1호선': '#F06A00',
    '부산2호선': '#81BF48',
    '부산3호선': '#BB8C00',
    '부산4호선': '#217DCB',
    '동해선': '#003DA5',
    '부산김해경전철': '#8652A1',
    'KTX': '#204080',
    'KTX산천': '#204080',
    'KTX이음': '#204080',
    'SRT': '#5A2149',
    '무궁화': '#E06040',
    '새마을': '#5288F5',
    '누리로': '#3D99C2',
    'ITX새마을': '#C30E2F',
    'ITX청춘':'#1CAE4C'
};

// 정규식을 사용하여 숫자만 추출하는 함수
function extractNumbersFromString(str) {
    return str.replace(/\D/g, '');
}

async function getPublicTransport(startX, startY, endX, endY, searchDttm) {
    const options = {
        method: 'POST',
        headers: {
            accept: 'application/json',
            'content-type': 'application/json',
            appKey: 'e8wHh2tya84M88aReEpXCa5XTQf3xgo01aZG39k5',
        },
        body: JSON.stringify({
            startX: startX,
            startY: startY,
            endX: endX,
            endY: endY,
            lang: 0,
            format: 'json',
            count: 10,
            searchDttm: searchDttm,
        }),
    };


    try {
        const response = await fetch('https://apis.openapi.sk.com/transit/routes', options);
        const road_data = await response.json();

        if (
            road_data.metaData &&
            road_data.metaData.plan &&
            road_data.metaData.plan.itineraries &&
            road_data.metaData.plan.itineraries.length > 0
        ) {
            const start_lat = road_data.metaData.requestParameters.startY;
            const start_lon = road_data.metaData.requestParameters.startX;
            const starting_point = convert.dfs_xy_conv('toXY', `${start_lat}`, `${start_lon}`); // 출발지 위경도 --> XY

            const end_lat = road_data.metaData.requestParameters.endY;
            const end_lon = road_data.metaData.requestParameters.endX;
            const end_point = convert.dfs_xy_conv('toXY', `${end_lat}`, `${end_lon}`); // 목적지 위경도 --> XY

            const itinerary = road_data.metaData.plan.itineraries;
            const itinerary_count = itinerary.length; // 루트 개수
            const Routes = []; // 구간 객체배열

            // 루트 개수만큼 반복(5번)
            for (let cur_itinerary = 0; cur_itinerary < itinerary_count; cur_itinerary++) {
                let totalTime = itinerary[cur_itinerary].totalTime; // 총 소요시간 'OO시간 OO분'으로 형식 바꿈
                if (totalTime >= 60) {
                    if (totalTime / 60 >= 60)
                        totalTime = `${Math.floor(totalTime / 3600)}시간 ${Math.floor(totalTime % 3600/60)}분`;
                    else
                        totalTime = `${Math.floor(totalTime / 60)}분`;
                }
                let totalWalkTime = itinerary[cur_itinerary].totalWalkTime; // 총 도보시간 'OO시간 OO분'으로 형식 바꿈
                if (totalWalkTime >= 60) {
                    if (totalWalkTime / 60 >= 60)
                        totalWalkTime = `${Math.floor(totalWalkTime / 3600)}시간 ${Math.floor(totalWalkTime % 3600/60)}분`;
                    else
                        totalWalkTime = `${Math.floor(totalWalkTime /60)}분`;
                }
                let totalWalkDistance = itinerary[cur_itinerary].totalWalkDistance; // 총 도보거리 'Okm이상시 O.OOkm로 변경
                if (totalWalkDistance / 1000 >= 1)
                    totalWalkDistance = `${(totalWalkDistance / 1000).toFixed(2)}km`;
                else
                    totalWalkDistance = `${totalWalkDistance}m`;
                
                const transferCount = itinerary[cur_itinerary].transferCount;
                const method = itinerary[cur_itinerary].legs;
                const section_Count = method.length;

                const sections = []; // 구간 객체배열

                // 구간 개수만큼 반복
                for (let cur_section = 0; cur_section < section_Count; cur_section++) {
                    const section_start_name = (method[cur_section].mode === 'SUBWAY'
                        || method[cur_section].mode === 'TRAIN')
                        ? method[cur_section].start.name + '역'
                        : method[cur_section].start.name;
                    const section_start_lat = method[cur_section].start.lat;
                    const section_start_lon = method[cur_section].start.lon;
                    const section_start = convert.dfs_xy_conv('toXY', `${section_start_lat}`, `${section_start_lon}`); // 구간의 출발지 위경도 --> XY

                    const section_end_name = (method[cur_section].mode === 'SUBWAY'
                        || method[cur_section].mode === 'TRAIN')
                        ? method[cur_section].end.name + '역'
                        : method[cur_section].end.name;

                    const section_end_lat = method[cur_section].end.lat;
                    const section_end_lon = method[cur_section].end.lon;
                    const section_end = convert.dfs_xy_conv('toXY', `${section_end_lat}`, `${section_end_lon}`); // 구간의 목적지 위경도 --> XY

                    const sectionTime = method[cur_section].sectionTime;
                    let distance = method[cur_section].distance; // 구간 거리 'Okm이상시 O.OOkm로 변경
                    if (distance / 1000 >= 1)
                    distance = `${(distance / 1000).toFixed(2)}km`;
                    else
                    distance = `${distance}m`;

                    const section = {
                        section_start: {
                            // 구간의 출발지 이름, X, Y
                            name: section_start_name,
                            X: section_start.x,
                            Y: section_start.y,
                        },
                        section_end: {
                            // 구간의 목적지 이름, X, Y
                            name: section_end_name,
                            X: section_end.x,
                            Y: section_end.y,
                        },
                        sectionTime: sectionTime, // 구간의 소요시간(s)
                        distance: distance, // 구간의 거리(m)
                    };

                    if (method[cur_section].mode === 'WALK' || method[cur_section].mode === 'TRANSFER') {
                        // 구간의 이동수단이 도보 or 환승일때
                        section.mode = 'WALK';
                    } else if (method[cur_section].mode === 'BUS') {
                        section.mode = `${method[cur_section].mode}`; // 이동수단
                        section.route_name = `${method[cur_section].route}`.match(/[-\d]+/g); // 노선 이름
                        section.route_color = `#${method[cur_section].routeColor}`; // 노선 색
                        section.stationcount = `${method[cur_section].passStopList.stationList.length-1}개 역 이동`; // 지나가는 정류장 수
                    }
                    else if (method[cur_section].mode === 'SUBWAY'){
                        // 이동수단이 지하철일때
                        section.mode = `${method[cur_section].mode}`; // 이동수단
                        section.route_name = `${method[cur_section].route}`; // 노선 이름
                        section.route_color = routeColorMap[section.route_name] || '#000000';
                        section.stationcount = `${method[cur_section].passStopList.stationList.length-1}개 역 이동`; // 지나가는 정류장 수
                    }
                        
                    else if (method[cur_section].mode === 'TRAIN' || method[cur_section].mode === 'EXPRESSBUS' ){
                        // 이동수단이 기차일때
                        section.mode = `${method[cur_section].mode}`; // 이동수단
                        section.route_name = `${method[cur_section].route}`.split(':')[0];
                        section.route_color = routeColorMap[section.route_name] || '#000000';
                        section.stationcount = '';
                    }

                    sections.push(section);
                }

                const Route = {
                    Start: {
                        // 출발지 X, Y
                        X: starting_point.x,
                        Y: starting_point.y,
                    },

                    End: {
                        // 목적지 X, Y
                        X: end_point.x,
                        Y: end_point.y,
                    },

                    totalTime: totalTime, // 총 소요시간
                    totalWalkTime: totalWalkTime, // 도보 총 소요시간
                    totalWalkDistance:totalWalkDistance, // 도보 총 거리
                    transferCount: transferCount, // 환승 횟수
                    section_Count: section_Count, // 구간 개수
                    sections: sections, // 구간 객체
                };

                Routes.push(Route);
            }
            return Routes;
        } else {
            console.error('No itinerary found.');
        }
    } catch (err) {
        console.error(err);
    }
}

module.exports = {
    getPublicTransport: getPublicTransport
};