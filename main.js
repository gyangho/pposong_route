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

const express = require('express');
const https = require('https');
const transport = require('./public_transport.js');
const fs = require('fs');
const bodyParser = require('body-parser');
const path = require('path');
const ejs = require('ejs');

const app = express();
const port = 1521;
const options = {
    key: fs.readFileSync('./rootca.key'),
    cert: fs.readFileSync('./rootca.crt')
};

app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

app.use(express.static(path.join(__dirname, '/public')));

app.get('/main/POI', async (req, res) => {
    let stime = getTimeStamp(1) + "1200";

    try {
        //Routes = await transport.getPublicTransport(126.9961, 37.5035, 126.96, 37.4946, stime) //신반포역->정보관
        // Routes = await transport.getPublicTransport(127.2148, 37.5818, 126.96, 37.4946, stime) //집->정보관
        Routes = await transport.getPublicTransport(126.6447, 37.3789, 126.96, 37.4946, stime) // 용인 ->정보관
        if (Routes.length < 1) {
            //경로없음
            res.send("경로없음");
        } else {
            const filePath = path.join(__dirname, '/views/result.html');

            fs.readFile(filePath, 'utf8', (err, data) => {
                if (err) {
                    console.error(err);
                    res.status(500).send('Error reading file');
                } else {
                    const dynamicRoutes = Routes.map((Route) => {
                        const sectionsHtml = Route.sections.map(section => {
                            const vehicleHtml = section => {
                                let vehicleIcon = '';
                                let additionalHtml = '';
                            
                                if (section.mode === 'WALK') {
                                    vehicleIcon = '<i class="fa-solid fa-person-walking"></i>';

                                } else if (section.mode === 'SUBWAY') {
                                    vehicleIcon = '<i class="fa-solid fa-subway"></i>';
                                    additionalHtml = `
                                        <span class="route-name" style="color: ${section.route_color};">
                                            ${section.route_name}
                                        </span>
                                        <div class="route-list__vehicle-stop"></div>
                                            ${section.section_start.name} ~ ${section.section_end.name}`;
                                    
                                } else if (section.mode === 'BUS') {
                                    vehicleIcon = '<i class="fa-solid fa-bus"></i>';
                                    additionalHtml = `
                                        <span class="route-name" style="color: ${section.route_color};">
                                            ${section.route_name}
                                        </span>
                                        <div class="route-list__vehicle-stop"></div>
                                            ${section.section_start.name} ~ ${section.section_end.name}`;
                                }
                            
                                return `
                                        <div class="route-list__vehicle">
                                            <div class="route-list__vehicle-info">
                                                ${vehicleIcon}
                                                ${additionalHtml}
                                            </div>
                                        </div>
                                `;
                            };
                            
                            return vehicleHtml(section);
                        }).join('');
                            
                        return `
                        <div class = "route-list">
                        <div class="route-list__column">
                        <div class="route-list__time">
                                <h4 class="route-list__total-time">총 소요시간 : ${Route.totalTime}</h4>
                                <h6 class="route-list__walk-time">총 도보 시간 : ${Route.totalWalkTime}</h6>
                                <h6 class="route-list__walk-time">총 도보 거리 : ${Route.totalWalkDistance}</h6>
                            </div>
                            <div class="route-list__bookmark">
                                <i class="fa-regular fa-star fa-xl"></i>
                            </div>
                        </div>    
                            ${sectionsHtml}
                        </div>`;
                    }).join('');

                    const modifiedTemplate = data.replace('{{DYNAMIC_CONTENT}}', dynamicRoutes);

                    res.send(modifiedTemplate);
                }
            });
        }
    } catch (error) {
        console.error(error);
        res.status(500).send('Error fetching data');
    }
});

https.createServer(options, app).listen(port);