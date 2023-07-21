// 단기예보
// 강수확률(POP)

const { response } = require('express');

import('node-fetch').then((fetch) => {
    const url = 'http://apis.data.go.kr/1360000/VilageFcstInfoService_2.0/getVilageFcst'; /*URL*/
    const serviceKey = 'YVQkpHY14ykgf2l2ayZx+wOfqTGaLVjka0T1pl7g4PsQuB6cGA/wrf5j8AT9dKraniz5z8rTowBF2RM0W+8jkg==';

    // 02:10시를 기준, 3시간 간격으로 발표 (02:10, 05:10, 08:10, 11:10, ...)
    // 입력시간을 기준으로 가장가까운 시각 basetime으로 넣을 예정
    const queryParams = new URLSearchParams({
        serviceKey,
        pageNo: '1',
        numOfRows: '1000',
        dataType: 'JSON',
        base_date: '20230721',
        base_time: '2000',
        nx: '59',
        ny: '125'
    });

    fetch.default(url + '?' + queryParams)
        .then(response => response.json())
        .then(data => {
            const items = data.response.body.items.item;
            const short_forcast_data = {};
            let check = 0;

            for (idx = 0; ; idx++) {
                const fcstTime = items[idx].fcstTime;

                if (check == 6)
                    break;

                if (items[idx].category === "POP") {         // 강수확률(POP)   
                    short_forcast_data[fcstTime] = {};       // 예보시간에 따른 날씨데이터
                    short_forcast_data[fcstTime][items[idx].category] = items[idx].fcstValue;
                    check++;
                }
            }
            console.log(short_forcast_data);
        })
        .catch(error => {
            console.error(error);
        });
});

