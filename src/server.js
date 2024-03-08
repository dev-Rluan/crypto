const express = require('express');
const app = express();
const port = 3000;
var path = require('path');
var logger = require('morgan');
var cookieParser = require('cookie-parser');      
var bodyParser = require('body-parser');
var flash = require('connect-flash');
const crypto = require('crypto');
console.log("ttt");

app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');    // view 엔진으로ejs를 사용하겟다는 뜻

app.use(logger('dev'));
// app.use(express.json());
// app.use(express.urlencoded({ extended: false })); 
// 세션 사용을 위한 쿠키설정
app.use(cookieParser('session_cookie_secret'));
app.use(express.static(path.join(__dirname, 'public')));

// post형식의 데이터를 읽기 위한 bodyparser 사용
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended:true}));


  // 라우터 모듈 생성
// var indexRouter = require('./routes/index');
var aesRouter = require('./routes/aes');

// 라우터 모듈 적용
// app.use('/', indexRouter);

app.use('/aes', aesRouter);
app.get('/', (req, res) => {
  res.send('Hello World!')
})


app.listen(port, () => {
  console.log(`Example app listening on port ${port}`)
})

