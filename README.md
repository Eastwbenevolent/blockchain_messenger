# Blockchain Messenger Backend

이 프로젝트는 Matrix 네트워크를 통해 Verifiable Credential(VC)을 주고받으며 검증하는
메신저 백엔드의 참고 구현입니다. Veramo 에이전트를 이용해 DID와 키를 관리하고, VC를
검증하여 메시지로 응답하거나 다른 방으로 자동 입장하는 기능을 포함합니다.

## 주요 파일

| 파일 | 설명 |
| --- | --- |
| `didkit-server/agent.js` | Veramo 에이전트를 초기화하고 데이터베이스 및 키 관리를 담당합니다. 암호화 키는 환경변수로 주입해야 합니다. |
| `didkit-server/matrixBot.js` | Matrix 클라이언트에 접속하여 VC 메시지를 수신, 파싱, 검증한 뒤 결과를 회신하고 필요시 방에 입장하는 로직을 구현합니다. |
| `didkit-server/signMessage.js` | 지정된 DID와 키 ID로 임의의 메시지를 서명하는 유틸리티 스크립트입니다. |
| `.env.example` | 필수 환경변수의 예시를 제공합니다. 복사하여 `.env`로 사용하세요. |

## 실행 방법

1. 저장소 루트에 `.env` 파일을 만들고 `.env.example`을 참고하여 필수 값을 채워 넣습니다.
2. 의존성을 설치합니다.

```bash
npm install
```

3. Matrix 봇을 실행합니다.

```bash
npm start
```

봇은 Matrix 서버에 접속하여 `m.room.message` 이벤트를 감시하고, VC를 검증하여 결과를 해당 방에 회신합니다. VC에 `credentialSubject.room` 속성이 있으면 검증 성공 후 그 방에 자동으로 입장합니다.

## 메시지 서명하기

다음 명령을 실행하여 DID와 키 ID로 메시지를 서명할 수 있습니다.

```bash
npm run sign-message -- <did> <kid> "서명할 메시지"
```

`DB_ENCRYPTION_KEY` 환경변수가 설정되어 있어야 에이전트가 초기화되고 서명에 사용할 키를 불러올 수 있습니다.
