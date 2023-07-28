// 초단기예보
// 기온(T1H), 1시간 강수량(RN1), 하늘 상태(SKY), 습도(REH), 강수형태(PTY), 풍속(WSD)

const { response } = require('express');
const fetch = require('node-fetch');
const calculate = require('./cal_time_date.js');

const serviceKey = 'YVQkpHY14ykgf2l2ayZx+wOfqTGaLVjka0T1pl7g4PsQuB6cGA/wrf5j8AT9dKraniz5z8rTowBF2RM0W+8jkg==';
const url = 'http://apis.data.go.kr/1360000/VilageFcstInfoService_2.0/getUltraSrtFcst'; // 초단기예보 URL
const url2 = 'http://apis.data.go.kr/1360000/VilageFcstInfoService_2.0/getUltraSrtNcst';// 초단기실황 URL

function fetch_ultra_forecast_data(queryParams) {   // 초단기예보
    return fetch(url + '?' + queryParams)
        .then(response => response.json())
        .then(data => data.response.body.items.item)
        .catch(error => console.error(error));
}
function fetch_ultra_nowcast_data(prevQueryParams) {    // 초단기실황
    return fetch(url2 + '?' + prevQueryParams)
        .then(response => response.json())
        .then(data => data.response.body.items.item)
        .catch(error => console.error(error));
}

async function get_Ultra_Forecast_Data(input_date, input_time, input_x, input_y) {
    let {
        cur_time,
        cur_base_time,  //  input_time과 가장 가까운 base_time
        prev_base_date
    } = calculate.get_basetime_basedate(input_date, input_time, 60, 100);
    // 초단기예측 API제공시간 : 1시간 주기로 매 40분 --> time_to_add를 60, time_to_divide를 100으로 한다.
    const cur_base_time_str = cur_base_time.toString().padStart(4, '0');

    const queryParams = new URLSearchParams({
        serviceKey,
        pageNo: '1',
        numOfRows: '1000',
        dataType: 'JSON',
        base_date: prev_base_date,
        base_time: cur_base_time_str,
        nx: input_x,
        ny: input_y
    });

    // 초단기예측 6시간 결과
    // 1100 ~ 1144 --> 초단기예측(base_time : 1000) --> 11, 12, 13, 14, 15, 16
    // 1200 ~ 1244 --> 초단기예측(base_time : 1100) --> 12, 13, 14, 15, 16, 17
    if (input_time % 100 < 45) {    // (1, 3)
        const items = await fetch_ultra_forecast_data(queryParams);
        const ultra_forecast_datas = [];
        let next_time = cur_time;
        let check = 0, check2 = 0;

        for (const item of items) {
            const fcstTime = item.fcstTime;
            const category = item.category;
            const fcstValue = item.fcstValue;

            if (next_time === Number(fcstTime) && ['T1H', 'RN1', 'REH', 'WSD'].includes(category)) {
                // 이미 존재하는 객체인지 확인
                const existingData = ultra_forecast_datas.find(data => data.Time === fcstTime);

                if (existingData) {
                    // 이미 존재하는 객체라면 해당 프로퍼티를 추가
                    if (category === 'RN1') {
                        if (fcstValue === '강수없음')
                            existingData[category] = 0;
                        else
                            existingData[category] = fcstValue;
                    } else {
                        existingData[category] = fcstValue;
                    }
                } else {
                    if (check2 === 0 && fcstTime === '0000')    // 첫 fcstTime이 0시일때 base_date+1
                        prev_base_date = calculate.get_next_basedate(prev_base_date);
                    check2++;

                    // 새로운 객체를 생성하고 배열에 추가
                    const data = { Date: prev_base_date, Time: fcstTime, X: input_x, Y: input_y };
                    if (category === 'RN1') {
                        if (fcstValue === '강수없음')
                            data[category] = 0;
                        else
                            data[category] = fcstValue;
                    } else {
                        data[category] = fcstValue;
                    }
                    ultra_forecast_datas.push(data);
                }
                check++;
                if (check == 6) {
                    next_time = cur_time;
                    if (next_time == 2400) {
                        next_time = 0;
                        prev_base_date = calculate.get_next_basedate(prev_base_date);
                    }
                    check = 0;
                }
                else {
                    next_time += 100; // 100 분을 더해서 다음 시간으로 이동
                    if (next_time == 2400) {
                        next_time = 0;
                        prev_base_date = calculate.get_next_basedate(prev_base_date);
                    }
                }
            } else {
                next_time = cur_time;
                if (next_time == 2400) {
                    next_time = 0;
                    prev_base_date = calculate.get_next_basedate(prev_base_date);
                }
                check = 0;
            }
        }
        return ultra_forecast_datas;
    }

    // 초단기실황 결과 1개 + 초단기예측 결과 5개
    // 1145 ~ 1159 --> 초단기실황(base_time : 1100) --> 11
    //                 + 초단기예측(base_time : 1100) --> 12, 13, 14, 15, 16
    // 1245 ~ 1259 --> 초단기실황(base_time : 1200) --> 12
    //                 + 초단기예측(base_time : 1200) --> 13, 14, 15, 16, 16
    else {
        let {
            cur_base_time,  //  input_time과 가장 가까운 base_time
            cur_base_date,  //  input_date
            prev_base_date
        } = calculate.get_basetime_basedate(input_date, input_time, 55, 100);
        // 초단기실황 API제공시간 : 1시간 주기로 매 45분 --> time_to_add를 55, time_to_divide를 100으로 한다.
        const cur_base_time_str = cur_base_time.toString().padStart(4, '0');

        const prevQueryParams = new URLSearchParams({
            serviceKey,
            pageNo: '1',
            numOfRows: '1000',
            dataType: 'JSON',
            base_date: cur_base_date,
            base_time: cur_base_time_str,
            nx: input_x,
            ny: input_y
        });

        //초단기실황 1개
        const ultra_nowcast_data = await fetch_ultra_nowcast_data(prevQueryParams);
        const items = ultra_nowcast_data;
        const ultra_forecast_datas = [];
        let t1h, rn1, reh, wsd;
        items.forEach(item => {
            // 기온(T1H), 1시간 강수량(RN1), 습도(REH), 풍속(WSD)
            if (item.category === "RN1") {
                if (item.obsrValue === '강수없음')   // 강수없음 --> 0
                    rn1 = 0;
                else
                    rn1 = parseFloat(item.obsrValue);
            }
            else if (item.category === "T1H")
                t1h = item.obsrValue;
            else if (item.category === "REH")
                reh = item.obsrValue;
            else if (item.category === "WSD")
                wsd = item.obsrValue;
        });
        ultra_forecast_datas.push({ Date: parseInt(cur_base_date), Time: cur_base_time_str, X: input_x, Y: input_y, RN1: rn1, T1H: t1h, REH: reh, WSD: wsd });

        // 초단기예보 5개
        const ultra_forecast_data = await fetch_ultra_forecast_data(queryParams);
        const items2 = ultra_forecast_data;

        cur_time = next_time;
        let check = 0;

        for (const item of items2) {
            const fcstTime = item.fcstTime;
            const category = item.category;
            const fcstValue = item.fcstValue;

            if (next_time === Number(fcstTime) && ['T1H', 'RN1', 'REH', 'WSD'].includes(category)) {
                // 이미 존재하는 객체인지 확인
                const existingData = ultra_forecast_datas.find(data => data.Time === fcstTime);

                if (existingData) {
                    // 이미 존재하는 객체라면 해당 프로퍼티를 추가
                    if (category === 'RN1') {
                        if (fcstValue === '강수없음')
                            existingData[category] = 0;
                        else
                            existingData[category] = fcstValue;
                    } else {
                        existingData[category] = fcstValue;
                    }
                } else {
                    // 새로운 객체를 생성하고 배열에 추가
                    const data = { Date: prev_base_date, Time: fcstTime, X: input_x, Y: input_y };
                    if (category === 'RN1') {
                        if (fcstValue === '강수없음')
                            data[category] = 0;
                        else
                            data[category] = fcstValue;
                    } else {
                        data[category] = fcstValue;
                    }
                    ultra_forecast_datas.push(data);
                }
                check++;
                if (check == 6) {
                    next_time = cur_time;
                    if (next_time == 2400) {
                        next_time = 0;
                        prev_base_date = calculate.get_next_basedate(prev_base_date);
                    }
                    check = 0;
                }
                else {
                    next_time += 100; // 100 분을 더해서 다음 시간으로 이동
                    if (next_time == 2400) {
                        next_time = 0;
                        prev_base_date = calculate.get_next_basedate(prev_base_date);
                    }
                }
            } else {
                next_time = cur_time;
                if (next_time == 2400) {
                    next_time = 0;
                    prev_base_date = calculate.get_next_basedate(prev_base_date);
                }
                check = 0;
            }
        }
        return ultra_forecast_datas;
    }
}

module.exports = {
    get_Ultra_Forecast_Data: get_Ultra_Forecast_Data
};

// 사용 예시
const input_date = '20230729'
const input_time = '0015';
const input_x = 59;
const input_y = 125;
// const input_x = '64';
// const input_y = '127';

get_Ultra_Forecast_Data(input_date, input_time, input_x, input_y)
    .then(ultra_forecast_datas => {
        console.log(ultra_forecast_datas);
    })
    .catch(error => {
        console.error(error);
    });