var mysql = require('mysql2');

var db = mysql.createConnection({
    host: '127.0.0.1',
    user: 'root',
    password: '0202',
    database: 'pposong_route'
});
db.connect();

module.exports = db;