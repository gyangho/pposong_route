/* 회원가입한 ID정보(username) 추출해서 화면에 출력 */
function getQueryParam(username) {
    const urlSearchParams = new URLSearchParams(window.location.search);
    return urlSearchParams.get(username);
}

window.addEventListener("DOMContentLoaded", function() {
    
    const username = getQueryParam("username");

    const usernameElement = document.getElementById("username");
    if (username) {
        usernameElement.innerText = username;
    } else {
        usernameElement.innerText = "User"; // Default
    }
});