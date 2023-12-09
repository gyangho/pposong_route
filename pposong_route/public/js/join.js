const user = {
    id: "User",
    pw: "0000",
};

function handleJoininSubmit(event) {
    const inputId = document.querySelector('input[name="username"]');
    const inputPw = document.querySelector('input[name="password"]');
    
    user.id = inputId.value;
    user.pw = inputPw.value;
}

const joininForm = document.querySelector(".joinin-form");
joininForm.addEventListener("submit", handleJoininSubmit);

/* 아이디 중복 체크 */
/* 비밀번호 확인 및 일치 여부 */
/* 회원가입 정보를 서버로 데이터 전송하는 함수 */