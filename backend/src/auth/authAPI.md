# Auth API

## POST /account/register

Register a new user.

**Request Body:**
```json
{
  "username": "string",
  "account": "string",
  "password": "string",
  "name": "string (optional)",
  "role": "number (optional, default: 3)"
}
```

**Role Values:**
- 1: ADMIN (管理员)
- 2: TEACHER (教师)
- 3: STUDENT (学生)
- 4: PARENT (家长)

**Response:**
```json
{
  "status": 200,
  "result": {
    "id": "number",
    "username": "string",
    "account": "string",
    "name": "string",
    "avatar": "string | null",
    "userType": "number",
    "role": "number"
  }
}
```

---

## POST /account/login

Login with account credentials.

**Request Body:**
```json
{
  "account": "string",
  "password": "string"
}
```

**Response:**
```json
{
  "status": 200,
  "result": {
    "accessToken": "Bearer <jwt_token>",
    "refreshToken": "Bearer <jwt_token>",
    "expiresIn": 900,
    "user": {
      "id": "number",
      "username": "string",
      "account": "string",
      "name": "string",
      "avatar": "string | null",
      "userType": "number",
      "role": "number"
    }
  }
}
```

**JWT Payload contains:**
- `sub`: User ID
- `username`: Username
- `userType`: User type
- `role`: User role (1-4)
- `type`: Token type (access/refresh)
- `jti`: Unique token ID (refresh token only)

---

## POST /account/refresh

Refresh access token.

**Request Body:**
```json
{
  "refreshToken": "Bearer <refresh_token>"
}
```

**Response:**
```json
{
  "status": 200,
  "result": {
    "accessToken": "Bearer <new_jwt_token>",
    "refreshToken": "Bearer <new_refresh_token>",
    "expiresIn": 900
  }
}
```

---

## POST /account/logout

Logout and invalidate refresh token.

**Headers:** `Authorization: Bearer <access_token>`

**Request Body:**
```json
{
  "refreshToken": "Bearer <refresh_token>"
}
```

**Response:**
```json
{
  "status": 200,
  "message": "登出成功"
}
```

---

## GET /user/detail

Get current user details.

**Headers:** `Authorization: Bearer <access_token>`

**Response:**
```json
{
  "status": 200,
  "result": {
    "id": "number",
    "username": "string",
    "account": "string",
    "name": "string",
    "avatar": "string | null",
    "userType": "number",
    "role": "number",
    "sex": "number",
    "nickname": "string | null",
    "wechatStatus": "number"
  }
}
```