function get_basetime_basedate(input_date, input_time, time_to_add, time_to_divide) {
    let cur_time = parseInt(input_time, 10);
    let cur_base_time = Math.floor((cur_time + time_to_add) / time_to_divide) * time_to_divide - 100;
    const cur_base_date = input_date;
    let prev_base_date = parseInt(input_date);

    if (cur_base_time === -100) {
        cur_base_time = 2300;
        if (prev_base_date % 10 === 1)
            prev_base_date = get_prev_date(input_date); // 이전달의 마지막 날

        else
            prev_base_date -= 1;
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

function get_next_basedate(input_date) {
    const dateString = input_date.toString(); // int를 문자열로 변환
    const year = dateString.substring(0, 4); // 연도 추출
    const month = dateString.substring(4, 6); // 월 추출
    const day = dateString.substring(6); // 일 추출

    const currentDate = new Date(`${year}-${month}-${day}`);
    const nextDate = new Date(currentDate.getTime() + 24 * 60 * 60 * 1000);

    const nextYear = nextDate.getFullYear();
    const nextMonth = String(nextDate.getMonth() + 1).padStart(2, '0');
    const nextDay = String(nextDate.getDate()).padStart(2, '0');

    return Number(`${nextYear}${nextMonth}${nextDay}`);
}


module.exports = {
    get_basetime_basedate: get_basetime_basedate,
    get_next_basedate: get_next_basedate
};