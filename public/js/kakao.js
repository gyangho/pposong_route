// 2023.12.08 채수아
// pposong.html에서 루트 데이터 출력하는 코드 kakao.js로 분리

// 2023.12.08 김건학
// 루트 데이터에 누락된 출발지, 도착지 이름 localStorage를 이용해 처리
function click_route() {
    window.addEventListener("DOMContentLoaded", function () {
        var Routes = JSON.parse(localStorage.getItem("Route"));

        var PATH = "";
        var SUBPATH = "";
        var TotalTimeString = "";

        const hours = Math.floor(Routes.TotalTime / 60); //시간 계산
        const minutes = Routes.TotalTime % 60; //분 계산

        if (hours > 0)
            //1시간 이상이면
            TotalTimeString = `${hours}시간 ${minutes}분`;
        else TotalTimeString = `${minutes}분`;

        if (Routes) {
            for (var i = 0; i < Routes.SubPaths.length; i++) {
                // 수정: Routes.SubPaths를 사용하여 반복
                var SubPath = Routes.SubPaths[i];
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
                        const BusColor = SubPath.LaneInfo.BusColor;
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

                SUBPATH += `
                    <div class="reset_bar" style="height:${(SubPath.SectionTime / Routes.TotalTime) * 100
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
            }

            PATH += `
                    <div class="route-list">
                        <div class="route-list__column">
                            <div class="route-list__time">
                                <h4 class="route-list__total-time">총 소요시간 : ${TotalTimeString}</h4>
                                <h6 class="route-list__walk-time">총 도보 시간 : ${Routes.TotalWalkTime}분</h6>
                                <h6 class="route-list__walk-time">총 도보 거리 : ${Routes.TotalWalk}m</h6>
                                <h6 class="route-list__walk-time">가격 : ${Routes.Payment}원</h6>
                            </div>
                            <div class="route-list__bookmark">
                                <i class="fa-regular fa-star fa-xl"></i>
                            </div>
                        </div>
                        <div class="route-list__vehicle"> ${this.localStorage.start}</div>
                        <div class="total">
                            ${SUBPATH}
                        </div>
                        <div class="route-list__vehicle"> ${this.localStorage.end}</div>
                    </div>`;
        }
        document.getElementById("dynamicContent").innerHTML = PATH;
    });
}
click_route();