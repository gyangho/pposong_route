const express = require('express');
const https = require('https');
const transport = require('./public_transport.js');
const fs = require('fs');
const fs2 = require('fs').promises;
const bodyParser = require('body-parser');
const path = require('path');
const url = require('url');
const { resourceUsage } = require('process');
// var POI = require('./POI.js');

const app = express();
const port = 1521;

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

https.createServer(options, app).listen(port);