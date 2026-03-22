# OPay Frontend

> **React + TypeScript** 기반 이커머스·결제 웹 클라이언트  
> 백엔드와 맞춘 **멱등 키·2단계 결제·상태 폴링**으로 **이중 결제·애매한 상태**를 줄이는 UX에 초점을 둔 프로젝트입니다.

---

## 한 줄 요약

사용자 실수·네트워크 지연·재시도를 전제로, **결제 버튼 1회성**, **Idempotency Key**, **처리 중 네비게이션 제한**, **서버 금액만 신뢰**하는 흐름을 구현했습니다.

---

## 왜 이 프로젝트인가?

### 프론트엔드에서 결제가 어려운 이유

| 이슈 | 대응 방향 |
|------|-----------|
| 더블 클릭·재전송 | **멱등 키** + 버튼 즉시 비활성화 |
| 승인 응답 유실 | **paymentId** 기준 **상태 폴링** |
| 클라이언트 금액 조작 | **표시 금액은 참고**, 실제 결제는 **서버 주문 금액**만 |
| 결제 중 뒤로가기 | **라우트 가드**·처리 중 화면에서 이탈 제한 |

### 백엔드와의 역할 분담

- **백엔드**: `idempotency_key` **UNIQUE**, 금액 검증, 지갑·거래·주문 트랜잭션  
- **프론트**: 각 결제 시도마다 **고유 키 생성**, `request` → `approve` 순서, **폴링으로 최종 상태 확정**

---

## 기술 스택

| 구분 | 사용 |
|------|------|
| UI | React 18 |
| 언어 | TypeScript |
| 빌드 | Vite 5 |
| 라우팅 | React Router 6 |
| 상태 | Zustand (인증, 장바구니, 결제 등) |
| HTTP | `fetch` 기반 (`src/utils/api.ts`) |

---

## 주요 기능 영역

| 영역 | 설명 |
|------|------|
| **쇼핑** | 홈, 상품 목록·상세, 장바구니, 주문 확인 |
| **결제** | 결제 요청(`request`) → 승인(`approve`) → 성공/실패/상태 확인(폴링) |
| **계정** | JWT 기반 로그인·토큰 리프레시 (`api.ts` 내 401 처리) |
| **마이** | 주문 내역, 리뷰, 마이샵 등 |
| **관리자** | 관리자 레이아웃·대시보드·상품·주문·결제·회원·환불 등 (`pages/admin/`) |

---

## 결제 플로우 (요약)

```
상품·장바구니 → 주문 확인 (서버 금액)
    → 결제 처리 중 (Idempotency Key, PaymentId 발급)
    → 승인 요청
    → ┌ 성공 │ 실패 │ 미확정(폴링) ┐
    → 주문 내역 등
```

- **주문 확인**: 서버에서 계산된 금액을 기준으로 표시  
- **결제 처리 중**: 뒤로가기 제한·중복 요청 방지  
- **상태 확인**: 일정 간격 폴링으로 `UNKNOWN` 구간을 줄임  

---

## 프로젝트 구조 (요약)

```
src/
├── components/     # Header, Button, Modal, Toast, ErrorBoundary 등
├── pages/          # Home, Product, Cart, Order, Payment*, MyShop, Admin...
├── store/          # authStore, cartStore, paymentStore, recentProductsStore 등
├── utils/          # api.ts (API·토큰·멱등성과 연동), blockNavigation 등
├── types/
├── App.tsx
├── main.tsx
└── index.css
```

---

## 설치 및 실행

### 1. 의존성 설치

```bash
cd OPAY_FrontEnd
npm install
```

### 2. 환경 변수

API 베이스 URL은 **`VITE_API_BASE_URL`** 로 지정합니다.  
**미설정 시** `src/utils/api.ts` 기본값은 **`http://localhost:8080/api`** 입니다.

프로젝트 루트에 `.env` 또는 `.env.local`:

```env
VITE_API_BASE_URL=http://localhost:8080/api
```

> 백엔드는 기본 **8080** 포트, 경로 prefix **`/api`** 입니다. (Grafana 등 다른 서비스의 3000 포트와 혼동 주의)

### 3. 개발 서버

```bash
npm run dev
```

브라우저에서 Vite가 안내하는 주소(보통 `http://localhost:5173`)로 접속합니다.

### 4. 빌드·프리뷰

```bash
npm run build
npm run preview
```

### 5. Lint

```bash
npm run lint
```

---

## 백엔드와 함께 쓰기

1. [OPAY_BackEnd](../OPAY_BackEnd/README.md) 를 실행해 `http://localhost:8080/api` 가 응답하는지 확인  
2. 위 환경 변수를 맞춘 뒤 `npm run dev`  
3. 결제·주문 API는 `src/utils/api.ts` 를 통해 호출됩니다.

---

## API 연동 (예시)

백엔드와 맞춘 대표 엔드포인트:

- `POST /api/payments/request` — Payment 생성(멱등)
- `POST /api/payments/approve` — 결제 승인
- `GET /api/payments/:id/status` — 상태 조회(폴링)

전체 목록은 백엔드 컨트롤러 및 OpenAPI(있는 경우)를 기준으로 확인하는 것이 정확합니다.

---

## 보안·UX 고려사항

1. **Idempotency Key**: 결제 요청마다 고유 키를 사용해 백엔드 멱등성과 연동  
2. **중복 클릭 방지**: 결제 버튼 1회 클릭 후 즉시 비활성화  
3. **뒤로가기 제한**: 결제 처리 중 이탈으로 인한 중복·혼란 완화  
4. **금액**: 주문·결제 금액은 **서버 응답**을 신뢰  

---

## 개선 로드맵 (Roadmap)

- E2E 테스트(Playwright 등)로 결제 플로우 회귀 검증  
- 로딩·에러 UI 일관화 및 접근성(a11y)  
- OpenAPI 클라이언트 생성으로 타입·엔드포인트 동기화  

---

## Summary

> 백엔드의 **멱등성·상태 머신**을 프론트에서 **끊기지 않는 사용자 경험**으로 연결한  
> **결제 중심 이커머스 프론트엔드** 프로젝트입니다.

---

## Author

- GitHub: [@YoungSuOh](https://github.com/YoungSuOh)

---

## License

MIT
