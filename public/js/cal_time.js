// 2023.12.04 김건학
// main화면에서 사용할 1시간 간격의 6개의 시각 계산
// pposong화면에서 30분 간격의 사용할 4개의 시각 계산

//날짜, 시간 구하기
export function getTimeStamp(i) {
  var d = new Date();
  if (i == 1) {
    // 날짜
    var s =
      leadingZeros(d.getFullYear(), 4) +
      leadingZeros(d.getMonth() + 1, 2) +
      leadingZeros(d.getDate(), 2);
  } else if (i == 2) {
    // 시간
    var s = leadingZeros(d.getHours(), 2) + leadingZeros(d.getMinutes(), 2);
  } else if (i == 3) {
    // 30분간격 4개의 시간 배열
    let s0 = leadingZeros(d.getHours(), 2) + ":" + leadingZeros(d.getMinutes(), 2);
    d.setMinutes(d.getMinutes() + 30);
    let s1 = leadingZeros(d.getHours(), 2) + ":" + leadingZeros(d.getMinutes(), 2);
    d.setMinutes(d.getMinutes() + 30);
    let s2 = leadingZeros(d.getHours(), 2) + ":" + leadingZeros(d.getMinutes(), 2);
    d.setMinutes(d.getMinutes() + 30);
    let s3 = leadingZeros(d.getHours(), 2) + ":" + leadingZeros(d.getMinutes(), 2);
    var s = [s0, s1, s2, s3];
  } else if (i == 4) {
    // 1시간간격 6개의 시간 배열
    let s0 = leadingZeros(d.getHours(), 2) + ":" + leadingZeros(d.getMinutes(), 2);
    d.setMinutes(d.getMinutes() + 60);
    let s1 = leadingZeros(d.getHours(), 2) + ":" + leadingZeros(d.getMinutes(), 2);
    d.setMinutes(d.getMinutes() + 60);
    let s2 = leadingZeros(d.getHours(), 2) + ":" + leadingZeros(d.getMinutes(), 2);
    d.setMinutes(d.getMinutes() + 60);
    let s3 = leadingZeros(d.getHours(), 2) + ":" + leadingZeros(d.getMinutes(), 2);
    d.setMinutes(d.getMinutes() + 60);
    let s4 = leadingZeros(d.getHours(), 2) + ":" + leadingZeros(d.getMinutes(), 2);
    d.setMinutes(d.getMinutes() + 60);
    let s5 = leadingZeros(d.getHours(), 2) + ":" + leadingZeros(d.getMinutes(), 2);
    var s = [s0, s1, s2, s3, s4, s5];
  }
  return s;
}

function leadingZeros(n, digits) {
  return n.toString().padStart(digits, "0");
}

window.getTimeStamp = getTimeStamp; // 전역 스코프에 getTimeStamp 함수 추가
