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

// 2023.12.07 김건학
// 입력받은 시각('HH:MM')의 base_time('HH:00')을 리턴하는 함수
export function convertTimeFormat(time) {
  var basetime = time.replace(":", "");
  basetime = basetime.replace(/(\d{2})(\d{2})/, "$100");
  return basetime;
}

// 입력받은 시각('HH:MM')에 int형 time을 더한 결과('HH:MM')를 리턴하는 함수
export function addTime(cur_time, time) {
  // ":"를 기준으로 시간과 분을 분리
  var [cur_hours, cur_minutes] = cur_time.split(":").map(Number);

  cur_minutes += time;

  if (cur_minutes >= 60) {
    cur_minutes -= 60;
    cur_hours += 1;
  }
  if (cur_hours >= 24) {
    cur_hours -= 24;
  }

  // 문자열로 변환하고, 한자리 수일 경우 '0'을 추가
  const result_hours = cur_hours.toString().padStart(2, "0");
  const result_minutes = cur_minutes.toString().padStart(2, "0");

  // ":"로 구분된 문자열을 리턴
  return `${result_hours}:${result_minutes}`;
}

window.getTimeStamp = getTimeStamp; // 전역 스코프에 getTimeStamp 함수 추가
