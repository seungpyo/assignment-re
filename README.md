# Before you start

```bash
yarn && cd server && yarn && yarn add -D nodemon && cd ../client && yarn && cd ..
```

# How to run server

```bash
yarn start
```

# Disclaimer

동일 LAN 내의 서버와 클라이언트만 통신 가능합니다.

# How to test

1. IP 주소 및 branch 설정

- 최신 코드가 존재하는 branch (`exitroom`)로 이동
  - `git checkout exitroom`
- `ifconfig`, `ipconfig` 등으로 LAN 주소 확인
- `client/src/constants.tsx`에서 `host` 변수에 IPv4 주소 입력
- `server/src/index.ts`에서 `const useHttps = true`로 설정

2. 서버 시작

```bash
yarn start
```

3. 클라이언트 시작 1.에서 확인한 IP 주소가 192.168.0.123이라면, 웹 브라우저에서 아래 주소 입력
   `https://192.168.0.123`

4. 최초에는 계정이 없는 상황이므로, 회원가입을 진행

- 이름, 비밀번호, 이메일주소를 입력 후, Sign Up 버튼 클릭

5. 로그인

- 이름, 비밀번호를 입력 후, Sign In 버튼 클릭

6. 채널 선택

- 좌측 Panel에 있는 채널 중 하나를 클릭하여 선택
  - 최초에는 아무 채널도 선택되지 않은 상태이므로, 정상 작동하지 않을 수 있습니다.
- 채널을 새로 생성할 경우, "Create Channel" 버튼 클릭 후, 채널 이름 입력 후, "Create" 버튼 클릭
- 기존 채널에 입장할 경우, UUID v4 형식으로 기재된 채널 ID를 입력 후, "Join" 버튼 클릭

7. 메시지 전송

- 채널 선택 후, 하단 메시지 입력 창에 메시지 입력 후, 우측 "Send" 버튼 클릭
