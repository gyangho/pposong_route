const calculate = require('./cal_time_date.js');
const pposong_time = require('./pposong_time.js');


function cal_pposong_time(input_date, input_time, route) {
    const times = get_4time(input_date, input_time, 100);   // 30분간격 4time
    const pposong_results1 = [];    // 구간별 결과들
    const pposong_results2 = [];    // 총 결과들

    times.forEach(time => {
        const pposong_result = [];  // 구간의 결과
        let start_time = time.Time;
        let end_time = start_time;
        let start_date = time.Date;
        let end_date = start_date;

        let RN1_sum = 0;
        let RN1;

        route.sections.forEach(section => {
            end_time = parseInt(start_time, 10);
            let add_time = Math.round(section.sectionTime / 60);
            end_time += add_time;
            if (end_time % 100 >= 60) {
                end_time += 40;
                if (end_time >= 2400) {
                    end_date = calculate.get_next_basedate(start_date);
                    end_time -= 2400;
                }
            }

            let hours = String(Math.floor(end_time / 100)).padStart(2, '0');
            let minutes = String(end_time % 100).padStart(2, '0');
            end_time = hours + minutes;

            let base_time = Math.floor((parseInt(start_time, 10)) / 100) * 100;

            if (base_time === 2400)
                base_time = 0;

            let base_time_str = base_time.toString().padStart(4, '0');

            if (section.mode === 'WALK') {
                let X = section.X;
                let Y = section.Y;
                // db에서 RN1받아옴
                // let RN1 = db에서 base_time_str, X, Y 강수량 받아옴;
                RN1 = 3;   // 예시

                RN1 = parseFloat((RN1 * section.sectionTime * 100 / 60 / 100 / 60).toFixed(2)); // 소수점 둘째짜리까지
                RN1_sum += RN1;
            }

            else   // 이동수단이 BUS, SUBWAY인경우
                RN1 = 0;

            pposong_result.push({
                DATE: start_date,
                START_TIME: start_time,
                END_TIME: end_time,
                TRAVEL_TIME: add_time,
                BASE_TIME: base_time_str,
                RN1: RN1,
            });
            start_time = end_time;
            start_date = end_date;

        });
        pposong_results1.push(pposong_result);
        pposong_results2.push({ START_TIME: time.Time, END_TIME: end_time, RN1_SUM: RN1_sum });
    });
    return { pposong_results1, pposong_results2 };

}

function get_4time(input_date, input_time) {
    let cur_time = parseInt(input_time, 10);
    let cur_base_date = input_date;

    let times = [];

    for (idx = 0; idx < 4; idx++) {
        let cur_base_time = Math.floor(cur_time / 100) * 100;

        let cur_time_str = cur_time.toString().padStart(4, '0');

        times.push({ Date: cur_base_date, Time: cur_time_str });

        cur_time += 30;
        if (cur_time % 100 >= 60)
            cur_time += 40
        if (cur_time >= 2400) {
            cur_time -= 2400
            cur_base_date = calculate.get_next_basedate(cur_base_date);
        }
    }

    return times;
}

module.exports = {
    get_4time: get_4time,
    cal_pposong_time: cal_pposong_time
};