# OPAY 프로젝트 ERD (Entity Relationship Diagram)

## 도메인 모델

```
┌─────────────────┐
│     Users       │
├─────────────────┤
│ id (PK)         │
│ email           │
│ password        │
│ name            │
│ phone           │
│ created_at      │
│ updated_at      │
└────────┬────────┘
         │
         │ 1:N
         │
    ┌────┴────────────────────────────────────────────────────────────┐
    │                                                                  │
    │                                                                  │
┌───▼──────────────┐  ┌──────────────┐  ┌──────────────┐  ┌──────────┐
│ Shipping_address│  │    Wallet    │  │    Orders    │  │  Carts   │
│     es          │  ├──────────────┤  ├──────────────┤  ├──────────┤
├──────────────────┤  │ id (PK)      │  │ id (PK)      │  │ id (PK)  │
│ id (PK)          │  │ user_id (FK) │  │ user_id (FK) │  │ user_id  │
│ user_id (FK)     │  │ balance      │  │ total_amount │  │ (FK)     │
│ recipient        │  │ version      │  │ paid_amount  │  │ product_ │
│ phone            │  │ created_at   │  │ status       │  │ id (FK)  │
│ address          │  │ updated_at   │  │ created_at   │  │ quantity │
│ detail_address   │  └──────┬───────┘  │ updated_at   │  │ added_at │
│ postal_code      │         │          └──────┬───────┘  └──────────┘
│ is_default       │         │                 │
│ created_at       │         │                 │ 1:N
└──────────────────┘         │                 │
                             │                 │
┌─────────────────┐          │          ┌──────▼──────────┐
│    Products     │          │          │  Order_items   │
├─────────────────┤          │          ├────────────────┤
│ id (PK)         │          │          │ id (PK)        │
│ name            │          │          │ user_id (FK)   │
│ description     │          │          │ order_id (FK)  │
│ price           │          │          │ product_id(FK) │
│ stock           │          │          │ quantity       │
│ category        │          │          │ price          │
│ image_url       │          │          │ created_at     │
│ average_rating  │          │          └────────────────┘
│ review_count    │          │
│ created_at      │          │
│ updated_at      │          │
└────────┬────────┘          │
         │                   │
         │ 1:N               │
         │                   │
    ┌────┴──────────────┐   │
    │                   │   │
┌───▼──────────────┐  ┌─▼───▼──────────┐
│     Review       │  │  Transaction   │
├──────────────────┤  ├────────────────┤
│ id (PK)          │  │ id (PK)        │
│ user_id (FK)     │  │ wallet_id (FK) │
│ product_id (FK)  │  │ user_id (FK)   │
│ rating           │  │ payment_id(FK) │
│ content          │  │ order_id       │
│ created_at       │  │ type           │
└──────────────────┘  │ amount         │
                      │ status         │
┌─────────────────┐   │ idempotency_  │
│ Recent_products │   │ key           │
├─────────────────┤   │ created_at    │
│ id (PK)         │   └───────────────┘
│ user_id (FK)    │
│ product_id (FK) │
│ viewed_at       │
└─────────────────┘
         │
         │
┌────────▼──────────────┐
│      Payments         │
├───────────────────────┤
│ id (PK)               │
│ order_id              │
│ amount                │
│ method                │
│ status                │
│ idempotency_key       │
│ approved_at           │
│ created_at            │
└───────────────────────┘
```

## 테이블 상세 정의

### 1. Users (회원)
**설명**: 사용자 기본 정보를 저장하는 테이블

| 컬럼명 | 타입 | 제약조건 | 설명 |
|--------|------|----------|------|
| id | BIGINT | PK | 사용자 고유 ID |
| email | VARCHAR(100) | UNIQUE, NOT NULL | 이메일 (로그인 ID) |
| password | VARCHAR(255) | NOT NULL | 비밀번호 (해시) |
| name | VARCHAR(50) | NOT NULL | 이름 |
| phone | VARCHAR(20) | | 전화번호 |
| created_at | DATETIME | NOT NULL | 생성 시각 |
| updated_at | DATETIME | | 수정 시각 |

**관계**:
- 1:N Shipping_addresses
- 1:1 Wallet
- 1:N Orders
- 1:N Carts
- 1:N Order_items
- 1:N Review
- 1:N Recent_products
- 1:N Transaction

---

### 2. Products (상품)
**설명**: 상품 정보를 저장하는 테이블

| 컬럼명 | 타입 | 제약조건 | 설명 |
|--------|------|----------|------|
| id | BIGINT | PK | 상품 고유 ID |
| name | VARCHAR(100) | NOT NULL | 상품명 |
| description | TEXT | | 상품 설명 |
| price | BIGINT | NOT NULL | 가격 |
| stock | INT | NOT NULL, DEFAULT 0 | 재고 수량 |
| category | VARCHAR(50) | | 카테고리 |
| image_url | VARCHAR(255) | | 상품 이미지 URL |
| average_rating | DOUBLE | DEFAULT 0 | 평균 평점 |
| review_count | INT | DEFAULT 0 | 리뷰 개수 |
| created_at | DATETIME | NOT NULL | 생성 시각 |
| updated_at | DATETIME | | 수정 시각 |

**관계**:
- 1:N Order_items
- 1:N Review
- 1:N Recent_products
- 1:N Carts

---

### 3. Shipping_addresses (배송지)
**설명**: 사용자의 배송지 정보를 저장하는 테이블

| 컬럼명 | 타입 | 제약조건 | 설명 |
|--------|------|----------|------|
| id | BIGINT | PK | 배송지 고유 ID |
| user_id | BIGINT | FK → Users.id | 사용자 ID |
| recipient | VARCHAR(50) | NOT NULL | 수령인 이름 |
| phone | VARCHAR(20) | NOT NULL | 수령인 전화번호 |
| address | VARCHAR(255) | NOT NULL | 기본 주소 |
| detail_address | VARCHAR(255) | | 상세 주소 |
| postal_code | VARCHAR(20) | | 우편번호 |
| is_default | BOOLEAN | DEFAULT FALSE | 기본 배송지 여부 |
| created_at | DATETIME | NOT NULL | 생성 시각 |

**관계**:
- N:1 Users

**제약사항**:
- 사용자당 하나의 기본 배송지만 존재 가능

---

### 4. Wallet (지갑)
**설명**: 사용자의 O포인트 및 O머니 잔액을 관리하는 테이블

| 컬럼명 | 타입 | 제약조건 | 설명 |
|--------|------|----------|------|
| id | BIGINT | PK | 지갑 고유 ID |
| user_id | BIGINT | FK → Users.id, UNIQUE | 사용자 ID |
| balance | BIGINT | NOT NULL, DEFAULT 0 | 잔액 (포인트 + 머니) |
| version | INT | NOT NULL, DEFAULT 0 | 낙관적 잠금 버전 |
| created_at | DATETIME | NOT NULL | 생성 시각 |
| updated_at | DATETIME | | 수정 시각 |

**관계**:
- 1:1 Users
- 1:N Transaction

**제약사항**:
- 사용자당 하나의 지갑만 존재
- version 필드로 동시성 제어 (Optimistic Locking)

---

### 5. Orders (주문)
**설명**: 주문 정보를 저장하는 테이블

| 컬럼명 | 타입 | 제약조건 | 설명 |
|--------|------|----------|------|
| id | BIGINT | PK | 주문 고유 ID |
| user_id | BIGINT | FK → Users.id | 사용자 ID |
| total_amount | BIGINT | NOT NULL | 주문 총 금액 |
| paid_amount | BIGINT | NOT NULL, DEFAULT 0 | 결제 완료 금액 |
| status | VARCHAR(30) | NOT NULL | 주문 상태 |
| created_at | DATETIME | NOT NULL | 생성 시각 |
| updated_at | DATETIME | | 수정 시각 |

**관계**:
- N:1 Users
- 1:N Order_items
- 1:1 Payments
- 1:N Transaction

**주문 상태 값**:
- `PENDING`: 주문 대기
- `CONFIRMED`: 주문 확정
- `PREPARING`: 준비 중
- `SHIPPED`: 배송 중
- `DELIVERED`: 배송 완료
- `CANCELLED`: 취소됨

---

### 6. Order_items (주문 상품 상세)
**설명**: 주문에 포함된 상품 상세 정보를 저장하는 테이블

| 컬럼명 | 타입 | 제약조건 | 설명 |
|--------|------|----------|------|
| id | BIGINT | PK | 주문 상품 고유 ID |
| user_id | BIGINT | FK → Users.id | 사용자 ID |
| order_id | BIGINT | FK → Orders.id | 주문 ID |
| product_id | BIGINT | FK → Products.id | 상품 ID |
| quantity | INT | NOT NULL | 주문 수량 |
| price | BIGINT | NOT NULL | 주문 시점 가격 (스냅샷) |
| created_at | DATETIME | NOT NULL | 생성 시각 |

**관계**:
- N:1 Users
- N:1 Orders
- N:1 Products

**제약사항**:
- price는 주문 시점의 상품 가격을 저장 (가격 변경 대비)

---

### 7. Payments (결제)
**설명**: 결제 정보를 저장하는 테이블

| 컬럼명 | 타입 | 제약조건 | 설명 |
|--------|------|----------|------|
| id | BIGINT | PK | 결제 고유 ID |
| order_id | BIGINT | FK → Orders.id | 주문 ID |
| amount | BIGINT | NOT NULL | 결제 금액 |
| method | VARCHAR(30) | NOT NULL | 결제 수단 |
| status | VARCHAR(30) | NOT NULL | 결제 상태 |
| idempotency_key | VARCHAR(100) | UNIQUE | 중복 방지 키 |
| approved_at | DATETIME | | 결제 승인 시각 |
| created_at | DATETIME | NOT NULL | 생성 시각 |

**관계**:
- N:1 Orders
- 1:N Transaction

**결제 수단 값**:
- `CARD`: 카드 결제
- `BANK_TRANSFER`: 계좌이체
- `VIRTUAL_ACCOUNT`: 가상계좌
- `TOSS`: 토스페이
- `KAKAO`: 카카오페이
- `NAVER`: 네이버페이

**결제 상태 값**:
- `PENDING`: 대기 중
- `PROCESSING`: 처리 중
- `SUCCESS`: 성공
- `FAIL`: 실패
- `UNKNOWN`: 미확정

**제약사항**:
- idempotency_key로 중복 결제 방지

---

### 8. Transaction (트랜잭션)
**설명**: 지갑 거래 내역을 저장하는 테이블

| 컬럼명 | 타입 | 제약조건 | 설명 |
|--------|------|----------|------|
| id | BIGINT | PK | 거래 고유 ID |
| wallet_id | BIGINT | FK → Wallet.id | 지갑 ID |
| user_id | BIGINT | FK → Users.id | 사용자 ID |
| payment_id | BIGINT | FK → Payments.id | 결제 ID |
| order_id | BIGINT | FK → Orders.id | 주문 ID |
| type | VARCHAR(20) | NOT NULL | 거래 유형 |
| amount | BIGINT | NOT NULL | 거래 금액 |
| status | VARCHAR(20) | NOT NULL | 거래 상태 |
| idempotency_key | VARCHAR(100) | UNIQUE | 중복 방지 키 |
| created_at | DATETIME | NOT NULL | 생성 시각 |

**관계**:
- N:1 Wallet
- N:1 Users
- N:1 Payments
- N:1 Orders

**거래 유형 값**:
- `CHARGE`: 충전
- `PAYMENT`: 결제
- `REFUND`: 환불
- `POINT_EARNED`: 포인트 적립
- `POINT_USED`: 포인트 사용

**거래 상태 값**:
- `PENDING`: 대기 중
- `COMPLETED`: 완료
- `FAILED`: 실패
- `CANCELLED`: 취소됨

---

### 9. Review (리뷰)
**설명**: 상품 리뷰를 저장하는 테이블

| 컬럼명 | 타입 | 제약조건 | 설명 |
|--------|------|----------|------|
| id | BIGINT | PK | 리뷰 고유 ID |
| user_id | BIGINT | FK → Users.id | 사용자 ID |
| product_id | BIGINT | FK → Products.id | 상품 ID |
| rating | INT | NOT NULL | 평점 (1-5) |
| content | TEXT | | 리뷰 내용 |
| created_at | DATETIME | NOT NULL | 생성 시각 |

**관계**:
- N:1 Users
- N:1 Products

**제약사항**:
- rating은 1-5 사이의 값
- 상품당 사용자당 하나의 리뷰만 작성 가능 (UNIQUE 제약 필요)

---

### 10. Recent_products (최근 본 상품)
**설명**: 사용자가 최근 조회한 상품을 저장하는 테이블

| 컬럼명 | 타입 | 제약조건 | 설명 |
|--------|------|----------|------|
| id | BIGINT | PK | 최근 본 상품 고유 ID |
| user_id | BIGINT | FK → Users.id | 사용자 ID |
| product_id | BIGINT | FK → Products.id | 상품 ID |
| viewed_at | DATETIME | NOT NULL | 조회 시각 |

**관계**:
- N:1 Users
- N:1 Products

**제약사항**:
- 사용자당 최대 N개 유지 (중복 시 최신순)
- 동일 상품 재조회 시 viewed_at 업데이트

---

### 11. Carts (장바구니)
**설명**: 사용자의 장바구니 정보를 저장하는 테이블

| 컬럼명 | 타입 | 제약조건 | 설명 |
|--------|------|----------|------|
| id | BIGINT | PK | 장바구니 항목 고유 ID |
| user_id | BIGINT | FK → Users.id | 사용자 ID |
| product_id | BIGINT | FK → Products.id | 상품 ID |
| quantity | INT | NOT NULL, DEFAULT 1 | 수량 |
| added_at | DATETIME | NOT NULL | 담은 시각 |

**관계**:
- N:1 Users
- N:1 Products

**제약사항**:
- 사용자-상품 조합은 UNIQUE (동일 상품 재추가 시 quantity 증가)
- 로그인 전에는 LocalStorage 사용, 로그인 후 서버와 병합

---

## 주요 제약사항 및 비즈니스 규칙

### 1. 결제 중복 방지
- `Payments.idempotency_key`와 `Transaction.idempotency_key`로 동일 결제 요청 방지
- UNIQUE 제약으로 중복 키 방지

### 2. 가격 무결성
- `Order_items.price`에 주문 시점 가격 저장
- `Products.price` 변경 시에도 주문 가격 유지

### 3. 재고 관리
- `Products.stock`으로 재고 관리
- 주문 시 재고 차감, 취소 시 재고 복구

### 4. 배송지 기본값
- `Shipping_addresses.is_default`로 기본 배송지 관리
- 사용자당 하나의 기본 배송지만 존재 (트리거 또는 애플리케이션 로직으로 보장)

### 5. 지갑 동시성 제어
- `Wallet.version`으로 낙관적 잠금 (Optimistic Locking)
- 동시 거래 시 버전 충돌 감지 및 재시도

### 6. 최근 본 상품 관리
- 사용자당 최대 N개 유지
- 동일 상품 재조회 시 `viewed_at` 업데이트 또는 삭제 후 재생성

### 7. 장바구니 병합
- 로그인 전: LocalStorage 사용
- 로그인 후: 서버 장바구니와 병합 (서버 우선)

---

## 인덱스 권장사항

### 성능 최적화를 위한 인덱스

1. **Users**
   - `email` (UNIQUE INDEX)

2. **Orders**
   - `user_id` (INDEX)
   - `status` (INDEX)
   - `created_at` (INDEX)

3. **Payments**
   - `order_id` (INDEX)
   - `idempotency_key` (UNIQUE INDEX)
   - `status` (INDEX)

4. **Products**
   - `category` (INDEX)
   - `price` (INDEX)
   - `average_rating` (INDEX)

5. **Review**
   - `product_id` (INDEX)
   - `user_id` (INDEX)
   - `(user_id, product_id)` (UNIQUE INDEX)

6. **Carts**
   - `user_id` (INDEX)
   - `(user_id, product_id)` (UNIQUE INDEX)

7. **Recent_products**
   - `user_id` (INDEX)
   - `viewed_at` (INDEX)

8. **Transaction**
   - `wallet_id` (INDEX)
   - `user_id` (INDEX)
   - `payment_id` (INDEX)
   - `idempotency_key` (UNIQUE INDEX)
