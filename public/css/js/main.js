var newDIV1 = document.querySelector("#temperature");
var t = 25;
newDIV1.innerHTML = t + "℃";

var newDIV2 = document.querySelector("#others");
var p = 85;
var s = 90;
var w = 1;
var str = "강수확률: " + p + "%습도: " + s + "%\n<br>풍속: " + w + "m/s";
newDIV2.innerHTML = str;

var newDIV3 = document.querySelector("#icon");

var newDIV4 = document.querySelector("#alert");
var ale = "밤사이 곳곳 가끔 비가 내리니 안전 유의.<br>각종 피해 없도록 대비해주세요!";
newDIV4.innerHTML = ale;

