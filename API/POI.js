const fetch = require('node-fetch');
const readline = require('readline');

const options = {
    method: 'GET',
    headers: { Accept: 'application/json', appKey: 'e8wHh2tya84M88aReEpXCa5XTQf3xgo01aZG39k5' }
};

function getPlacesFromInput(input) {
    return new Promise((resolve, reject) => {
        const encodedInput = encodeURIComponent(input);

        fetch(`https://apis.openapi.sk.com/tmap/pois?version=1&searchKeyword=${encodedInput}&searchType=all&searchtypCd=A&reqCoordType=WGS84GEO&resCoordType=WGS84GEO&page=1&count=20&multiPoint=N&poiGroupYn=N`, options)
            .then(response => response.json())
            .then(response => {
                if (response && response.searchPoiInfo && response.searchPoiInfo.totalCount > 0) {
                    const count = response.searchPoiInfo.count;
                    const Places = [];

                    for (let poi_idx = 0; poi_idx < count; poi_idx++) {
                        const poi = response.searchPoiInfo.pois.poi[poi_idx];
                        const poi_name = poi.name;
                        const poi_lat = poi.frontLat;
                        const poi_lon = poi.frontLon;

                        const place = {
                            "name": poi_name, // 장소 이름
                            "lat": poi_lat,   // 위도
                            "lon": poi_lon,   // 경도
                        };
                        Places.push(place);
                    }

                    resolve(Places);
                } else {
                    resolve([]);
                }
            })
            .catch(err => reject(err));
    });
}
/*
const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

rl.question('장소 입력 : ', async (input) => {
    try {
        const places = await getPlacesFromInput(input);
        if (places.length > 0) {
            for (let poi_idx = 0; poi_idx < places.length; poi_idx++) {
                console.log(`장소[${poi_idx}]`);
                console.log(places[poi_idx]);
                console.log();
            }
        } else {
            console.log("검색 결과가 없습니다.");
        }
    } catch (err) {
        console.error(err);
    }
    rl.close();
});*/