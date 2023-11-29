const express = require('express')
const https = require('https')
const session = require('express-session')
const schedule = require('node-schedule')
const bodyParser = require('body-parser');
const FileStore = require('session-file-store')(session)
const forecast = require('./API/Ultra_Forecast.js')
const fs = require('fs');
const transport = require('./API/public_transport.js')
const pposongtime = require('./pposongtime.js')
var calculate = require('./API/cal_time_date.js')
var authRouter = require('./auth');
var authCheck = require('./authCheck.js');
var db = require('./db');
var path = require('path');
var POI = require('./API/KAKAO_POI.js');

//서울 시 내 격자 좌표들
var locArr =
    [[63, 125], [63, 126], [63, 127],
    [62, 129], [62, 128], [62, 127], [62, 126], [62, 125],
    [61, 129], [61, 128], [61, 127], [61, 126], [61, 125], [61, 124],
    [60, 128], [60, 127], [60, 126], [60, 125],
    [59, 128], [59, 127], [59, 126], [59, 125], [59, 124],
    [58, 127], [58, 126], [58, 125], [58, 124],
    [57, 127], [57, 126], [57, 125]]; //30개

const privateKeyPath = './private-key.pem'; // 개인 키 파일 경로
const certificatePath = './certificate.pem'; // 인증서 파일 경로

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
app.get('/main', (req, res) => {
    if (!authCheck.isOwner(req, res)) {  // 로그인 안되어있으면 로그인 페이지로 이동시킴
        res.redirect('/auth/login');
        return false;
    }
    res.sendFile(path.join(__dirname, '/views/main.html'));
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

    let stime = getTimeStamp(1) + "1200";
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

    let stime = getTimeStamp(1) + "1200";
    let itime = parseInt(stime, 10);
    const filePath = path.join(__dirname, '/views/mainFunc.html');
    let Routes = {};
    fs.readFile(filePath, 'utf8', (err, data) => {
        if (err) {
            res.status(500).send('Error reading file');
        }
        else {
            res.send(data);
        }
    });

    /*
    let stime = getTimeStamp(1) + "1200";
    let itime = parseInt(stime, 10);
    const filePath = path.join(__dirname, '/views/mainFunc.html');
    let Routes = {};
    try {
        Routes = await transport.GetRoot(126.95976562412, 37.494571847859, 126.94765009467245, 37.562544705628845) //신반포역->정보관
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
    });*/
})

//검색 제출
app.post('/main/POI', function (request, response) {
    var input = request.body.location;
    try {
        const places = getPlacesFromInput(input);
        if (places.length > 0) {
            for (let poi_idx = 0; poi_idx < places.length; poi_idx++) {
                console.log(`장소[${poi_idx}]`);
                console.log(places[poi_idx]);
                console.log();
            }
        } else {
            console.log("검색 결과가 없습니다.");
        }
    } catch (err) {
        console.error(err);
    }
})

//검색결과
app.get('/main/POI/result', async (req, res) => {
    let stime = getTimeStamp(1) + "1200";
    let itime = parseInt(stime, 10);
    const filePath = path.join(__dirname, '/views/result.html');
    let Routes = {};
    try {
        Routes = await transport.GetRoot(126.95976562412, 37.494571847859, 126.94765009467245, 37.562544705628845) //신반포역->정보관
        //console.log(Routes[0]);
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
                .replace(/{{R}}/g, mRoutes)
                .replace('{{T}}', Math.round(Routes[0].totalTime / 60));
            res.send(modifiedData);
        }
    });
})

//뽀송타임

app.post('/main/POI/result/pposongtime1', async (req, res) => {
    const input_date = parseInt(getTimeStamp(1), 10);
    const input_time = getTimeStamp(2);
    const time = getTimeStamp(3);
    const filePath = path.join(__dirname, '/views/pposongtime.html');
    let sRoutes = req.body.Route;
    let Routes = JSON.parse(sRoutes.replace(/@@/g, '"'));
    let pposong_results = {};
    let modifiedData;
    pposong_results = await pposongtime.cal_pposong_time(input_date, input_time, Routes);
    console.log(pposong_results.pposong_results1);
    //console.log(pposong_results.pposong_results1[0]);
    fs.readFile(filePath, 'utf8', (err, data) => {
        if (err) {
            res.status(500).send('Error reading file');
        }
        else {
            // 외부 HTML 파일 내부의 {T#}을 대체하여 전송
            let D = data
                .replace('{{T}}', pposong_results.pposong_results1[0][0].TRAVEL_TIME
                    + pposong_results.pposong_results1[0][1].TRAVEL_TIME
                    + pposong_results.pposong_results1[0][2].TRAVEL_TIME
                    + pposong_results.pposong_results1[0][3].TRAVEL_TIME
                    + pposong_results.pposong_results1[0][4].TRAVEL_TIME)
                .replace('{{WT}}', pposong_results.pposong_results2[0].WTIME)
                .replace(/{{R}}/g, sRoutes)
                .replace(/{T0}/g, time[0])
                .replace(/{T1}/g, time[1])
                .replace(/{T2}/g, time[2])
                .replace(/{T3}/g, time[3])
                .replace(/{R0}/g, pposong_results.pposong_results2[0].RN1_SUM)
                .replace(/{R1}/g, pposong_results.pposong_results2[1].RN1_SUM)
                .replace(/{R2}/g, pposong_results.pposong_results2[2].RN1_SUM)
                .replace(/{R3}/g, pposong_results.pposong_results2[3].RN1_SUM);
            modifiedData = D
                .replace('{S0}', pposong_results.pposong_results1[0][0].TRAVEL_TIME)
                .replace('{S0}', pposong_results.pposong_results1[0][0].START_TIME)
                .replace('{S0}', pposong_results.pposong_results1[0][0].END_TIME)
                .replace('{S0}', pposong_results.pposong_results1[0][0].RN1)
                .replace('{S0}', pposong_results.pposong_results1[0][0].RN1 * pposong_results.pposong_results1[0][0].TRAVEL_TIME)
                .replace('{S0}', pposong_results.pposong_results1[0][1].TRAVEL_TIME)
                .replace('{S0}', pposong_results.pposong_results1[0][1].START_TIME)
                .replace('{S0}', pposong_results.pposong_results1[0][1].END_TIME)
                .replace('{S0}', pposong_results.pposong_results1[0][1].RN1)
                .replace('{S0}', pposong_results.pposong_results1[0][2].TRAVEL_TIME)
                .replace('{S0}', pposong_results.pposong_results1[0][2].START_TIME)
                .replace('{S0}', pposong_results.pposong_results1[0][2].END_TIME)
                .replace('{S0}', pposong_results.pposong_results1[0][2].RN1)
                .replace('{S0}', pposong_results.pposong_results1[0][2].RN1 * pposong_results.pposong_results1[0][2].TRAVEL_TIME)
                .replace('{S0}', pposong_results.pposong_results1[0][3].TRAVEL_TIME)
                .replace('{S0}', pposong_results.pposong_results1[0][3].START_TIME)
                .replace('{S0}', pposong_results.pposong_results1[0][3].END_TIME)
                .replace('{S0}', pposong_results.pposong_results1[0][3].RN1)
                .replace('{S0}', pposong_results.pposong_results1[0][4].TRAVEL_TIME)
                .replace('{S0}', pposong_results.pposong_results1[0][4].START_TIME)
                .replace('{S0}', pposong_results.pposong_results1[0][4].END_TIME)
                .replace('{S0}', pposong_results.pposong_results1[0][4].RN1)
                .replace('{S0}', pposong_results.pposong_results1[0][4].RN1 * pposong_results.pposong_results1[0][4].TRAVEL_TIME);

            res.send(modifiedData);
        }
    });
})

app.post('/main/POI/result/pposongtime2', async (req, res) => {
    await console.log("POST");
    const input_date = parseInt(getTimeStamp(1), 10);
    const input_time = getTimeStamp(2);
    const time = getTimeStamp(3);
    const filePath = path.join(__dirname, '/views/pposongtime.html');
    let sRoutes = req.body.Route;
    let Routes = JSON.parse(sRoutes.replace(/@@/g, '"'));
    let pposong_results = {};
    let modifiedData;
    pposong_results = await pposongtime.cal_pposong_time(input_date, input_time, Routes);
    //console.log(Routes);
    console.log(pposong_results.pposong_results1[0][0]);
    fs.readFile(filePath, 'utf8', (err, data) => {
        if (err) {
            res.status(500).send('Error reading file');
        }
        else {
            // 외부 HTML 파일 내부의 {T#}을 대체하여 전송
            let D = data
                .replace('{{T}}', pposong_results.pposong_results1[1][0].TRAVEL_TIME
                    + pposong_results.pposong_results1[1][1].TRAVEL_TIME
                    + pposong_results.pposong_results1[1][2].TRAVEL_TIME
                    + pposong_results.pposong_results1[1][3].TRAVEL_TIME
                    + pposong_results.pposong_results1[1][4].TRAVEL_TIME)
                .replace('{{WT}}', pposong_results.pposong_results2[0].WTIME)
                .replace(/{{R}}/g, sRoutes)
                .replace(/{T0}/g, time[0])
                .replace(/{T1}/g, time[1])
                .replace(/{T2}/g, time[2])
                .replace(/{T3}/g, time[3])
                .replace(/{R0}/g, pposong_results.pposong_results2[0].RN1_SUM)
                .replace(/{R1}/g, pposong_results.pposong_results2[1].RN1_SUM)
                .replace(/{R2}/g, pposong_results.pposong_results2[2].RN1_SUM)
                .replace(/{R3}/g, pposong_results.pposong_results2[3].RN1_SUM);
            modifiedData = D
                .replace('{S0}', pposong_results.pposong_results1[1][0].TRAVEL_TIME)
                .replace('{S0}', pposong_results.pposong_results1[1][0].START_TIME)
                .replace('{S0}', pposong_results.pposong_results1[1][0].END_TIME)
                .replace('{S0}', pposong_results.pposong_results1[1][0].RN1)
                .replace('{S0}', pposong_results.pposong_results1[1][0].RN1 * pposong_results.pposong_results1[1][0].TRAVEL_TIME)
                .replace('{S0}', pposong_results.pposong_results1[1][1].TRAVEL_TIME)
                .replace('{S0}', pposong_results.pposong_results1[1][1].START_TIME)
                .replace('{S0}', pposong_results.pposong_results1[1][1].END_TIME)
                .replace('{S0}', pposong_results.pposong_results1[1][1].RN1)
                .replace('{S0}', pposong_results.pposong_results1[1][2].TRAVEL_TIME)
                .replace('{S0}', pposong_results.pposong_results1[1][2].START_TIME)
                .replace('{S0}', pposong_results.pposong_results1[1][2].END_TIME)
                .replace('{S0}', pposong_results.pposong_results1[1][2].RN1)
                .replace('{S0}', pposong_results.pposong_results1[1][2].RN1 * pposong_results.pposong_results1[1][2].TRAVEL_TIME)
                .replace('{S0}', pposong_results.pposong_results1[1][3].TRAVEL_TIME)
                .replace('{S0}', pposong_results.pposong_results1[1][3].START_TIME)
                .replace('{S0}', pposong_results.pposong_results1[1][3].END_TIME)
                .replace('{S0}', pposong_results.pposong_results1[1][3].RN1)
                .replace('{S0}', pposong_results.pposong_results1[1][4].TRAVEL_TIME)
                .replace('{S0}', pposong_results.pposong_results1[1][4].START_TIME)
                .replace('{S0}', pposong_results.pposong_results1[1][4].END_TIME)
                .replace('{S0}', pposong_results.pposong_results1[1][4].RN1)
                .replace('{S0}', pposong_results.pposong_results1[1][4].RN1 * pposong_results.pposong_results1[1][4].TRAVEL_TIME);

            res.send(modifiedData);
        }
    });
})

app.post('/main/POI/result/pposongtime3', async (req, res) => {
    await console.log("POST");
    const input_date = parseInt(getTimeStamp(1), 10);
    const input_time = getTimeStamp(2);
    const time = getTimeStamp(3);
    const filePath = path.join(__dirname, '/views/pposongtime.html');
    let sRoutes = req.body.Route;
    let Routes = JSON.parse(sRoutes.replace(/@@/g, '"'));
    let pposong_results = {};
    let modifiedData;
    pposong_results = await pposongtime.cal_pposong_time(input_date, input_time, Routes);
    //console.log(Routes);
    console.log(pposong_results.pposong_results1[0][0]);
    fs.readFile(filePath, 'utf8', (err, data) => {
        if (err) {
            res.status(500).send('Error reading file');
        }
        else {
            // 외부 HTML 파일 내부의 {T#}을 대체하여 전송
            let D = data
                .replace('{{T}}', pposong_results.pposong_results1[2][0].TRAVEL_TIME
                    + pposong_results.pposong_results1[2][1].TRAVEL_TIME
                    + pposong_results.pposong_results1[2][2].TRAVEL_TIME
                    + pposong_results.pposong_results1[2][3].TRAVEL_TIME
                    + pposong_results.pposong_results1[2][4].TRAVEL_TIME)
                .replace('{{WT}}', pposong_results.pposong_results2[0].WTIME)
                .replace(/{{R}}/g, sRoutes)
                .replace(/{T0}/g, time[0])
                .replace(/{T1}/g, time[1])
                .replace(/{T2}/g, time[2])
                .replace(/{T3}/g, time[3])
                .replace(/{R0}/g, pposong_results.pposong_results2[0].RN1_SUM)
                .replace(/{R1}/g, pposong_results.pposong_results2[1].RN1_SUM)
                .replace(/{R2}/g, pposong_results.pposong_results2[2].RN1_SUM)
                .replace(/{R3}/g, pposong_results.pposong_results2[3].RN1_SUM);
            modifiedData = D
                .replace('{S0}', pposong_results.pposong_results1[2][0].TRAVEL_TIME)
                .replace('{S0}', pposong_results.pposong_results1[2][0].START_TIME)
                .replace('{S0}', pposong_results.pposong_results1[2][0].END_TIME)
                .replace('{S0}', pposong_results.pposong_results1[2][0].RN1)
                .replace('{S0}', pposong_results.pposong_results1[2][0].RN1 * pposong_results.pposong_results1[2][0].TRAVEL_TIME)
                .replace('{S0}', pposong_results.pposong_results1[2][1].TRAVEL_TIME)
                .replace('{S0}', pposong_results.pposong_results1[2][1].START_TIME)
                .replace('{S0}', pposong_results.pposong_results1[2][1].END_TIME)
                .replace('{S0}', pposong_results.pposong_results1[2][1].RN1)
                .replace('{S0}', pposong_results.pposong_results1[2][2].TRAVEL_TIME)
                .replace('{S0}', pposong_results.pposong_results1[2][2].START_TIME)
                .replace('{S0}', pposong_results.pposong_results1[2][2].END_TIME)
                .replace('{S0}', pposong_results.pposong_results1[2][2].RN1)
                .replace('{S0}', pposong_results.pposong_results1[2][2].RN1 * pposong_results.pposong_results1[2][2].TRAVEL_TIME)
                .replace('{S0}', pposong_results.pposong_results1[2][3].TRAVEL_TIME)
                .replace('{S0}', pposong_results.pposong_results1[2][3].START_TIME)
                .replace('{S0}', pposong_results.pposong_results1[2][3].END_TIME)
                .replace('{S0}', pposong_results.pposong_results1[2][3].RN1)
                .replace('{S0}', pposong_results.pposong_results1[2][4].TRAVEL_TIME)
                .replace('{S0}', pposong_results.pposong_results1[2][4].START_TIME)
                .replace('{S0}', pposong_results.pposong_results1[2][4].END_TIME)
                .replace('{S0}', pposong_results.pposong_results1[2][4].RN1)
                .replace('{S0}', pposong_results.pposong_results1[2][4].RN1 * pposong_results.pposong_results1[2][4].TRAVEL_TIME);

            res.send(modifiedData);
        }
    });
})

app.post('/main/POI/result/pposongtime4', async (req, res) => {
    await console.log("POST");
    const input_date = parseInt(getTimeStamp(1), 10);
    const input_time = getTimeStamp(2);
    const time = getTimeStamp(3);
    const filePath = path.join(__dirname, '/views/pposongtime.html');
    let sRoutes = req.body.Route;
    let Routes = JSON.parse(sRoutes.replace(/@@/g, '"'));
    let pposong_results = {};
    let modifiedData;
    pposong_results = await pposongtime.cal_pposong_time(input_date, input_time, Routes);
    //console.log(Routes);
    console.log(pposong_results.pposong_results1[0][0]);
    fs.readFile(filePath, 'utf8', (err, data) => {
        if (err) {
            res.status(500).send('Error reading file');
        }
        else {
            // 외부 HTML 파일 내부의 {T#}을 대체하여 전송
            let D = data
                .replace('{{T}}', pposong_results.pposong_results1[3][0].TRAVEL_TIME
                    + pposong_results.pposong_results1[3][1].TRAVEL_TIME
                    + pposong_results.pposong_results1[3][2].TRAVEL_TIME
                    + pposong_results.pposong_results1[3][3].TRAVEL_TIME
                    + pposong_results.pposong_results1[3][4].TRAVEL_TIME)
                .replace('{{WT}}', pposong_results.pposong_results2[0].WTIME)
                .replace(/{{R}}/g, sRoutes)
                .replace(/{T0}/g, time[0])
                .replace(/{T1}/g, time[1])
                .replace(/{T2}/g, time[2])
                .replace(/{T3}/g, time[3])
                .replace(/{R0}/g, pposong_results.pposong_results2[0].RN1_SUM)
                .replace(/{R1}/g, pposong_results.pposong_results2[1].RN1_SUM)
                .replace(/{R2}/g, pposong_results.pposong_results2[2].RN1_SUM)
                .replace(/{R3}/g, pposong_results.pposong_results2[3].RN1_SUM);
            modifiedData = D
                .replace('{S0}', pposong_results.pposong_results1[3][0].TRAVEL_TIME)
                .replace('{S0}', pposong_results.pposong_results1[3][0].START_TIME)
                .replace('{S0}', pposong_results.pposong_results1[3][0].END_TIME)
                .replace('{S0}', pposong_results.pposong_results1[3][0].RN1)
                .replace('{S0}', pposong_results.pposong_results1[3][0].RN1 * pposong_results.pposong_results1[3][0].TRAVEL_TIME)
                .replace('{S0}', pposong_results.pposong_results1[3][1].TRAVEL_TIME)
                .replace('{S0}', pposong_results.pposong_results1[3][1].START_TIME)
                .replace('{S0}', pposong_results.pposong_results1[3][1].END_TIME)
                .replace('{S0}', pposong_results.pposong_results1[3][1].RN1)
                .replace('{S0}', pposong_results.pposong_results1[3][2].TRAVEL_TIME)
                .replace('{S0}', pposong_results.pposong_results1[3][2].START_TIME)
                .replace('{S0}', pposong_results.pposong_results1[3][2].END_TIME)
                .replace('{S0}', pposong_results.pposong_results1[3][2].RN1)
                .replace('{S0}', pposong_results.pposong_results1[3][2].RN1 * pposong_results.pposong_results1[3][2].TRAVEL_TIME)
                .replace('{S0}', pposong_results.pposong_results1[3][3].TRAVEL_TIME)
                .replace('{S0}', pposong_results.pposong_results1[3][3].START_TIME)
                .replace('{S0}', pposong_results.pposong_results1[3][3].END_TIME)
                .replace('{S0}', pposong_results.pposong_results1[3][3].RN1)
                .replace('{S0}', pposong_results.pposong_results1[3][4].TRAVEL_TIME)
                .replace('{S0}', pposong_results.pposong_results1[3][4].START_TIME)
                .replace('{S0}', pposong_results.pposong_results1[3][4].END_TIME)
                .replace('{S0}', pposong_results.pposong_results1[3][4].RN1)
                .replace('{S0}', pposong_results.pposong_results1[3][4].RN1 * pposong_results.pposong_results1[3][4].TRAVEL_TIME);

            res.send(modifiedData);
        }
    });
})


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