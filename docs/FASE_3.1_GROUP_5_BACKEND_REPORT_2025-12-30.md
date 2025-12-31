# FASE 3.1 - Group 5 Backend Validation Report

**Date:** 2025-12-30
**Target:** Auth, Users, Alerts, Settings Controllers
**Status:** PARTIAL - Critical Security Issues Identified

---

## Executive Summary

| Controller | Status | Endpoints Tested | Issues |
|------------|--------|------------------|--------|
| AuthController | PARTIAL | 5/8 | 5 endpoints NOT IMPLEMENTED |
| UsersController | NOT EXIST | 0/6 | Controller not created |
| AlertsController | PARTIAL | 10/10 | 1 BUG (CreateAlertDto) |
| SettingsController | NOT EXIST | 0/6 | Controller not created |

**Overall Score:** 15/30 endpoints (50%)

---

## 1. AuthController Validation

### 1.1 Implemented Endpoints

| Endpoint | Method | Status | HTTP Code | Notes |
|----------|--------|--------|-----------|-------|
| `/api/v1/auth/register` | POST | PASS | 201/400/429 | Validation + Rate Limiting |
| `/api/v1/auth/login` | POST | PASS | 200/401 | JWT + bcrypt |
| `/api/v1/auth/me` | GET | PASS | 200/401 | Protected endpoint |
| `/api/v1/auth/google` | GET | PASS | 302 | OAuth2 initiator |
| `/api/v1/auth/google/callback` | GET | PASS | 302 | OAuth2 callback |

### 1.2 Missing Endpoints (NOT IMPLEMENTED)

| Endpoint | Method | Priority | Use Case |
|----------|--------|----------|----------|
| `/api/v1/auth/logout` | POST | HIGH | Token invalidation |
| `/api/v1/auth/refresh` | POST | HIGH | Token refresh before expiry |
| `/api/v1/auth/forgot-password` | POST | MEDIUM | Password recovery |
| `/api/v1/auth/reset-password` | POST | MEDIUM | Password reset with token |
| `/api/v1/auth/verify-email` | POST | LOW | Email verification |

### 1.3 Security Testing Results

#### 1.3.1 JWT Token Security - PASS

```json
// Token Structure (decoded)
{
  "sub": "6167e1ee-a077-4655-98fb-d6ffb40cfb8f",  // User UUID
  "email": "test@example.com",
  "iat": 1767136457,  // Issued at
  "exp": 1767741257   // Expires (7 days)
}
```

**Observations:**
- Algorithm: HS256 (secure)
- Token expiration: 7 days (configurable)
- Payload contains: `sub`, `email`, `iat`, `exp` (correct structure)

#### 1.3.2 Unauthorized Access - PASS

```bash
# Test: Access protected endpoint without token
curl -s http://localhost:3101/api/v1/auth/me

# Response: HTTP 401
{"statusCode":401,"error":"UnauthorizedException","message":"Unauthorized"}
```

#### 1.3.3 Invalid Token - PASS

```bash
# Test: Access with malformed token
curl -s http://localhost:3101/api/v1/auth/me -H "Authorization: Bearer invalid.token.here"

# Response: HTTP 401
{"statusCode":401,"error":"UnauthorizedException","message":"Unauthorized"}
```

#### 1.3.4 Password Security - PASS

```bash
# Test: Register with weak password (< 8 chars)
curl -s -X POST http://localhost:3101/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@test.com","password":"123456"}'

# Response: HTTP 400
{"statusCode":400,"message":"Senha deve ter no minimo 8 caracteres"}
```

**Database Verification (passwords hashed with bcrypt):**
```sql
SELECT email, substring(password from 1 for 30) FROM users;
-- Result: $2b$10$Wi4BGflxu8trbvxRfNLs6us... (bcrypt hash)
```

#### 1.3.5 Rate Limiting - PASS

```bash
# After 3 registration attempts:
{"statusCode":429,"message":"ThrottlerException: Too Many Requests"}
```

**Rate Limits Configured:**
- Register: 3 requests/hour
- Login: 5 requests/5 minutes

#### 1.3.6 Email Validation - PASS

```bash
# Test: Invalid email format
curl -s -X POST http://localhost:3101/api/v1/auth/register \
  -d '{"email":"invalid-email","password":"ValidPass123!"}'

# Response: HTTP 400
{"statusCode":400,"message":"Email invalido"}
```

### 1.4 Unit Tests - PASS (17/17)

```
AuthService
  register
    [PASS] should register a new user successfully
    [PASS] should hash the password before saving
    [PASS] should throw UnauthorizedException if user already exists
    [PASS] should return JWT token
  login
    [PASS] should login successfully with valid credentials
    [PASS] should throw UnauthorizedException if user not found
    [PASS] should throw UnauthorizedException if password is invalid
    [PASS] should update lastLogin on successful login
    [PASS] should not return password in user object
    [PASS] should throw if user has no password set
  googleLogin
    [PASS] should create new user for first Google login
    [PASS] should link Google account to existing user
    [PASS] should not update googleId if already set
    [PASS] should update lastLogin on Google login
  validateUser
    [PASS] should return user if found and active
    [PASS] should throw UnauthorizedException if user not found
    [PASS] should throw UnauthorizedException if user is inactive

Test Suites: 1 passed, 1 total
Tests:       17 passed, 17 total
```

---

## 2. UsersController Validation

### 2.1 Status: NOT IMPLEMENTED

**Expected Endpoints (from requirements):**

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/v1/users` | GET | List all users (admin) |
| `/api/v1/users/:id` | GET | Get user by ID |
| `/api/v1/users/:id` | PUT | Update user profile |
| `/api/v1/users/:id` | DELETE | Delete user |
| `/api/v1/users/:id/change-password` | POST | Change password |
| `/api/v1/users/:id/activity` | GET | Get user activity log |

### 2.2 User Entity Exists

**File:** `backend/src/database/entities/user.entity.ts`

```typescript
@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  email: string;

  @Column({ nullable: true })
  password: string;  // bcrypt hashed

  @Column({ name: 'google_id', nullable: true })
  googleId: string;

  @Column({ name: 'first_name', nullable: true })
  firstName: string;

  @Column({ name: 'last_name', nullable: true })
  lastName: string;

  @Column({ name: 'is_active', default: true })
  isActive: boolean;

  @Column({ type: 'jsonb', nullable: true })
  preferences: Record<string, any>;  // For settings

  @Column({ type: 'jsonb', nullable: true })
  notifications: Record<string, any>;  // For notification settings

  @OneToMany(() => Portfolio, (portfolio) => portfolio.user)
  portfolios: Portfolio[];
}
```

### 2.3 Recommendation: Create UsersController

Priority: **HIGH** - Required for user profile management.

---

## 3. AlertsController Validation

### 3.1 Implemented Endpoints

| Endpoint | Method | Status | Notes |
|----------|--------|--------|-------|
| `/api/v1/alerts` | GET | PASS | List user alerts |
| `/api/v1/alerts` | POST | **BUG** | Missing `name` field in DTO |
| `/api/v1/alerts/:id` | GET | PASS | Get alert by ID |
| `/api/v1/alerts/:id` | PUT | PASS | Update alert |
| `/api/v1/alerts/:id` | DELETE | PASS | Delete alert |
| `/api/v1/alerts/asset/:assetId` | GET | PASS | Get alerts by asset |
| `/api/v1/alerts/stats` | GET | PASS | Get alert statistics |
| `/api/v1/alerts/:id/pause` | PUT | PASS | Pause alert |
| `/api/v1/alerts/:id/resume` | PUT | PASS | Resume alert |
| `/api/v1/alerts/check/:assetId` | POST | PASS | Check price alerts |

### 3.2 BUG: CreateAlertDto Missing Required Field

**Severity:** HIGH
**Location:** `backend/src/modules/alerts/alerts.service.ts`

**Problem:**
The `CreateAlertDto` interface doesn't include the `name` field, but the database column is NOT NULL.

```typescript
// Current DTO (INCORRECT)
export interface CreateAlertDto {
  userId: string;
  assetId?: string;
  type: AlertType;
  targetValue: number;
  notificationChannels: NotificationChannel[];
  message?: string;
  // MISSING: name, description
}
```

**Error Returned:**
```json
{
  "error": "DatabaseError",
  "message": "null value in column \"name\" of relation \"alerts\" violates not-null constraint"
}
```

**Fix Required:**
```typescript
export interface CreateAlertDto {
  userId: string;
  assetId?: string;
  type: AlertType;
  targetValue: number;
  notificationChannels: NotificationChannel[];
  message?: string;
  name: string;           // ADD THIS
  description?: string;   // ADD THIS
}
```

### 3.3 Alert Entity Schema

```typescript
@Entity('alerts')
export class Alert {
  @Column({ type: 'varchar', length: 255 })
  name: string;  // NOT NULL - Required!

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ type: 'enum', enum: AlertType })
  type: AlertType;  // price_above, price_below, etc.

  @Column({ type: 'enum', enum: AlertStatus, default: 'active' })
  status: AlertStatus;

  @Column({ type: 'decimal', precision: 18, scale: 4 })
  targetValue: number;
}
```

### 3.4 Alert Types Supported

```typescript
enum AlertType {
  PRICE_ABOVE = 'price_above',
  PRICE_BELOW = 'price_below',
  PRICE_CHANGE_PERCENT = 'price_change_percent',
  VOLUME_ABOVE = 'volume_above',
  RSI_ABOVE = 'rsi_above',
  RSI_BELOW = 'rsi_below',
  INDICATOR_CHANGE = 'indicator_change',
}
```

### 3.5 Missing Test Trigger Endpoint

**Expected:** `POST /api/v1/alerts/:id/test`
**Status:** NOT IMPLEMENTED

---

## 4. SettingsController Validation

### 4.1 Status: NOT IMPLEMENTED

**Expected Endpoints (from requirements):**

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/v1/settings` | GET | Get user settings |
| `/api/v1/settings` | PUT | Update user settings |
| `/api/v1/settings/preferences` | GET | Get preferences |
| `/api/v1/settings/preferences` | PUT | Update preferences |
| `/api/v1/settings/notifications` | GET | Get notification settings |
| `/api/v1/settings/notifications` | PUT | Update notification settings |

### 4.2 Data Structure Available

The User entity already has JSONB columns for settings:

```typescript
// In User entity
@Column({ type: 'jsonb', nullable: true })
preferences: Record<string, any>;  // e.g., { timezone: "America/Sao_Paulo", theme: "dark" }

@Column({ type: 'jsonb', nullable: true })
notifications: Record<string, any>;  // e.g., { email: true, push: false, websocket: true }
```

### 4.3 Recommendation: Create SettingsController

Priority: **MEDIUM** - Required for user preferences.

---

## 5. TypeScript Validation

```bash
cd backend && npx tsc --noEmit
# Result: 0 errors
```

---

## 6. Database Schema Verification

### 6.1 Users Table

```sql
\d users

id                | uuid      | not null | uuid_generate_v4()
email             | varchar   | not null | UNIQUE
password          | varchar   | nullable | bcrypt hash
google_id         | varchar   | nullable |
first_name        | varchar   | nullable |
last_name         | varchar   | nullable |
is_active         | boolean   | not null | true
is_email_verified | boolean   | not null | false
preferences       | jsonb     | nullable |
notifications     | jsonb     | nullable |
created_at        | timestamp | not null |
updated_at        | timestamp | not null |
last_login        | timestamp | nullable |
```

### 6.2 Alerts Table

```sql
\d alerts

id                   | uuid         | not null | uuid_generate_v4()
user_id              | uuid         | not null | FK -> users
asset_id             | uuid         | nullable | FK -> assets
ticker               | varchar(20)  | nullable |
type                 | enum         | not null | alert_type_enum
status               | enum         | not null | 'active'
name                 | varchar(255) | not null | <-- REQUIRED!
description          | text         | nullable |
targetValue          | decimal(18,4)| not null |
currentValue         | decimal(18,4)| nullable |
notificationChannels | text         | not null | 'websocket'
message              | text         | nullable |
triggeredAt          | timestamp    | nullable |
last_checked_at      | timestamp    | nullable |
trigger_count        | integer      | not null | 0
expiresAt            | timestamp    | nullable |
isRecurring          | boolean      | not null | false
metadata             | jsonb        | nullable |
created_at           | timestamp    | not null |
updated_at           | timestamp    | not null |

Indexes:
  - IDX_alerts_user_status (user_id, status)
  - IDX_alerts_asset_status (asset_id, status)
  - IDX_alerts_status_type (status, type)
```

---

## 7. Issues Summary

### 7.1 Critical Issues

| ID | Component | Issue | Priority |
|----|-----------|-------|----------|
| G5-001 | AlertsController | CreateAlertDto missing `name` field | HIGH |
| G5-002 | Auth | Missing logout/refresh endpoints | HIGH |
| G5-003 | Users | Controller not implemented | HIGH |

### 7.2 Medium Priority

| ID | Component | Issue | Priority |
|----|-----------|-------|----------|
| G5-004 | Settings | Controller not implemented | MEDIUM |
| G5-005 | Auth | Missing password recovery | MEDIUM |
| G5-006 | Alerts | Missing test trigger endpoint | MEDIUM |

### 7.3 Low Priority

| ID | Component | Issue | Priority |
|----|-----------|-------|----------|
| G5-007 | Auth | Email verification not implemented | LOW |
| G5-008 | Users | Activity log endpoint missing | LOW |

---

## 8. Recommendations

### 8.1 Immediate Actions (Sprint)

1. **Fix AlertsController CreateAlertDto** - Add `name` and `description` fields
2. **Add Auth Logout Endpoint** - Token blacklist or JWT rotation
3. **Add Auth Refresh Endpoint** - Token refresh before expiry

### 8.2 Short-term (2 weeks)

1. **Create UsersController** with:
   - GET /users (admin only)
   - GET /users/:id
   - PUT /users/:id
   - DELETE /users/:id
   - POST /users/:id/change-password

2. **Create SettingsController** with:
   - GET/PUT /settings/preferences
   - GET/PUT /settings/notifications

### 8.3 Medium-term (1 month)

1. **Password Recovery Flow**
2. **Email Verification Flow**
3. **User Activity Audit Log**

---

## 9. Test Commands Reference

```bash
# Register new user
curl -X POST http://localhost:3101/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@test.com","password":"ValidPass123!","firstName":"Test","lastName":"User"}'

# Login
curl -X POST http://localhost:3101/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@test.com","password":"ValidPass123!"}'

# Get current user (protected)
curl -X GET http://localhost:3101/api/v1/auth/me \
  -H "Authorization: Bearer <token>"

# Get alerts
curl -X GET "http://localhost:3101/api/v1/alerts?userId=<uuid>" \
  -H "Authorization: Bearer <token>"

# Get alert stats
curl -X GET http://localhost:3101/api/v1/alerts/stats \
  -H "Authorization: Bearer <token>"
```

---

## 10. Files Reviewed

| File | Purpose |
|------|---------|
| `backend/src/api/auth/auth.controller.ts` | Auth endpoints |
| `backend/src/api/auth/auth.service.ts` | Auth business logic |
| `backend/src/api/auth/auth.service.spec.ts` | Auth unit tests |
| `backend/src/api/auth/dto/login.dto.ts` | Login validation |
| `backend/src/api/auth/dto/register.dto.ts` | Register validation |
| `backend/src/api/auth/guards/jwt-auth.guard.ts` | JWT guard |
| `backend/src/api/auth/strategies/jwt.strategy.ts` | JWT strategy |
| `backend/src/modules/alerts/alerts.controller.ts` | Alerts endpoints |
| `backend/src/modules/alerts/alerts.service.ts` | Alerts business logic |
| `backend/src/database/entities/user.entity.ts` | User entity |
| `backend/src/database/entities/alert.entity.ts` | Alert entity |

---

**Report Generated:** 2025-12-30T23:30:00Z
**Validation Tool:** Claude Code (claude-opus-4-5)
