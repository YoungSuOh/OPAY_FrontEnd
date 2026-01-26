# OPAY API 문서

## 기본 정보

- **Base URL**: `http://localhost:3000/api`
- **인증 방식**: Cookie-based (credentials: 'include')
- **Content-Type**: `application/json` (일부는 `multipart/form-data`)

---

## 1. 인증 (Authentication)

### 1.1 회원가입
```http
POST /auth/signup
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "password123",
  "name": "홍길동"
}
```

**Response:**
```json
{
  "user": {
    "id": "user_123",
    "email": "user@example.com",
    "name": "홍길동"
  },
  "token": "jwt_token_here"
}
```

### 1.2 로그인
```http
POST /auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "password123"
}
```

**Response:**
```json
{
  "user": {
    "id": "user_123",
    "email": "user@example.com",
    "name": "홍길동"
  },
  "token": "jwt_token_here"
}
```

### 1.3 로그아웃
```http
POST /auth/logout
```

**Response:**
```json
{
  "message": "로그아웃되었습니다."
}
```

### 1.4 현재 사용자 정보 조회
```http
GET /auth/me
```

**Response:**
```json
{
  "id": "user_123",
  "email": "user@example.com",
  "name": "홍길동",
  "point": 412,
  "money": 3114
}
```

---

## 2. 상품 (Products)

### 2.1 상품 목록 조회
```http
GET /products?page=1&limit=20&category=플랜&minPrice=0&maxPrice=10000&sortBy=ranking
```

**Query Parameters:**
- `page`: 페이지 번호 (기본값: 1)
- `limit`: 페이지당 항목 수 (기본값: 20)
- `category`: 카테고리 필터
- `minPrice`: 최소 가격
- `maxPrice`: 최대 가격
- `sortBy`: 정렬 기준 (ranking, price-low, price-high, reviews, rating)
- `search`: 검색어

**Response:**
```json
{
  "products": [
    {
      "id": "1",
      "name": "프리미엄 플랜",
      "description": "모든 기능을 사용할 수 있는 프리미엄 플랜입니다.",
      "price": 9900,
      "imageUrl": "https://...",
      "stock": 100,
      "category": "플랜",
      "averageRating": 5.0,
      "reviewCount": 7
    }
  ],
  "total": 50,
  "page": 1,
  "limit": 20
}
```

### 2.2 상품 상세 조회
```http
GET /products/:productId
```

**Response:**
```json
{
  "id": "1",
  "name": "프리미엄 플랜",
  "description": "모든 기능을 사용할 수 있는 프리미엄 플랜입니다.",
  "price": 9900,
  "imageUrl": "https://...",
  "stock": 100,
  "category": "플랜",
  "averageRating": 5.0,
  "reviewCount": 7
}
```

---

## 3. 장바구니 (Cart)

### 3.1 장바구니 조회
```http
GET /cart
```

**Response:**
```json
[
  {
    "product": {
      "id": "1",
      "name": "프리미엄 플랜",
      "price": 9900,
      "stock": 100
    },
    "quantity": 2,
    "addedAt": "2024-01-01T00:00:00Z"
  }
]
```

### 3.2 장바구니 동기화
```http
POST /cart/sync
Content-Type: application/json

{
  "items": [
    {
      "productId": "1",
      "quantity": 2
    }
  ]
}
```

**Response:**
```json
[
  {
    "product": {
      "id": "1",
      "name": "프리미엄 플랜",
      "price": 9900
    },
    "quantity": 2,
    "addedAt": "2024-01-01T00:00:00Z"
  }
]
```

### 3.3 장바구니 검증 (결제 전)
```http
GET /cart/validate
```

**Response:**
```json
{
  "isValid": true,
  "items": [
    {
      "product": {
        "id": "1",
        "name": "프리미엄 플랜",
        "price": 9900,
        "stock": 100
      },
      "quantity": 2
    }
  ],
  "totalAmount": 19800,
  "outOfStockItems": [],
  "priceChangedItems": []
}
```

---

## 4. 주문 (Orders)

### 4.1 주문 생성
```http
POST /orders
Content-Type: application/json

{
  "items": [
    {
      "productId": "1",
      "quantity": 2
    }
  ],
  "shippingAddressId": "addr_123"
}
```

**Response:**
```json
{
  "orderId": "ORDER-001",
  "items": [
    {
      "product": {
        "id": "1",
        "name": "프리미엄 플랜",
        "price": 9900
      },
      "quantity": 2
    }
  ],
  "totalAmount": 19800,
  "createdAt": "2024-01-01T00:00:00Z"
}
```

### 4.2 주문 목록 조회
```http
GET /orders?page=1&limit=10
```

**Response:**
```json
{
  "orders": [
    {
      "orderId": "ORDER-001",
      "items": [...],
      "totalAmount": 19800,
      "deliveryStatus": "PREPARING",
      "createdAt": "2024-01-01T00:00:00Z"
    }
  ],
  "hasMore": true
}
```

### 4.3 주문 상세 조회
```http
GET /orders/:orderId
```

**Response:**
```json
{
  "orderId": "ORDER-001",
  "items": [...],
  "totalAmount": 19800,
  "paymentMethod": "CARD",
  "paymentId": "PAY-001",
  "deliveryStatus": "PREPARING",
  "deliveryTimeline": [
    {
      "status": "PREPARING",
      "message": "주문 접수 완료",
      "timestamp": "2024-01-01T00:00:00Z"
    }
  ],
  "shippingAddress": "경기도 성남시...",
  "createdAt": "2024-01-01T00:00:00Z",
  "paymentResult": {
    "paymentId": "PAY-001",
    "status": "SUCCESS",
    "amount": 19800,
    "paymentMethod": "CARD",
    "paymentNo": "PAYNO-001",
    "approvedAt": "2024-01-01T00:00:00Z"
  }
}
```

---

## 5. 결제 (Payments)

### 5.1 PaymentId 발급
```http
POST /payments/request
Content-Type: application/json

{
  "orderId": "ORDER-001",
  "paymentMethod": "CARD",
  "idempotencyKey": "idemp_1234567890_abc123"
}
```

**Response:**
```json
{
  "paymentId": "PAY-001"
}
```

### 5.2 결제 승인
```http
POST /payments/approve
Content-Type: application/json

{
  "paymentId": "PAY-001",
  "idempotencyKey": "idemp_1234567890_abc123"
}
```

**Response:**
```json
{
  "paymentId": "PAY-001",
  "status": "SUCCESS",
  "amount": 19800,
  "paymentMethod": "CARD",
  "paymentNo": "PAYNO-001",
  "approvedAt": "2024-01-01T00:00:00Z"
}
```

### 5.3 결제 상태 조회
```http
GET /payments/:paymentId/status
```

**Response:**
```json
{
  "paymentId": "PAY-001",
  "status": "SUCCESS",
  "amount": 19800,
  "paymentMethod": "CARD",
  "paymentNo": "PAYNO-001",
  "approvedAt": "2024-01-01T00:00:00Z"
}
```

### 5.4 PG 결제 요청 (토스/카카오/네이버페이)
```http
POST /payments/pg/:provider
Content-Type: application/json

{
  "paymentId": "PAY-001"
}
```

**Providers:** `TOSS`, `KAKAO`, `NAVER`

**Response:**
```json
{
  "redirectUrl": "https://pg-provider.com/payment/..."
}
```

---

## 6. 배송지 (Shipping Addresses)

### 6.1 배송지 목록 조회
```http
GET /shipping-addresses
```

**Response:**
```json
[
  {
    "id": "addr_123",
    "name": "집",
    "recipient": "홍길동",
    "phone": "010-1234-5678",
    "address": "경기도 성남시 분당구...",
    "detailAddress": "3층",
    "postalCode": "13558",
    "isDefault": true,
    "createdAt": "2024-01-01T00:00:00Z"
  }
]
```

### 6.2 배송지 추가
```http
POST /shipping-addresses
Content-Type: application/json

{
  "name": "회사",
  "recipient": "홍길동",
  "phone": "010-1234-5678",
  "address": "서울시 강남구...",
  "detailAddress": "10층",
  "postalCode": "06142",
  "isDefault": false
}
```

**Response:**
```json
{
  "id": "addr_124",
  "name": "회사",
  ...
}
```

### 6.3 배송지 수정
```http
PUT /shipping-addresses/:addressId
Content-Type: application/json

{
  "name": "회사",
  "recipient": "홍길동",
  ...
}
```

### 6.4 배송지 삭제
```http
DELETE /shipping-addresses/:addressId
```

### 6.5 기본 배송지 설정
```http
PATCH /shipping-addresses/:addressId/set-default
```

---

## 7. 리뷰 (Reviews)

### 7.1 상품 리뷰 목록 조회
```http
GET /products/:productId/reviews?page=1&limit=10
```

**Response:**
```json
{
  "reviews": [
    {
      "id": "review_123",
      "productId": "1",
      "userId": "user_123",
      "userName": "홍길동",
      "rating": 5,
      "content": "정말 좋은 상품입니다!",
      "images": ["https://..."],
      "createdAt": "2024-01-01T00:00:00Z",
      "isMine": false
    }
  ],
  "hasMore": true
}
```

### 7.2 리뷰 작성
```http
POST /products/:productId/reviews
Content-Type: multipart/form-data

{
  "rating": 5,
  "content": "정말 좋은 상품입니다!",
  "images": [File, File, ...]
}
```

**Response:**
```json
{
  "id": "review_123",
  "productId": "1",
  "userId": "user_123",
  "userName": "홍길동",
  "rating": 5,
  "content": "정말 좋은 상품입니다!",
  "images": ["https://..."],
  "createdAt": "2024-01-01T00:00:00Z"
}
```

### 7.3 리뷰 수정
```http
PUT /reviews/:reviewId
Content-Type: multipart/form-data

{
  "rating": 4,
  "content": "수정된 리뷰 내용",
  "images": [File, ...]
}
```

### 7.4 리뷰 삭제
```http
DELETE /reviews/:reviewId
```

---

## 8. 최근 본 상품 (Recent Products)

### 8.1 최근 본 상품 조회
```http
GET /recent-products
```

**Response:**
```json
[
  {
    "id": "1",
    "name": "프리미엄 플랜",
    "price": 9900,
    "imageUrl": "https://...",
    "viewedAt": "2024-01-01T00:00:00Z"
  }
]
```

### 8.2 최근 본 상품 동기화
```http
POST /recent-products/sync
Content-Type: application/json

{
  "productIds": ["1", "2", "3"]
}
```

---

## 에러 응답 형식

```json
{
  "error": {
    "code": "ERROR_CODE",
    "message": "에러 메시지",
    "details": {}
  }
}
```

### 주요 에러 코드

- `UNAUTHORIZED`: 인증 필요
- `FORBIDDEN`: 권한 없음
- `NOT_FOUND`: 리소스 없음
- `BAD_REQUEST`: 잘못된 요청
- `VALIDATION_ERROR`: 검증 실패
- `PAYMENT_FAILED`: 결제 실패
- `OUT_OF_STOCK`: 재고 부족
- `PRICE_CHANGED`: 가격 변경됨
- `DUPLICATE_PAYMENT`: 중복 결제 시도

---

## 인증이 필요한 API

다음 API는 로그인 상태가 필요합니다:
- `/cart/*` (장바구니)
- `/orders/*` (주문)
- `/payments/*` (결제)
- `/shipping-addresses/*` (배송지)
- `/recent-products/*` (최근 본 상품)
- `/reviews/*` (리뷰 작성/수정/삭제)

인증이 필요한 경우 `401 Unauthorized` 응답을 반환합니다.
