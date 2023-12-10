const express = require("express");
const https = require("https");
const fs = require("fs");
const schedule = require('node-schedule');
const bodyParser = require("body-parser");
const axios = require('axios');
const cors = require("cors");
const forecast = require("./Ultra_Forecast.js");
const td = require("./cal_time_date.js");
const db = require("./db.js");
const { GetRoot } = require("./public_transport.js");

const locArr = [
  [61, 129],
  [62, 129],
  [59, 128],
  [60, 128],
  [61, 128],
  [62, 128],
  [57, 127],
  [58, 127],
  [59, 127],
  [60, 127],
  [61, 127],
  [62, 127],
  [63, 127],
  [57, 126],
  [58, 126],
  [59, 126],
  [60, 126],
  [61, 126],
  [62, 126],
  [63, 126],
  [57, 125],
  [58, 125],
  [59, 125],
  [60, 125],
  [61, 125],
  [62, 125],
  [63, 125],
  [58, 124],
  [59, 124],
  [61, 124],
];

const options = {
  key: fs.readFileSync("../Key/private-key.pem"),
  cert: fs.readFileSync("../Key/certificate.pem"),
};

const app = express();
const port = 8888;

const httpsServer = https.createServer(options, app);

app.use(cors());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

app.get('/api/POI', async (req, res) => {
  input = req.query;
  let url = `https://dapi.kakao.com/v2/local/search/keyword.json?query=${encodeURIComponent(input.query)}`;
  let config = {
    headers: {
      'Authorization': `KakaoAK fb7f423e7875f1d8206180cb55202084`
    }
  };
  let apiResponse = await axios.get(url, config);
  let response = {
    documents: apiResponse.data.documents,
    status: apiResponse.status,
  };
  console.log(input.query);
  res.send(response);
})


app.get('/api/map', async (req, res) => {
  let url = `https://dapi.kakao.com/v2/maps/sdk.js?appkey=819399e434bd90427a278678b6e68250`;
  let response = await axios.get(url);
  res.send(response.data);
})

app.get('/api/Odsay', async (req, res) => {
  let endPoint = req.query;
  console.log(endPoint);
  const Routes = await GetRoot(
    endPoint.start_lon,
    endPoint.start_lat,
    endPoint.end_lon,
    endPoint.end_lat
  );
  res.send(Routes);
})


httpsServer.listen(port, () => {
  console.log(`Example app listening on port ${port}`);
  schedule.scheduleJob("50 0,10,20,30,40,50 * * * *", async function () {
    const input_date = td.getTimeStamp(1);
    const input_time = td.getTimeStamp(2);
    const promises = [];
    const HH = input_time.toString().substring(0, 2);
    const MM = input_time.toString().substring(2);
    const time = input_time.toString().substring(0, 2) + "00";
    console.log("________________________________");
    console.log(`Forecast Updating Started[${HH}:${MM}]`);
    console.time(`Forecast Update[${HH}:${MM}] 소요시간`);

    for (let i = 0; i < 30; i++) {
      try {
        const input_x = locArr[i][0];
        const input_y = locArr[i][1];

        var Data = forecast.get_Ultra_Forecast_Data(input_date, input_time, input_x, input_y);

        promises.push(Data);
      } catch (error) {
        console.log("ERROR MERGED");
        console.error(error);
        i--;
      }
    }

    const ultra_forecast_datas = await Promise.all(promises);
    console.log(`Promise End([${HH}:${MM}]날씨 데이터)`);
    //console.log(ultra_forecast_datas);

    //40~44(분)인 경우, 현재 시간의 날씨 데이터를 사용해야 한다.
    if (40 <= input_time % 100 && input_time % 100 <= 44) {
      for (let i = 0; i < 30; i++) {
        for (let j = 0; j < 5; j++) {
          try {
            db.query(
              "INSERT INTO foreCast (DATE, TIME, X, Y, RN1, T1H, REH, WSD, UPTIME) VALUES(?,?,?,?,?,?,?,?,?)",
              [
                ultra_forecast_datas[i][j].Date,
                ultra_forecast_datas[i][j].Time,
                ultra_forecast_datas[i][j].X,
                ultra_forecast_datas[i][j].Y,
                ultra_forecast_datas[i][j].RN1,
                ultra_forecast_datas[i][j].T1H,
                ultra_forecast_datas[i][j].REH,
                ultra_forecast_datas[i][j].WSD,
                input_time,
              ],
              await function (error, results, fields) {
                if (error) throw error;
              }
            );
          } catch (error) {
            console.error(error);
          }
        }
      }
      db.query(
        "DELETE FROM FORECAST WHERE TIME != ?",
        [time], // 현재 시각 제외 모두 삭제
        await function (error, results, fields) {
          if (error) throw error;
        }
      );
    } else {
      for (let i = 0; i < 30; i++) {
        for (let j = 0; j < 6; j++) {
          try {
            db.query(
              "INSERT INTO foreCast (DATE, TIME, X, Y, RN1, T1H, REH, WSD, UPTIME) VALUES(?,?,?,?,?,?,?,?,?)",
              [
                ultra_forecast_datas[i][j].Date,
                ultra_forecast_datas[i][j].Time,
                ultra_forecast_datas[i][j].X,
                ultra_forecast_datas[i][j].Y,
                ultra_forecast_datas[i][j].RN1,
                ultra_forecast_datas[i][j].T1H,
                ultra_forecast_datas[i][j].REH,
                ultra_forecast_datas[i][j].WSD,
                input_time,
              ],
              await function (error, results, fields) {
                if (error) throw error;
              }
            );
          } catch (error) {
            console.error(error);
          }
        }
      }
      // input_time이 다른 모든 데이터 다 삭제
      db.query(
        "DELETE FROM FORECAST WHERE UPTIME != ?",
        [input_time],
        await function (error, results, fields) {
          if (error) throw error;
        }
      );
    }
    console.log("DONE!(DB foreCast update)");
    console.timeEnd(`Forecast Update[${HH}:${MM}] 소요시간`);
  });
});
