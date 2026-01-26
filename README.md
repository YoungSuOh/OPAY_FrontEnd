# OPAY - 결제 시스템 프론트엔드

React + TypeScript 기반의 안전하고 직관적인 결제 시스템입니다.

## 주요 특징

- ✅ **단순하고 안전한 결제 플로우**: 사용자 실수를 방지하는 직관적인 UI
- ✅ **엄격한 플로우 제어**: 결제 과정에서 분기 없이 순차적으로 진행
- ✅ **중복 결제 방지**: Idempotency Key를 통한 안전한 결제 처리
- ✅ **상태 확인 메커니즘**: UNKNOWN 상태 처리 및 자동 폴링
- ✅ **하늘색 테마**: 깔끔하고 현대적인 디자인

## 기술 스택

- **React 18** - UI 라이브러리
- **TypeScript** - 타입 안정성
- **React Router** - 라우팅
- **Zustand** - 상태 관리
- **Vite** - 빌드 도구

## 프로젝트 구조

```
src/
├── components/          # 공통 컴포넌트
│   ├── Button.tsx
│   ├── LoadingSpinner.tsx
│   └── PageContainer.tsx
├── pages/              # 페이지 컴포넌트
│   ├── ProductPage.tsx              # 상품 선택
│   ├── OrderReviewPage.tsx          # 주문 확인
│   ├── PaymentProcessingPage.tsx    # 결제 처리 중
│   ├── PaymentStatusCheckPage.tsx   # 결제 상태 확인
│   ├── PaymentSuccessPage.tsx       # 결제 성공
│   ├── PaymentFailPage.tsx          # 결제 실패
│   └── OrderHistoryPage.tsx         # 주문 내역
├── store/              # 상태 관리
│   └── paymentStore.ts
├── types/              # TypeScript 타입 정의
│   └── index.ts
├── utils/              # 유틸리티 함수
│   ├── api.ts
│   └── blockNavigation.ts
├── App.tsx
├── main.tsx
└── index.css
```

## 결제 플로우

```
상품 선택
  ↓
주문 확인 (서버 금액 검증)
  ↓
결제 처리 중 (Idempotency Key 생성, PaymentId 발급)
  ↓
┌───────────────┐
│ 성공 │ 실패 │ 미확정 │
└───────────────┘
     ↓        ↓
  성공페이지  실패페이지
       ↓
   주문내역
```

## 설치 및 실행

### 1. 의존성 설치

```bash
npm install
```

### 2. 환경 변수 설정

`.env` 파일을 생성하고 API 베이스 URL을 설정하세요:

```env
VITE_API_BASE_URL=http://localhost:3000/api
```

### 3. 개발 서버 실행

```bash
npm run dev
```

### 4. 빌드

```bash
npm run build
```

## 주요 기능

### 1. 상품 선택 페이지
- 상품 목록 표시
- 수량 선택
- 예상 금액 표시 (참고용)
- **제약**: 결제 API 호출 금지

### 2. 주문 확인 페이지
- 서버에서 계산된 실제 결제 금액 표시
- 결제 수단 선택
- **핵심**: 결제 버튼 1회 클릭만 허용, 클릭 시 즉시 비활성화

### 3. 결제 처리 중 페이지
- 로딩 애니메이션
- 뒤로가기 제한
- 새로고침 경고
- 중복 요청 방지

### 4. 결제 상태 확인 페이지
- 자동 폴링 (3초 간격)
- 최대 20회 시도 (약 1분)
- UNKNOWN 상태 처리

### 5. 결제 성공/실패 페이지
- 결제 결과 상세 정보 표시
- 재시도 기능 (실패 시)

### 6. 주문 내역 페이지
- 서버에서 조회한 정보만 표시
- 프론트 캐시 사용 안 함

## API 엔드포인트

프로젝트는 다음 API 엔드포인트를 사용합니다:

- `POST /api/orders` - 주문 생성
- `POST /api/payments/request` - PaymentId 발급
- `POST /api/payments/approve` - 결제 승인
- `GET /api/payments/:paymentId/status` - 결제 상태 조회
- `GET /api/orders/:orderId` - 주문 내역 조회

## 보안 고려사항

1. **Idempotency Key**: 모든 결제 요청에 고유한 키 사용
2. **중복 요청 방지**: 결제 버튼 1회 클릭만 허용
3. **뒤로가기 제한**: 결제 처리 중 페이지에서 뒤로가기 방지
4. **서버 검증**: 모든 금액은 서버에서 계산된 값만 사용

## 라이선스

MIT
