# crypto

암복호화 예제를 정리한 학습용 웹 프로젝트입니다. 현재 소스에는 Express·EJS 기반 AES256 예제 화면이 있습니다.

## 예제와 코드

- [AES 라우트](src/routes/aes.js): 예제 화면 경로
- [AES256 화면](src/views/aes256.ejs): 화면과 예제 코드
- [서버 진입점](src/server.js): Express 설정과 라우트 연결
- [package.json](package.json): 패키지와 개발 실행 명령

## 개발 실행

```sh
npm install
npm run dev
```

`npm run dev`는 nodemon을 통해 `src/server.js`를 실행합니다. 예제 화면 경로는 `/aes/aes256`이며, 포트 설정은 서버 진입점에서 확인합니다.

## 기존 소개

암복호화 모음
