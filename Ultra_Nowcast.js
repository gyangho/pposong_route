// 초단기실황
// 습도(REH), 1시간 강수량(RN1), 기온(T1H), 풍속(WSD)

const { response } = require('express');

import('node-fetch').then((fetch) => {
    const url = 'http://apis.data.go.kr/1360000/VilageFcstInfoService_2.0/getUltraSrtNcst'; /*URL*/
    const serviceKey = 'YVQkpHY14ykgf2l2ayZx+wOfqTGaLVjka0T1pl7g4PsQuB6cGA/wrf5j8AT9dKraniz5z8rTowBF2RM0W+8jkg==';

    const queryParams = new URLSearchParams({
        serviceKey,
        pageNo: '1',
        numOfRows: '1000',
        dataType: 'JSON',
        base_date: '20230721',
        base_time: '2200',  // 12:40이후 --> 12시의 날씨 데이터 제공(12~13시)
        // 12:00 ~ 12:39에 현재 날씨를 보려면 초단기예보를 사용해야한다.(base_time 11:00)
        nx: '55',
        ny: '127'

    });

    // 습도(REH), 1시간 강수량(RN1), 기온(T1H), 풍속(WSD)
    fetch.default(url + '?' + queryParams)
        .then(response => response.json())
        .then(data => {
            const items = data.response.body.items.item;
            const ultra_short_nowcast_data = {
                "REH": items[1].obsrValue,
                "RN1": items[2].obsrValue,
                "T1H": items[3].obsrValue,
                "WSD": items[7].obsrValue
            };

            console.log(ultra_short_nowcast_data);

        })
        .catch(error => {
            console.error(error);
        });
});