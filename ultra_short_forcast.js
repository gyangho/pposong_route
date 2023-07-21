// 초단기예보
// 기온(T1H), 1시간 강수량(RN1), 하늘 상태(SKY), 습도(REH), 강수형태(PTY), 풍속(WSD)

const { response } = require('express');

import('node-fetch').then((fetch) => {
    const url = 'http://apis.data.go.kr/1360000/VilageFcstInfoService_2.0/getUltraSrtFcst'; /*URL*/
    const serviceKey = 'YVQkpHY14ykgf2l2ayZx+wOfqTGaLVjka0T1pl7g4PsQuB6cGA/wrf5j8AT9dKraniz5z8rTowBF2RM0W+8jkg==';

    const queryParams = new URLSearchParams({
        serviceKey,
        pageNo: '1',
        numOfRows: '1000',
        dataType: 'JSON',
        base_date: '20230721',
        base_time: '1600',
        // 12:45이전 --> base_time : 1100 (12, 13, 14, 15, 16, 17),
        // 12:45이후 --> base_time : 12:00 (13, 14, 15, 16, 17, 18)
        // 입력시간이 11:45 ~ 12:44이면 초단기 예보의 base_time을 11:00로 해서 계산한다. + 11시의 초단기실황이 11:40에 발표되므로 같이 사용한다.
        // 입력시간이 12:45 ~ 13:44이면 초단기 예보의 base_time을 12:00로 해서 계산한다. + 12시의 초단기실황이 12:40에 발표되므로 같이 사용한다.
        nx: '55',
        ny: '127'

    });

    fetch.default(url + '?' + queryParams)
        .then(response => response.json())
        .then(data => {
            const items = data.response.body.items.item;

            const ultra_short_forcast_datas = {};

            items.forEach(item => {
                const fcstTime = item.fcstTime;
                if (!ultra_short_forcast_datas[fcstTime])
                    ultra_short_forcast_datas[fcstTime] = {};       // 예보시간에 따른 날씨데이터

                // 기온(T1H), 1시간 강수량(RN1), 하늘 상태(SKY), 습도(REH), 강수형태(PTY), 풍속(WSD)
                if (item.category === "T1H" || item.category === "RN1" || item.category === "SKY" ||
                    item.category === "REH" || item.category === "PTY" || item.category === "WSD"
                )
                    ultra_short_forcast_datas[fcstTime][item.category] = item.fcstValue;

                if (item.category === "RN1") {  // 강수없음 --> 0
                    ultra_short_forcast_datas[fcstTime][item.category] = item.fcstValue === '강수없음' ? '0' : item.fcstValue;
                }
            });
            console.log(ultra_short_forcast_datas);
        })
        .catch(error => {
            console.error(error);
        });
});