const options = {
    method: 'GET',
    headers: { Accept: 'application/json', appKey: 'e8wHh2tya84M88aReEpXCa5XTQf3xgo01aZG39k5' }
};

const readline = require('readline');
const convert = require('./convert_XY.js'); // 같은 경로안에 있는 convert_XY.js의 dfs_xy_conv함수를 쓴다.

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

rl.question('장소 입력 : ', (input) => {
    const encodedInput = encodeURIComponent(input);

    fetch(`https://apis.openapi.sk.com/tmap/pois?version=1&searchKeyword=${encodedInput}&searchType=all&searchtypCd=A&reqCoordType=WGS84GEO&resCoordType=WGS84GEO&page=1&count=20&multiPoint=N&poiGroupYn=N`, options)
        .then(response => response.json())
        .then(response => {
            if (response && response.searchPoiInfo && response.searchPoiInfo.totalCount > 0) {

                const count = response.searchPoiInfo.count;
                const Places = [];

                for (poi_idx = 0; poi_idx < count; poi_idx++) {
                    const poi = response.searchPoiInfo.pois.poi[poi_idx];
                    const poi_name = poi.name;
                    const poi_lat = poi.frontLat;
                    const poi_lon = poi.frontLon;
                    const poi_X = convert.dfs_xy_conv("toXY", `${poi_lat}`, `${poi_lon}`).x;
                    const poi_Y = convert.dfs_xy_conv("toXY", `${poi_lat}`, `${poi_lon}`).y;

                    const place = {
                        "name": poi_name,       // 장소 이름
                        "lat": poi_lat,         // 위도
                        "lon": poi_lon,         // 경도
                        "X": poi_X,             // X
                        "Y": poi_Y              // Y
                    };
                    Places.push(place);
                }

                for (poi_idx = 0; poi_idx < count; poi_idx++) {
                    console.log(`장소[${poi_idx}]`);
                    console.log(Places[poi_idx]);
                    console.log();
                }
            }
        })

        .catch(err => console.error(err));

    rl.close();
});
