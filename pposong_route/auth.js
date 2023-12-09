var express = require('express');
var router = express.Router();
var path = require('path');
var template = require('./template.js');
var db = require('./db');


// 로그인 화면
router.get('/login', function (request, response) {
    response.sendFile(path.join(__dirname, '/views/index.html'));
});

// 로그인 프로세스
router.post('/login_process', function (request, response) {
    var username = request.body.username;
    var password = request.body.pwd;
    if (username && password) {             // id와 pw가 입력되었는지 확인

        db.query('SELECT * FROM usertable WHERE username = ? AND password = ?', [username, password], function (error, results, fields) {
            if (error) throw error;
            if (results.length > 0) {       // db에서의 반환값이 있으면 로그인 성공
                request.session.is_logined = true;      // 세션 정보 갱신
                request.session.nickname = username;
                request.session.save(function () {
                    response.redirect(`/`);
                });
            } else {
                response.send(`<script type="text/javascript">alert("로그인 정보가 일치하지 않습니다."); 
                document.location.href="/auth/login";</script>`);
            }
        });

    } else {
        response.send(`<script type="text/javascript">alert("아이디와 비밀번호를 입력하세요!"); 
        document.location.href="/auth/login";</script>`);
    }
});

// 로그아웃
router.get('/logout', function (request, response) {
    request.session.destroy(function (err) {
        response.redirect('/');
    });
});


// 회원가입 화면
router.get('/register', function (request, response) {
    response.sendFile(path.join(__dirname, '/views/join.html'));
});

// 회원가입 프로세스
router.post('/register_process', function (request, response) {
    var username = request.body.username;
    var password = request.body.pwd;
    var password2 = request.body.pwd2;

    if (username && password && password2) {

        db.query('SELECT * FROM usertable WHERE username = ?', [username], function (error, results, fields) { // DB에 같은 이름의 회원아이디가 있는지 확인
            if (error) throw error;
            if (results.length <= 0 && password == password2) {     // DB에 같은 이름의 회원아이디가 없고, 비밀번호가 올바르게 입력된 경우 
                db.query('INSERT INTO usertable (username, password) VALUES(?,?)', [username, password], function (error, data) {
                    if (error) throw error2;
                    response.sendFile(path.join(__dirname, '/views/welcome.html'));
                });
            } else if (password != password2) {                     // 비밀번호가 올바르게 입력되지 않은 경우
                response.send(`<script type="text/javascript">alert("입력된 비밀번호가 서로 다릅니다."); 
                document.location.href="/auth/register";</script>`);
            }
            else {                                                  // DB에 같은 이름의 회원아이디가 있는 경우
                response.send(`<script type="text/javascript">alert("이미 존재하는 아이디 입니다."); 
                document.location.href="/auth/register";</script>`);
            }
        });

    } else {        // 입력되지 않은 정보가 있는 경우
        response.send(`<script type="text/javascript">alert("입력되지 않은 정보가 있습니다."); 
        document.location.href="/auth/register";</script>`);
    }
});

//비밀번호 찾기
router.get('/inquiry', function (request, response) {
    var title = '비밀번호 찾기';
    var html = template.HTML(title, `
    <h2>비밀번호 찾기</h2>
    <form action="/auth/inquiry_process" method="post">
    <p><input class="login" type="text" name="username" placeholder="아이디"></p>
    <p><input class="btn" type="submit" value="제출"></p>
    </form>            
    <p><a href="/auth/login">로그인화면으로 돌아가기</a></p>
    `, '');
    response.send(html);
});

// 비밀번호 찾기 프로세스
router.post('/inquiry_process', function (request, response) {
    var username = request.body.username;
    var password = request.body.pwd;

    if (username) {

        db.query('SELECT password FROM usertable WHERE username = ?', [username], function (error, results, fields) { // DB에 같은 이름의 회원아이디가 있는지 확인
            if (error) throw error;
            if (results.length > 0) {     // DB에 같은 이름의 회원아이디가 , 비밀번호가 올바르게 입력된 경우 
                const password = results[0].password;
                response.send(`<script type="text/javascript">alert("비밀번호 : ${password}"); 
                document.location.href="/auth/login";</script>`);
            }
            else {                                                  // DB에 같은 이름의 회원아이디가 있는 경우
                response.send(`<script type="text/javascript">alert("존재하지 않는 아이디 입니다."); 
                document.location.href="/auth/inquiry";</script>`);
            }
        });
    } else {        // 입력되지 않은 정보가 있는 경우
        response.send(`<script type="text/javascript">alert("입력되지 않은 정보가 있습니다."); 
        document.location.href="/auth/inquiry";</script>`);
    }
});

//계정삭제 화면
router.get('/delete', function (request, response) {
    var title = '계정 탈퇴';
    var html = template.HTML(title, `
    <h2>계정 탈퇴</h2>
    <form action="/auth/delete_process" method="post">
    <p><input type="text" name="username" placeholder="ID"></p>
    <p><input type="password" name="pwd" placeholder="Password"></p>
    <p><input class="btn" type="submit" value="탈퇴하기"></p>
    </form>            
    <p><a href="/main/mypage">마이페이지로</a></p>
    `, '');
    response.send(html);
});

//계정삭제 프로세스
router.post('/delete_process', function (request, response) {
    var username = request.body.username;
    var password = request.body.pwd;
    if (username && password) {             // id와 pw가 입력되었는지 확인
        db.query('SELECT * FROM usertable WHERE username = ? AND password = ?', [username, password], function (error, results, fields) {
            if (error) throw error;
            if (results.length > 0) {       // db에서의 반환값이 있으면 성공
                db.query('DELETE FROM usertable WHERE username = ? AND password = ?', [username, password], function (error, results, fields) {
                    if (error) throw error;
                });
                response.send(`<script type="text/javascript">alert("탈퇴가 완료되었습니다."); 
                document.location.href="/auth/logout";</script>`);
            }
            else {
                response.send(`<script type="text/javascript">alert("로그인 정보가 일치하지 않습니다."); 
                document.location.href="/auth/delete";</script>`);
            }
        });

    } else {
        response.send(`<script type="text/javascript">alert("아이디와 비밀번호를 입력하세요!"); 
        document.location.href="/auth/delete";</script>`);
    }
});

//비밀번호 변경 화면
router.get('/alter', function (request, response) {
    var title = '비밀번호 변경';
    var html = template.HTML(title, `
    <h2>비밀번호 변경</h2>
    <form action="/auth/alter_process" method="post">
    <p><input type="password" name="pwd" placeholder="New Password"></p>
    <p><input type="password" name="pwd2" placeholder="Confirm New Password"></p>
    <p><input class="btn" type="submit" value="변경하기"></p>
    </form>            
    <p><a href="/main/mypage">마이페이지로</a></p>
    `, '');
    response.send(html);
});

//비밀번호 변경 프로세스
router.post('/alter_process', function (request, response) {
    var password = request.body.pwd;
    var password2 = request.body.pwd2;
    const loggedInUsername = request.session.is_logined ? request.session.nickname : 'Guest';

    if (password && password2) {
        db.query('SELECT * FROM usertable WHERE username = ?', [loggedInUsername], function (error, results, fields) { // DB에 같은 이름의 회원아이디가 있는지 확인
            if (error) throw error;
            if (password == password2) {
                db.query('UPDATE usertable SET password = ? WHERE username = ?', [password, loggedInUsername], function (error, data) {
                    if (error) throw error2;
                    response.send(`<script type="text/javascript">alert("비밀번호 변경이 완료되었습니다."); 
                    document.location.href="/main/mypage";</script>`);
                });
            }
            else if (results.length < 1) {
                response.send(`<script type="text/javascript">alert("유효하지 않은 계정입니다."); 
                document.location.href="/auth/logout";</script>`);
            }
            else {                     // 비밀번호가 올바르게 입력되지 않은 경우
                response.send(`<script type="text/javascript">alert("입력된 비밀번호가 서로 다릅니다."); 
                document.location.href="/auth/alter";</script>`);
            }
        });

    } else {        // 입력되지 않은 정보가 있는 경우
        response.send(`<script type="text/javascript">alert("입력되지 않은 정보가 있습니다."); 
        document.location.href="/auth/alter";</script>`);
    }
});



module.exports = router;