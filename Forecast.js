// 단기예보
// 강수확률(POP)
const { response } = require('express');
const fetch = require('node-fetch');

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
    } = cal_basetime_basedate(input_date, input_time);

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

        // 17시의 단기예보 API를 돌린다
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

        // 나머지 5시간의 강수확률을 구한다
        // 1800 1900 2000 2100 2200의 강수확률을 구해 forecastData에 넣는다
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

function cal_basetime_basedate(input_date, input_time) {
    let cur_time = parseInt(input_time, 10);
    let cur_base_time = Math.floor((cur_time + 90) / 300) * 300 - 100;
    const cur_base_date = input_date;
    let prev_base_date = input_date;

    if (cur_base_time === -100) {
        cur_base_time = 2300;
        prev_base_date = get_prev_date(input_date); // 이전달의 마지막 날
    }

    cur_time = Math.floor(cur_time / 100) * 100;
    next_time = Math.floor(cur_time / 100) * 100 + 100;

    if (next_time === 2400)
        next_time = 0;

    return { cur_time, cur_base_time, cur_base_date, prev_base_date, next_time };
}


function get_prev_date(input_date) {
    // input_date를 YYYYMMDD 형식에서 년, 월, 일로 분리
    const year = parseInt(input_date.substring(0, 4), 10);
    const month = parseInt(input_date.substring(4, 6), 10);

    let prev_month = month - 1;
    let prev_year = year;
    if (prev_month === 0) {
        prev_month = 12; // 이전 달이 0월인 경우 12월로 설정
        prev_year -= 1; // 이전 달이 0월인 경우 이전 해로 설정
    }

    // Date 객체를 생성하여 이전 달의 1일을 구함
    const prev_first_day = new Date(prev_year, prev_month - 1, 1);
    const prev_last_day = new Date(prev_first_day.getTime() - 1).getDate();

    // 이전 달의 마지막 날을 YYYYMMDD 형식으로 반환
    const prev_date = `${prev_year}${String(prev_month).padStart(2, '0')}${String(prev_last_day).padStart(2, '0')}`;
    return prev_date;
}

// 사용 예시
const input_date = '20230724'
const input_time = '1410';
const input_x = '59';
const input_y = '125';

get_Forecast_Data(input_date, input_time, input_x, input_y)
    .then(POP_data => {
        console.log(POP_data);
    })
    .catch(error => {
        console.error(error);
    });