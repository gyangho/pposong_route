// 단기예보
// 강수확률(POP)
const { response } = require('express');
const fetch = require('node-fetch');

const url = 'http://apis.data.go.kr/1360000/VilageFcstInfoService_2.0/getVilageFcst'; /*URL*/
const serviceKey = 'YVQkpHY14ykgf2l2ayZx+wOfqTGaLVjka0T1pl7g4PsQuB6cGA/wrf5j8AT9dKraniz5z8rTowBF2RM0W+8jkg==';

function fetchForecastData(queryParams) {
    return fetch(url + '?' + queryParams)
        .then(response => response.json())
        .then(data => data.response.body.items.item)
        .catch(error => console.error(error));
}

// 단기예보API로 앞으로 6시간의 강수확률을 받아오는 함수
async function getShortForecastData(input_date, input_time, input_x, input_y) {
    // 입력한 시간과 가장 가까운 base_time을 구하고 현재시각의 '분'을 버려 정리한다.
    let cal_time = parseInt(input_time, 10);
    let cal_base_time = Math.floor((cal_time + 90) / 300) * 300 - 100;

    if (cal_base_time === -100)
        cal_base_time = 2300;

    cal_time = Math.floor(cal_time / 100) * 100;
    next_time = Math.floor(cal_time / 100) * 100 + 100;

    if (next_time === 2400)
        next_time = 0;

    const baseTimes = [
        { time: 200, base: 2300 },
        { time: 500, base: 200 },
        { time: 800, base: 500 },
        { time: 1100, base: 800 },
        { time: 1400, base: 1100 },
        { time: 1700, base: 1400 },
        { time: 2000, base: 1700 },
        { time: 2300, base: 2000 }
    ];

    let short_forcast_data = {};

    const cal_time_str = cal_time.toString().padStart(4, '0');
    const cal_base_time_str = cal_base_time.toString().padStart(4, '0');

    const next_time_str = next_time.toString().padStart(4, '0');

    // 현재시간이 특정시간(0200, 0500, 0800, 1100, 1400, 1700, 2000, 2300)일때
    // 1700일때
    if (baseTimes.some(({ time, base }) => time === cal_time)) {
        const prev_base_time_str = baseTimes.find(({ time }) => time === cal_time).base.toString().padStart(4, '0');

        // 3시간전의 단기예보 API를 돌린다
        // 14시의 단기예보 API를 돌린다
        const prevQueryParams = new URLSearchParams({
            serviceKey,
            pageNo: '1',
            numOfRows: '1000',
            dataType: 'JSON',
            base_date: input_date,
            base_time: prev_base_time_str,
            nx: input_x,
            ny: input_y
        });
        const prevForecastData = await fetchForecastData(prevQueryParams);

        // 현재 시간의 강수확률을 구해 forecastData에 넣는다
        // 17시의 강수확률 구해 forecastData에 넣는다
        const fcstTimeData = prevForecastData.find(item => item.fcstTime === cal_time_str && item.category === 'POP');
        if (fcstTimeData)
            short_forcast_data[cal_time_str] = { POP: fcstTimeData.fcstValue };

        // 17시의 단기예보 API를 돌린다
        const queryParams = new URLSearchParams({
            serviceKey,
            pageNo: '1',
            numOfRows: '1000',
            dataType: 'JSON',
            base_date: '20230722',
            base_time: cal_base_time_str,
            nx: '59',
            ny: '125'
        });
        const forecastData = await fetchForecastData(queryParams);

        // 나머지 5시간의 강수확률을 구한다
        // 1800 1900 2000 2100 2200의 강수확률을 구해 forecastData에 넣는다
        let check = 0;
        for (const item of forecastData) {
            const fcstTime = item.fcstTime;

            if (check === 5)
                break;

            if (item.category === "POP" && (fcstTime === next_time_str || check > 0)) {
                short_forcast_data[fcstTime] = { POP: item.fcstValue };
                check++;
            }
        }
        // console.log(short_forcast_data);

    }

    // 특정시간이 아닐때
    // 가까운 base_time으로 6시간의 강수확률을 forecastData에 넣는다.
    else {
        const queryParams = new URLSearchParams({
            serviceKey,
            pageNo: '1',
            numOfRows: '1000',
            dataType: 'JSON',
            base_date: '20230722',
            base_time: cal_base_time_str,
            nx: '59',
            ny: '125'
        });

        const forecastData = await fetchForecastData(queryParams);

        let check = 0;

        for (const item of forecastData) {
            const fcstTime = item.fcstTime;

            if (check === 6)
                break;

            if (item.category === "POP" && (fcstTime === cal_time_str || check > 0)) {
                short_forcast_data[fcstTime] = { POP: item.fcstValue };
                check++;
            }
        }

        //console.log(short_forcast_data);
    }
    return short_forcast_data;
}

// 사용 예시
const input_date = '20230722'
const input_time = '2109';
const input_x = '59';
const input_y = '125';

getShortForecastData(input_date, input_time, input_x, input_y)
    .then(POP_data => {
        console.log(POP_data);
    })
    .catch(error => {
        console.error(error);
    });