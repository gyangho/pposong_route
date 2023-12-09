var db = require('./db');

// 예제: 프로미스 패턴 사용
function get_6weather_Data(x, y) {
    return new Promise((resolve, reject) => {
        db.query(`SELECT * FROM FORECAST WHERE X = ${x} AND Y = ${y}`, (error, results, fields) => {
            if (error) {
                reject(error);
            } else {
                resolve(results);
            }
        });
    });
}

// 예제: 프로미스 패턴 사용
function get_1weather_Data(x, y, time) {
    return new Promise((resolve, reject) => {
        db.query(`SELECT * FROM FORECAST WHERE X = ${x} AND Y = ${y} AND TIME = '${time}'`, (error, results, fields) => {
            if (error) {
                reject(error);
            } else {
                resolve(results);
            }
        });
    });
}

module.exports = {
    get_6weather_Data: get_6weather_Data,
    get_1weather_Data: get_1weather_Data
};
