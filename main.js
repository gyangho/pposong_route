const express = require('express')
const https = require('https')
const session = require('express-session')
const schedule = require('node-schedule')
const bodyParser = require('body-parser');
const FileStore = require('session-file-store')(session)
const forecast = require('./API/Ultra_Forecast.js')
const fs = require('fs');
const authRouter = require('./auth');
const authCheck = require('./authCheck.js');
const db = require('./db');
const path = require('path');
const weather = require("./get_weather_Data.js");
const { createDynamicHTML } = require("./result.js");

//서울 시 내 격자 좌표들
var locArr =
    [[63, 125], [63, 126], [63, 127],
    [62, 129], [62, 128], [62, 127], [62, 126], [62, 125],
    [61, 129], [61, 128], [61, 127], [61, 126], [61, 125], [61, 124],
    [60, 128], [60, 127], [60, 126], [60, 125],
    [59, 128], [59, 127], [59, 126], [59, 125], [59, 124],
    [58, 127], [58, 126], [58, 125], [58, 124],
    [57, 127], [57, 126], [57, 125]]; //30개

const privateKeyPath = '../Key/private-key.pem'; // 개인 키 파일 경로
const certificatePath = '../Key/certificate.pem'; // 인증서 파일 경로

const privateKey = fs.readFileSync(privateKeyPath, 'utf8');
const certificate = fs.readFileSync(certificatePath, 'utf8');
const credentials = {
    key: privateKey,
    cert: certificate,
};

const app = express()
const port = 1521

const httpsServer = https.createServer(credentials, app);

//날짜, 시간 구하기
function getTimeStamp(i) {
    var d = new Date();
    if (i == 1) {
        var s =
            leadingZeros(d.getFullYear(), 4) + leadingZeros(d.getMonth() + 1, 2) + leadingZeros(d.getDate(), 2);
    }
    else if (i == 2) {
        var s = leadingZeros(d.getHours(), 2) + leadingZeros(d.getMinutes(), 2);
    }
    else if (i == 3) {
        let s0 = leadingZeros(d.getHours(), 2) + ":" + leadingZeros(d.getMinutes(), 2);
        d.setMinutes(d.getMinutes() + 30);
        let s1 = leadingZeros(d.getHours(), 2) + ":" + leadingZeros(d.getMinutes(), 2);
        d.setMinutes(d.getMinutes() + 30);
        let s2 = leadingZeros(d.getHours(), 2) + ":" + leadingZeros(d.getMinutes(), 2);
        d.setMinutes(d.getMinutes() + 30);
        let s3 = leadingZeros(d.getHours(), 2) + ":" + leadingZeros(d.getMinutes(), 2);
        var s = [s0, s1, s2, s3];
    }
    return s;
}

function leadingZeros(n, digits) {
    var zero = '';
    n = n.toString();

    if (n.length < digits) {
        for (i = 0; i < digits - n.length; i++)
            zero += '0';
    }

    return zero + n;
}

async function getWeatherDataAndRenderPage(filePath, res) {
    var grid_data = [];
    try {
        for (var idx = 0; idx < 30; idx++) {
            var data = await weather.get_6weather_Data(locArr[idx][0], locArr[idx][1]);
            grid_data.push(data);
        }

        fs.readFile(filePath, "utf8", (err, data) => {
            if (err) {
                res.status(500).send("Error reading file");
            } else {
                const update_data = data.replace(`{{grid_data}}`, JSON.stringify(grid_data));
                res.send(update_data);
            }
        });
    } catch (error) {
        console.error(error);
        res.status(500).send("Error getting data");
    }
}

function queryAsync(sql, params) {
    return new Promise((resolve, reject) => {
        db.query(sql, params, (error, results, fields) => {
            if (error) {
                reject(error);
            } else {
                resolve(results);
            }
        });
    });
}


//함수 끝

app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

app.use(express.static(path.join(__dirname, '/public')));
app.use('/script', express.static(__dirname + '/public'));

app.use(session({
    secret: 'SECRETKEY',	// 비밀키
    resave: false,
    saveUninitialized: true,
    store: new FileStore(),
}))

//첫페이지
app.get('/', (req, res) => {
    if (!authCheck.isOwner(req, res)) {  // 로그인 안되어있으면 로그인 페이지로 이동시킴
        res.redirect('/auth/login');
        return false;
    } else {                                      // 로그인 되어있으면 메인 페이지로 이동시킴
        res.redirect('/main');
        return false;
    }
})

// 인증 라우터
app.use('/auth', authRouter);

// 메인 페이지
app.get('/main', async (req, res) => {
    if (!authCheck.isOwner(req, res)) {  // 로그인 안되어있으면 로그인 페이지로 이동시킴
        res.redirect('/auth/login');
        return false;
    }
    const filePath = path.join(__dirname, "/views/map.html");
    await getWeatherDataAndRenderPage(filePath, res);
})

//마이페이지
app.get('/main/mypage', (req, res) => {
    const loggedInUsername = req.session.is_logined ? req.session.nickname : 'Guest';
    const filePath = path.join(__dirname, '/views/mypage.html');
    fs.readFile(filePath, 'utf8', (err, data) => {
        if (err) {
            res.status(500).send('Error reading file');
        }
        else {
            // 외부 HTML 파일 내부의 {loggedInUsername}을 실제 사용자명으로 대체하여 전송
            const modifiedData = data.replace(/{loggedInUsername}/g, loggedInUsername);
            res.send(modifiedData);
        }
    });
})

//북마크
app.get('/main/mypage/bookmark', async (req, res) => {
    const filePath = path.join(__dirname, '/views/bookmark.html');
    let Routes = {};
    try {
        Routes = await transport.getPublicTransport(126.9961, 37.5035, 126.96, 37.4946, 202307291200) //신반포역->정보관
        if (Routes.length < 1) {
            //경로없음
            res.send("경로없음");
        }
        else {
        }
    }
    catch (error) {
        console.error(error);
    };
    let sRoutes = JSON.stringify(Routes[0]);
    let mRoutes = sRoutes.replace(/"/g, '@@');
    fs.readFile(filePath, 'utf8', (err, data) => {
        if (err) {
            res.status(500).send('Error reading file');
        }
        else {
            // 외부 HTML 파일 내부의 {T#}을 대체하여 전송
            const modifiedData = data
                .replace(/{{R}}/g, mRoutes);
            res.send(modifiedData);
        }
    });
})

//장소 검색
app.get('/main/POI', async (req, res) => {
    const filePath = path.join(__dirname, "/views/mainFunc.html");
    fs.readFile(filePath, "utf8", (err, data) => {
        if (err) {
            res.status(500).send("Error reading file");
        } else {
            res.send(data);
        }
    });
})

//검색결과
app.get('/main/POI/result', async (req, res) => {
    let resource = req.query;
    try {
        const html = await createDynamicHTML(resource);
        res.send(html);
    } catch (error) {
        console.error("Error handling request:", error);
        res.status(500).send("Internal Server Error");
    }
})

//뽀송타임
app.get("/main/POI/result/pposong", async (req, res) => {
    const filePath = path.join(__dirname, "/views/pposong.html");
    await getWeatherDataAndRenderPage(filePath, res);
});

// 2023.12.08 김건학
// pposong.html에서 보낸 도보 데이터 받기, db검색 후 파싱, pposong.html로 데이터 전송

// 2023.12.08 김건학
// pposong.html에서 보낸 도보 데이터 받기, db검색 후 파싱, pposong.html로 데이터 전송
// 한 time의 데이터만 받아오는 기존 방식을 4 time 데이터 모두 받게 수정
app.post("/main/POI/result/pposong/cal", async (req, res) => {
    const receivedData = req.body;
    var resultData = [];
    try {
        for (const walkData of receivedData.WalkData) {
            const sectionData = [];
            var sum_RN1 = 0;
            for (const section of walkData) {
                const weatherData = await queryAsync(
                    "SELECT * FROM FORECAST WHERE TIME = ? AND X = ? AND Y =  ?",
                    [section.basetime, section.X, section.Y]
                );
                var section_RN1 = (weatherData[0].RN1 * section.sectiontime) / 60;
                sum_RN1 += section_RN1;
                sectionData.push({
                    DATE: weatherData[0].DATE,
                    REH: weatherData[0].REH,
                    RN1: weatherData[0].RN1,
                    T1H: weatherData[0].T1H,
                    TIME: weatherData[0].TIME,
                    WSD: weatherData[0].WSD,
                    X: weatherData[0].X,
                    Y: weatherData[0].Y,
                    section_RN1: section_RN1,
                });
            }
            var WalkWeatherData = {
                sum_RN1: sum_RN1,
                walkData: sectionData,
            };
            resultData.push(WalkWeatherData);
        }
    } catch (error) {
        console.error(error);
    }
    res.json({ response: resultData });
});

httpsServer.listen(port, () => {
    console.log(`Example app listening on port ${port}`);
    schedule.scheduleJob('50 0,14,20,30,40,50 * * * *', async function () {
        console.log('Forecast Updating Started....');
        const input_date = getTimeStamp(1);
        const input_time = getTimeStamp(2);

        for (let i = 0; i < 30; i++) {
            try {
                const input_x = locArr[i][0];
                const input_y = locArr[i][1];

                var ultra_forecast_datas = await forecast.get_Ultra_Forecast_Data(input_date, input_time, input_x, input_y);
                for (let j = 0; j < 6; j++) {
                    try {
                        db.query('INSERT INTO foreCast (DATE, TIME, X, Y, RN1, T1H, REH, WSD, UPTIME) VALUES(?,?,?,?,?,?,?,?,?)',
                            [ultra_forecast_datas[j].Date, ultra_forecast_datas[j].Time, ultra_forecast_datas[j].X, ultra_forecast_datas[j].Y,
                            ultra_forecast_datas[j].RN1, ultra_forecast_datas[j].T1H, ultra_forecast_datas[j].REH, ultra_forecast_datas[j].WSD, input_time],
                            await function (error, results, fields) {
                                if (error) throw error;
                            });
                    }
                    catch (error) {
                        console.error(error);
                    }
                }
            }
            catch (error) {
                console.log("ERROR MERGED");
                console.error(error);
                i--;
            };
        }

        db.query('DELETE FROM FORECAST WHERE UPTIME != ?', [input_time],
            await function (error, results, fields) {
                if (error) throw error;
            });
        console.log("DONE!");
    });
})