const fetchData_transport = require('./public_transport.js');
const pposong_time = require('./pposong_time.js');

let input_date = 20230728;
let input_time = '2310';

const times = pposong_time.get_4time(input_date, input_time, 100);

console.log(times);

fetchData_transport.getPublicTransport(126.9961, 37.5035, 126.96, 37.4946, 202307281200)
    .then(routes => {
        console.log(routes[0]);
        const result = pposong_time.cal_pposong_time(input_date, input_time, routes[0]);    // 원하는 루트, 원하는 시간

        console.log(result.pposong_results1);
        console.log(result.pposong_results2);
    })
    .catch(error => {
        console.error(error);
    });