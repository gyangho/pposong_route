// 단기예보
// 강수확률(POP)
const { response } = require('express');
const fetch = require('node-fetch');
const calculate = require('./cal_time_date.js');


const url = 'http://apis.data.go.kr/1360000/VilageFcstInfoService_2.0/getVilageFcst'; /*URL*/
const serviceKey = 'YVQkpHY14ykgf2l2ayZx+wOfqTGaLVjka0T1pl7g4PsQuB6cGA/wrf5j8AT9dKraniz5z8rTowBF2RM0W+8jkg==';

function fetch_forecast_data(queryParams) {
    return fetch(url + '?' + queryParams)
        .then(response => response.json())
        .then(data => data.response.body.items.item)
        .catch(error => console.error(error));
}

// 단기예보API로 앞으로 6시간의 강수확률을 받아오는 함수
async function get_Forecast_Data(input_date, input_time, input_x, input_y) {
    const {
        cur_time,       //  '분'을 제거한 현재 시간
        cur_base_time,  //  input_time과 가장 가까운 base_time
        cur_base_date,  //  input_date
        prev_base_date, //  input_date이 1일일때 이전달의 마지막 날
        next_time       //  input_time + 1시간
    } = calculate.get_basetime_basedate(input_date, input_time, 90, 300);
    // 단기예보 API제공시간 : 3시간 주기로 매 10분 --> time_to_add를 90, time_to_divide를 300으로 한다.

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

    let forecast_datas = {};
    const cur_time_str = cur_time.toString().padStart(4, '0');
    const cur_base_time_str = cur_base_time.toString().padStart(4, '0');
    const next_time_str = next_time.toString().padStart(4, '0');

    // 현재시간이 특정시간(0200, 0500, 0800, 1100, 1400, 1700, 2000, 2300)일때
    // 1700일때
    if (baseTimes.some(({ time, base }) => time === cur_time)) {
        const prev_base_time_str = baseTimes.find(({ time }) => time === cur_time).base.toString().padStart(4, '0');

        // 3시간전의 단기예보 API를 돌린다
        // 14시의 단기예보 API를 돌린다
        const prevQueryParams = new URLSearchParams({
            serviceKey,
            pageNo: '1',
            numOfRows: '1000',
            dataType: 'JSON',
            base_date: prev_base_date,
            base_time: prev_base_time_str,
            nx: input_x,
            ny: input_y
        });
        const prev_forecast_data = await fetch_forecast_data(prevQueryParams);

        // 현재 시간의 강수확률을 구해 forecastData에 넣는다
        // 17시의 강수확률 구해 forecastData에 넣는다
        const fcstTimeData = prev_forecast_data.find(item => item.fcstTime === cur_time_str && item.category === 'POP');
        if (fcstTimeData)
            forecast_datas[cur_time_str] = { POP: fcstTimeData.fcstValue };

        // 나머지 5시간의 강수확률을 구한다
        // 17시의 단기예보 API를 돌린다
        // 1800 1900 2000 2100 2200의 강수확률을 구해 forecastData에 넣는다
        const queryParams = new URLSearchParams({
            serviceKey,
            pageNo: '1',
            numOfRows: '1000',
            dataType: 'JSON',
            base_date: cur_base_date,
            base_time: cur_base_time_str,
            nx: input_x,
            ny: input_y
        });
        const cur_forecast_data = await fetch_forecast_data(queryParams);

        let check = 0;
        for (const item of cur_forecast_data) {
            const fcstTime = item.fcstTime;

            if (check === 5)
                break;

            if (item.category === "POP" && (fcstTime === next_time_str || check > 0)) {
                forecast_datas[fcstTime] = { POP: item.fcstValue };
                check++;
            }
        }
    }

    // 특정시간이 아닐때
    // 가까운 base_time으로 6시간의 강수확률을 forecastData에 넣는다.
    else {
        const queryParams = new URLSearchParams({
            serviceKey,
            pageNo: '1',
            numOfRows: '1000',
            dataType: 'JSON',
            base_date: cur_base_date,
            base_time: cur_base_time_str,
            nx: input_x,
            ny: input_y
        });

        const cur_forecast_data = await fetch_forecast_data(queryParams);

        let check = 0;

        for (const item of cur_forecast_data) {
            const fcstTime = item.fcstTime;

            if (check === 6)
                break;

            if (item.category === "POP" && (fcstTime === cur_time_str || check > 0)) {
                forecast_datas[fcstTime] = { POP: item.fcstValue };
                check++;
            }
        }
    }
    return forecast_datas;
}

// 사용 예시
const input_date = '20230724'
const input_time = '1810';
const input_x = '59';
const input_y = '125';

get_Forecast_Data(input_date, input_time, input_x, input_y)
    .then(POP_data => {
        console.log(POP_data);
    })
    .catch(error => {
        console.error(error);
    });