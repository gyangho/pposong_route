const express = require('express');
const https = require('https');
const transport = require('./public_transport.js');
const fs = require('fs');
const fs2 = require('fs').promises;
const bodyParser = require('body-parser');
const path = require('path');
const url = require('url');
const { resourceUsage } = require('process');
const schedule = require('node-schedule')
const forecast = require('./Ultra_Forecast.js')
var db = require('./db');
const { Console } = require('console');

const app = express();
const port = 1521;
var locArr = [
    [60, 127], [61, 127], [60, 126], [59, 126], [61, 126],
    [62, 126], [62, 127], [62, 128], [60, 128], [61, 128],
    [61, 129], [62, 129], [59, 127], [59, 128], [58, 127],
    [58, 126], [57, 126], [58, 125], [57, 127], [57, 125],
    [59, 124], [59, 125], [58, 124], [60, 125], [61, 125],
    [61, 124], [62, 125], [63, 125], [63, 126], [63, 127]
];

//날짜, 시간 구하기
function getTimeStamp(i) {
    var d = new Date();
    if (i == 1) {   // 날짜
        var s =
            leadingZeros(d.getFullYear(), 4) + leadingZeros(d.getMonth() + 1, 2) + leadingZeros(d.getDate(), 2);
    }
    else if (i == 2) {  // 시간
        var s = leadingZeros(d.getHours(), 2) + leadingZeros(d.getMinutes(), 2);
    }
    else if (i == 3) {  // 30분간격 4개의 시간 배열
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
    return n.toString().padStart(digits, '0');
}

async function readFile(filePath) {
    try {
        const data = await fs2.readFile(filePath, 'utf8');
        return data;
    } catch (err) {
        console.error(err);
        throw err;
    }
}

const options = {
    key: fs.readFileSync('./localhost.key'),
    cert: fs.readFileSync('./localhost.crt')
};

app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

app.use(express.static(path.join(__dirname, '/public')));

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

});

app.get('/main/POI/result', async (req, res) => {
    var resource = req.query;

    try {
        Routes = await transport.GetRoot(resource.start_lon, resource.start_lat, resource.end_lon, resource.end_lat);
        const filePath = path.join(__dirname, '/views/result.html');
        const fileData = await readFile(filePath);

        var PATH = '';
        Routes.map((Path) => {
            var SUBPATH = '';
            const hours = Math.floor(Path.TotalTime / 60);
            const minutes = Path.TotalTime % 60;
            let TotalTimeString = '';

            if (hours > 0) 
                TotalTimeString = `${hours}시간 ${minutes}분`;
            else 
                TotalTimeString = `${minutes}분`;

            Path.SubPaths.map(SubPath => {
                var vehicleIcon = '';
                var additionalHtml = '';

                switch (SubPath.Type) {
                    case 'SUBWAY':
                        vehicleIcon = `
                            <i class="fa-solid fa-subway" style="color:${SubPath.SubwayColor}"></i>
                            <span class="route-name">${SubPath.SubwayName}</span>`;
                        additionalHtml = `
                            <div class="route-list__vehicle-stop"></div>
                            <div>
                                ${SubPath.StartName} ~ ${SubPath.EndName}<br>
                                ${SubPath.StationCount}개 역<br>
                                ${SubPath.SectionTime}분
                            </div>`;
                    break;   
                    case 'BUS':
                        const VehicleIcons = SubPath.LaneInfo.map(LaneInfo => `
                            <i class="fa-solid fa-bus" style="color:${LaneInfo.BusColor}"></i>
                            <span class="route-name">${LaneInfo.BusNo}</span>
                            `).join('');
                        vehicleIcon = `
                            <span class="route-name">
                                ${VehicleIcons}
                            </span>`;
                        additionalHtml = `
                            <div class="route-list__vehicle-stop"></div>
                            <div>
                                ${SubPath.StartName} ~ ${SubPath.EndName}<br>
                                ${SubPath.StationCount}정거장<br>
                                ${SubPath.SectionTime}분
                            </div>`;
                    break;    
                    case 'WALK':
                        if (SubPath.SectionTime != 0) {
                            vehicleIcon = '<i class="fa-solid fa-person-walking"></i>';
                            additionalHtml = `
                            <div>${SubPath.Distance}m<br>
                            ${SubPath.SectionTime}분</div>`;
                        }
                    break;     
                }
                SUBPATH += `
                    <div class="route-list__vehicle">
                        <div class="route-list__vehicle-info">
                            ${vehicleIcon}
                            ${additionalHtml}
                        </div>
                    </div>
                `;
            });
            
            PATH += `
                <div class = "route-list">
                <div class="route-list__column">
                <div class="route-list__time">
                        <h4 class="route-list__total-time">총 소요시간 : ${TotalTimeString}</h4>
                        <h6 class="route-list__walk-time">총 도보 시간 : ${Path.TotalWalkTime}분</h6>
                        <h6 class="route-list__walk-time">총 도보 거리 : ${Path.TotalWalk}m</h6>
                        <h6 class="route-list__walk-time">가격 : ${Path.Payment}원</h6>
                    </div>
                    <div class="route-list__bookmark">
                        <i class="fa-regular fa-star fa-xl"></i>
                    </div>
                </div>
                <div class="route-list__vehicle">${resource.start}</div>
                ${SUBPATH}
                <div class="route-list__vehicle">${resource.end}</div>    
                </div>`;
        });

        const modifiedTemplate = fileData.replace(`{{DYNAMIC_CONTENT}}`, PATH);
        res.send(modifiedTemplate);

    } catch (err) {
        console.error('파일 읽기 에러:', err);
    }
});

const httpsServer = https.createServer(options, app);

httpsServer.listen(port, () => {
    console.log(`Example app listening on port ${port}`);
    schedule.scheduleJob('10 0,10,20,30,40,50 * * * *', async function () {
        const input_date = getTimeStamp(1);
        const input_time = getTimeStamp(2);
        const promises = [];
        const HH = input_time.toString().substring(0, 2);
        const MM = input_time.toString().substring(2);
        const time = input_time.toString().substring(0, 2) + "00";
        console.log('________________________________');
        console.log(`Forecast Updating Started[${HH}:${MM}]`);
        console.time(`Forecast Update[${HH}:${MM}] 소요시간`);

        for (let i = 0; i < 30; i++) {
            try {
                const input_x = locArr[i][0];
                const input_y = locArr[i][1];

                var Data = forecast.get_Ultra_Forecast_Data(input_date, input_time, input_x, input_y);
            
                promises.push(Data);
            }
            catch (error) {
                console.log("ERROR MERGED");
                console.error(error);
                i--;
            };
        }
        const ultra_forecast_datas = await Promise.all(promises);
        console.log(`Promise End([${HH}:${MM}]날씨 데이터)`);
        //console.log(ultra_forecast_datas);
        
        //40~44(분)인 경우, 현재 시간의 날씨 데이터를 사용해야 한다.
        if (40 <= input_time % 100 && input_time % 100 <= 44) { 
            db.query('DELETE FROM FORECAST WHERE TIME != ?', [time],    // 현재 시각 제외 모두 삭제
            await function (error, results, fields) {
                if (error) throw error;
                });
            
            for (let i = 0; i < 30; i++) {
                for (let j = 0; j < 5; j++) {
                    try {
                        db.query('INSERT INTO foreCast (DATE, TIME, X, Y, RN1, T1H, REH, WSD, UPTIME) VALUES(?,?,?,?,?,?,?,?,?)', [ultra_forecast_datas[i][j].Date, ultra_forecast_datas[i][j].Time, ultra_forecast_datas[i][j].X, ultra_forecast_datas[i][j].Y, ultra_forecast_datas[i][j].RN1, ultra_forecast_datas[i][j].T1H, ultra_forecast_datas[i][j].REH, ultra_forecast_datas[i][j].WSD, input_time],
                            await function (error, results, fields) {
                                if (error) throw error;
                            });
                    }
                    catch (error) {
                        console.error(error);
                    }
                }
            }
        }
        else {  // input_time이 다른 모든 데이터 다 삭제
            db.query('DELETE FROM FORECAST WHERE UPTIME != ?', [input_time],
                await function (error, results, fields) {
                    if (error) throw error;
                });
                for (let i = 0; i < 30; i++) {
                    for (let j = 0; j < 6; j++) {
                        try {
                            db.query('INSERT INTO foreCast (DATE, TIME, X, Y, RN1, T1H, REH, WSD, UPTIME) VALUES(?,?,?,?,?,?,?,?,?)', [ultra_forecast_datas[i][j].Date, ultra_forecast_datas[i][j].Time, ultra_forecast_datas[i][j].X, ultra_forecast_datas[i][j].Y, ultra_forecast_datas[i][j].RN1, ultra_forecast_datas[i][j].T1H, ultra_forecast_datas[i][j].REH, ultra_forecast_datas[i][j].WSD, input_time],
                                await function (error, results, fields) {
                                    if (error) throw error;
                                });
                        }
                        catch (error) {
                            console.error(error);
                        }
                    }
                }
        }
        console.log("DONE!(DB foreCast update)");
        console.timeEnd(`Forecast Update[${HH}:${MM}] 소요시간`);
    });
})
