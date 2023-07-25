// 초단기실황
// 습도(REH), 1시간 강수량(RN1), 기온(T1H), 풍속(WSD)

const { response } = require('express');
const fetch = require('node-fetch');
const calculate = require('./cal_time_date.js');

const serviceKey = 'YVQkpHY14ykgf2l2ayZx+wOfqTGaLVjka0T1pl7g4PsQuB6cGA/wrf5j8AT9dKraniz5z8rTowBF2RM0W+8jkg==';


async function get_Ultra_Nowcast_Data(input_date, input_time, input_x, input_y) {
    // input_time의 '분'이 40이상일때(40 ~ 59) --> 현재시간의 초단기실황
    // 1140 ~ 1159 --> 초단기실황(base_time : 1100) 
    // 1240 ~ 1259 --> 초단기실황(base_time : 1200)
    if (input_time % 100 >= 40) {
        const url = 'http://apis.data.go.kr/1360000/VilageFcstInfoService_2.0/getUltraSrtNcst'; // 초단기실황 URL

        function fetch_ultra_nowcast_data(queryParams) {
            return fetch(url + '?' + queryParams)
                .then(response => response.json())
                .then(data => data.response.body.items.item)
                .catch(error => console.error(error));
        }
        const {
            cur_base_time,  //  input_time과 가장 가까운 base_time
            cur_base_date,  //  input_date
        } = calculate.get_basetime_basedate(input_date, input_time, 60, 100);
        // 초단기실황 API제공시간 : 1시간 주기로 매 40분 --> time_to_add를 60, time_to_divide를 100으로 한다.

        const queryParams = new URLSearchParams({
            serviceKey,
            pageNo: '1',
            numOfRows: '1000',
            dataType: 'JSON',
            base_date: cur_base_date,
            base_time: cur_base_time,
            nx: input_x,
            ny: input_y
        });

        const ultra_nowcast_datas = await fetch_ultra_nowcast_data(queryParams);
        const ultra_nowcast_data = {
            "REH": ultra_nowcast_datas[1].obsrValue,
            "RN1": ultra_nowcast_datas[2].obsrValue,
            "T1H": ultra_nowcast_datas[3].obsrValue,
            "WSD": ultra_nowcast_datas[7].obsrValue
        };

        return ultra_nowcast_data;
    }

    // input_time의 '분'이 40미만일때(00 ~ 39) --> base_time이 1시간 이전인 초단기예보
    // 1100 ~ 1139 --> 초단기예보(base_time : 1000) 
    // 1200 ~ 1239 --> 초단기예보(base_time : 1100)
    else {
        const url2 = 'http://apis.data.go.kr/1360000/VilageFcstInfoService_2.0/getUltraSrtFcst'; /*URL2*/

        function fetch_ultra_forecast_data(queryParams2) {
            return fetch(url2 + '?' + queryParams2)
                .then(response => response.json())
                .then(data => data.response.body.items.item)
                .catch(error => console.error(error));
        }

        const {
            cur_time,       //  '분'을 제거한 현재 시간
            cur_base_time,  //  input_time과 가장 가까운 base_time
            cur_base_date,  //  input_date
        } = calculate.get_basetime_basedate(input_date, input_time, 55, 100);

        const queryParams2 = new URLSearchParams({
            serviceKey,
            pageNo: '1',
            numOfRows: '1000',
            dataType: 'JSON',
            base_date: cur_base_date,
            base_time: cur_base_time,
            nx: input_x,
            ny: input_y
        });

        const ultra_nowcast_data = await fetch_ultra_forecast_data(queryParams2);
        const items = ultra_nowcast_data;
        const ultra_nowcast_datas = {};

        for (const item of items) {
            const fcstTime = item.fcstTime;
            const category = item.category;
            const fcstValue = item.fcstValue;

            // cur_time과 item.fcstTime이 같고, item.category가 'T1H', 'SKY', 'REH', 'PTY', 'WSD'인 경우에만 저장
            if (cur_time === Number(fcstTime) && ['T1H', 'RN1', 'SKY', 'REH', 'PTY', 'WSD'].includes(category)) {
                if (category == 'RN1' && fcstValue === '강수없음')
                    ultra_nowcast_datas[category] = '0';
                else
                    ultra_nowcast_datas[category] = fcstValue;
            }
        }
        return ultra_nowcast_datas
    }
}

const input_date = '20230725'
const input_time = '1354';
const input_x = '59';
const input_y = '125';


get_Ultra_Nowcast_Data(input_date, input_time, input_x, input_y)
    .then(ultra_nowcast_data => {
        console.log(ultra_nowcast_data);
    })
    .catch(error => {
        console.error(error);
    });