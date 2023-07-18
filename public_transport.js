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

fetch('https://apis.openapi.sk.com/transit/routes', options)
    .then(response => response.json())
    .then(road_data => {
        if (road_data.metaData && road_data.metaData.plan && road_data.metaData.plan.itineraries && road_data.metaData.plan.itineraries.length > 0) {

            const startX = road_data.metaData.requestParameters.startX;
            const startY = road_data.metaData.requestParameters.startY;
            const endX = road_data.metaData.requestParameters.endX;
            const endY = road_data.metaData.requestParameters.endY;
            const itinerary = road_data.metaData.plan.itineraries;
            const itinerary_count = itinerary.length;                                       // 루트 개수
            const Routes = [];                                                              // 루트 객체배열

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
                    const section_startX = method[cur_section].start.lon;
                    const section_startY = method[cur_section].start.lat;
                    const section_end_name = method[cur_section].end.name;
                    const section_endX = method[cur_section].end.lon;
                    const section_endY = method[cur_section].end.lat;
                    const sectionTime = method[cur_section].sectionTime;
                    const distance = method[cur_section].distance;

                    const section = {
                        "section_start_name": section_start_name,   // 구간의 출발지 이름
                        "section_startX": section_startX,           // 구간의 출발지 X좌표
                        "section_startY": section_startY,           // 구간의 출발지 Y좌표
                        "section_end_name": section_end_name,       // 구간의 목적지 이름
                        "section_endX": section_endX,               // 구간의 목적지 X좌표
                        "section_endY": section_endY,               // 구간의 목적지 Y좌표
                        "sectionTime": sectionTime,                 // 구간의 소요시간(s)
                        "distance": distance                        // 구간의 거리(m)
                    };

                    if (method[cur_section].mode == "WALK")                                  // 구간의 이동수단이 WALK일때
                        section.mode = "WALK";

                    else if (method[cur_section].mode == "BUS" || method[cur_section].mode == "SUBWAY") {   // 이동수단이 버스 or 지하철일때
                        section.mode = `${method[cur_section].mode}`;                                       // 이동수단
                        section.route = `${method[cur_section].route}`;                                     // 노선 이름
                        section.route_color = `${method[cur_section].routeColor}`;                          // 노선 색
                        section.stationcount = `${method[cur_section].passStopList.stationList.length}`;    // 지나가는 정류장 수
                    }

                    sections.push(section);
                }

                const Route = {
                    "startX": startX,               // 출발지 x좌표
                    "startY": startY,               // 출발지 y좌표
                    "endX": endX,                   // 목적지 x좌표
                    "endY": endY,                   // 목적지 y좌표
                    "totalTime": totalTime,         // 총 소요시간
                    "transferCount": transferCount, // 환승 횟수
                    "section_count": section_count, // 구간 개수
                    "sections": sections            // 구간 객체
                };

                Routes.push(Route);
            }

            for (idx = 0; idx < 5; idx++) {
                console.log(`Route[${idx + 1}]`);
                console.log(Routes[idx]);
                console.log();
            }
        }
        else {
            console.error("No itinerary found.");
        }
    })
    .catch(err => console.error(err));
