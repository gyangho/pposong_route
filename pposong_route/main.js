const express = require('express')
const https = require('https')
const session = require('express-session')
const bodyParser = require('body-parser');
const FileStore = require('session-file-store')(session)
const fs = require('fs');
const path = require('path');
const authRouter = require('./auth');
const authCheck = require('./authCheck.js');
const db = require('./db');
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

//2023.12.10 이경호
//POST /main/POI/result 에서 routes 값 받아오기 위해 최대길이 늘림
app.use(bodyParser.urlencoded({ limit: '10mb', extended: true }));
app.use(bodyParser.json({ limit: '10mb' }));
app.use(express.static(path.join(__dirname, '/public')));
app.use('/script', express.static(__dirname + '/public'));

app.use(session({
    secret: 'SECRETKEY',	// 비밀키
    resave: false,
    saveUninitialized: false,
    store: new FileStore({ reapInterval: 60 * 60 }), //세션 파일 삭제 주기
    cookie: {
        expires: 1000 * 60 * 60, //세션유지 1시간
    },
}))

// 인증 라우터
app.use('/auth', authRouter);

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
    /*let Routes = {};
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
    let mRoutes = sRoutes.replace(/"/g, '@@');*/
    fs.readFile(filePath, 'utf8', (err, data) => {
        if (err) {
            res.status(500).send('Error reading file');
        }
        else {
            res.send(data);
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
app.post('/main/POI/result', async (req, res) => {
    let resource = req.body;
    try {
        const html = await createDynamicHTML(resource);
        res.send(html);
        console.log(resource);
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

//2023.12.10 이경호
//전송데이터-수신데이터 오류 해결
app.post("/main/POI/result/pposong/cal", async (req, res) => {
    let receivedData = req.body.WalkData;
    let resultData = [];
    try {
        for (const walkData of receivedData) {
            const sectionData = [];
            var sum_RN1 = 0;
            for (const section of walkData) {
                const weatherData = await queryAsync(
                    "SELECT * FROM FORECAST WHERE TIME = ? AND X = ? AND Y =  ?",
                    [section.basetime, section.X, section.Y]
                );
                var section_RN1 = (Number(weatherData[0].RN1) * section.sectiontime) / 60;
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
                    section_RN1: section_RN1.toString(),
                });
            }
            var WalkWeatherData = {
                sum_RN1: sum_RN1.toString(),
                walkData: sectionData,
            };
            resultData.push(WalkWeatherData);
        }
    } catch (error) {
        console.error("pposong/cal 에러: " + error);
    }
    let strresult = JSON.stringify(resultData);
    res.send(strresult);
});

httpsServer.listen(port, () => {
    console.log(`Example app listening on port ${port}`);
})