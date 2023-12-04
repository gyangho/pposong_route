const fs2 = require("fs").promises;
const path = require("path");
const transport = require("./public_transport.js");

async function readFile(filePath) {
  try {
    const data = await fs2.readFile(filePath, "utf8");
    return data;
  } catch (err) {
    console.error(err);
    throw err;
  }
}

// HTML 요소를 동적으로 생성하는 함수
async function createDynamicHTML(data) {
  try {
    var resource = data;

    const Routes = await transport.GetRoot(
      resource.start_lon,
      resource.start_lat,
      resource.end_lon,
      resource.end_lat
    );

    const filePath = path.join(__dirname, "/views/result.html");
    const fileDataBuffer = await readFile(filePath);
    const fileData = fileDataBuffer.toString();

    var PATH = "";
    if (Routes.length > 0) {
      Routes.map((Path) => {
        var SUBPATH = "";
        const hours = Math.floor(Path.TotalTime / 60); //시간 계산
        const minutes = Path.TotalTime % 60; //분 계산
        let TotalTimeString = "";

        if (hours > 0)
          //1시간 이상이면
          TotalTimeString = `${hours}시간 ${minutes}분`;
        else TotalTimeString = `${minutes}분`;

        Path.SubPaths.map((SubPath) => {
          var vehicleIcon = "";
          var additionalHtml = "";
          var vertical_bar = "";

          switch (SubPath.Type) {
            case "SUBWAY": //지하철이면
              vehicleIcon = `
                        <i class="fa-solid fa-subway" style="color:${SubPath.SubwayColor}"></i>
                        <span class="route-name">${SubPath.SubwayName}</span>`;
              additionalHtml = `
                        <div class="route-list__vehicle-stop"></div>
                        <div>
                            ${SubPath.StartName} ~ ${SubPath.EndName}<br>
                            ${SubPath.StationCount}개 역<br>   
                        </div>`;
              vertical_bar = `
                        <div class="route-list__bar" style="border-left: thick solid ${SubPath.SubwayColor};">
                            ${SubPath.SectionTime}분
                        </div>`;

              break;
            case "BUS": //버스이면
              const VehicleIcons = SubPath.LaneInfo.map(
                (LaneInfo) => `
                        <i class="fa-solid fa-bus" style="color:${LaneInfo.BusColor}"></i>
                        <span class="route-name">${LaneInfo.BusNo}</span>
                        `
              ).join("");
              vehicleIcon = `
                        <span class="route-name">
                            ${VehicleIcons}
                        </span>`;
              additionalHtml = `
                        <div class="route-list__vehicle-stop"></div>
                        <div>
                            ${SubPath.StartName} ~ ${SubPath.EndName}<br>
                            ${SubPath.StationCount}정거장<br> 
                        </div>`;
              vertical_bar = `
                        <div class="route-list__bar" style="border-left: thick solid ${SubPath.LaneInfo[0].BusColor};">
                                ${SubPath.SectionTime}분
                        </div>`;
              break;
            case "WALK":
              if (SubPath.SectionTime != 0) {
                vehicleIcon = '<i class="fa-solid fa-person-walking"></i>';
                additionalHtml = `
                        <div>${SubPath.Distance}m<br>
                        </div>`;
                vertical_bar = `
                        <div class="route-list__bar" style="border-left: thick dotted black;">
                            ${SubPath.SectionTime}분
                        </div>`;
              }
              break;
          }
          //div class="reset_bar" height 수정 line107
          //수정 2023.12.1 채수아
          SUBPATH += `
                <div class="reset_bar" style="height:${
                  (SubPath.SectionTime / Path.TotalTime) * 100
                }%;"> 
                        ${vertical_bar}
                    <div class="route-list__vehicle">
                        <div class="route-list__vehicle-info">
                            ${vehicleIcon}
                            ${additionalHtml}
                        </div>
                    </div> 
               </div>
            `;
        });
        //div class="total"수정 line 134
        //수정 2023.12.1 채수아
        PATH += `
          <div class="route-list">
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
            <div class="total">
                ${SUBPATH}
            </div>
            <div class="route-list__vehicle">${resource.end}</div>
        </div>`;
      });
    }

    const modifiedTemplate = fileData.replace(`{{DYNAMIC_CONTENT}}`, PATH);

    const routeJSON = JSON.stringify(Routes);
    const finalTemplate = `${modifiedTemplate}
        <script>
            var Routes = ${routeJSON}
        </script>`;
    return finalTemplate;

    //return modifiedTemplate;
  } catch (error) {
    console.error(error);
  }
}
module.exports = { createDynamicHTML: createDynamicHTML };
