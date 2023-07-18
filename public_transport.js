const { response } = require("express");

const options = {
    method: 'POST',
    headers: {
        accept: 'application/json',
        'content-type': 'application/json',
        appKey: 'e8wHh2tya84M88aReEpXCa5XTQf3xgo01aZG39k5'
    },
    body: JSON.stringify({
        startX: "126.9955",
        startY: "37.5038",
        endX: "126.96",
        endY: "37.4945",
        lang: 0,
        format: 'json',
        count: 5,
        searchDttm: "202307111200"
    })
};

// 위도(lat) x 37 
// 경도(lon) y 126 

fetch('https://apis.openapi.sk.com/transit/routes', options)
    .then(response => response.json())
    .then(road_data => {
        if (road_data.metaData && road_data.metaData.plan && road_data.metaData.plan.itineraries && road_data.metaData.plan.itineraries.length > 0) {

            const start_lat = road_data.metaData.requestParameters.start_lat;
            const start_lon = road_data.metaData.requestParameters.start_lon;
            const end_lat = road_data.metaData.requestParameters.end_lat;
            const end_lon = road_data.metaData.requestParameters.end_lon;
            const itinerary = road_data.metaData.plan.itineraries;
            const itinerary_count = itinerary.length;                                       // 루트 개수

            // 루트 개수만큼 반복(5번)
            for (cur_itinerary = 0; cur_itinerary < itinerary_count; cur_itinerary++) {
                const totalTime = itinerary[cur_itinerary].totalTime;
                const transferCount = itinerary[cur_itinerary].transferCount;
                const method = itinerary[cur_itinerary].legs;
                const section_count = method.length;
                const sections = [];                                                        // 구간 객체배열

                // 구간 개수만큼 반복
                for (cur_section = 0; cur_section < section_count; cur_section++) {
                    const section_start_name = method[cur_section].start.name;
                    const section_start_lat = method[cur_section].start.lat;
                    const section_start_lon = method[cur_section].start.lon;
                    const section_end_name = method[cur_section].end.name;
                    const section_end_lat = method[cur_section].end.lat;
                    const section_end_lon = method[cur_section].end.lon;
                    const sectionTime = method[cur_section].sectionTime;
                    const distance = method[cur_section].distance;

                    const section = {
                        "section_start_name": section_start_name,   // 구간의 출발지 이름
                        "section_start_lat": section_start_lat,     // 구간의 출발지 위도
                        "section_start_lon": section_start_lon,     // 구간의 출발지 경도
                        "section_end_name": section_end_name,       // 구간의 목적지 이름
                        "section_end_lat": section_end_lat,         // 구간의 목적지 위도
                        "section_end_lon": section_end_lon,         // 구간의 목적지 경도
                        "sectionTime": sectionTime,                 // 구간의 소요시간(s)
                        "distance": distance                        // 구간의 거리(m)
                    };

                    if (method[cur_section].mode == "WALK")                                                 // 구간의 이동수단이 WALK일때
                        section.mode = "WALK";

                    else if (method[cur_section].mode == "BUS" || method[cur_section].mode == "SUBWAY") {   // 이동수단이 버스 or 지하철일때
                        section.mode = `${method[cur_section].mode}`;                                       // 이동수단
                        section.route_name = `${method[cur_section].route}`;                                // 노선 이름
                        section.route_color = `${method[cur_section].routeColor}`;                          // 노선 색
                        section.stationcount = `${method[cur_section].passStopList.stationList.length}`;    // 지나가는 정류장 수
                    }

                    sections.push(section);
                }

                const Route = {
                    "start_lat": start_lat,         // 출발지 위도
                    "start_lon": start_lon,         // 출발지 경도
                    "end_lat": end_lat,             // 목적지 위도
                    "end_lon": end_lon,             // 목적지 경도
                    "totalTime": totalTime,         // 총 소요시간
                    "transferCount": transferCount, // 환승 횟수
                    "section_count": section_count, // 구간 개수
                    "sections": sections            // 구간 객체
                };

                console.log(`루트[${cur_itinerary + 1}]`)
                console.log(Route);
                console.log();
            }
        }
        else {
            console.error("No itinerary found.");
        }
    })
    .catch(err => console.error(err));
