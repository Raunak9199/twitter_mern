# User Authentication API

## Overview

This API provides user authentication functionalities, including user registration, login, logout, and profile retrieval.

## Base URL

```
http://base-api-url.com/api/v1/users
```

## Endpoints

### 1. User Signup

**Endpoint:**

```
POST /users/signup
```

**Request Body:**

```json
{
  "email": "raunakraj@test.com",
  "userName": "raunak12",
  "fullName": "Raunak Raj",
  "password": "12345678"
}
```

**Response:**

```json
{
  "statusCode": 201,
  "data": {
    "_id": "67abb958e596da5c18246ddd",
    "userName": "raunak12",
    "fullName": "Raunak Raj",
    "email": "raunakraj@test.com",
    "profileImg": "",
    "coverImg": "",
    "followers": [],
    "following": [],
    "bio": "",
    "link": "",
    "createdAt": "2025-02-11T20:55:52.654Z",
    "updatedAt": "2025-02-11T20:55:52.825Z",
    "__v": 0
  },
  "message": "User Registered Successfully",
  "success": true
}
```

---

### 2. User Login

**Endpoint:**

```
POST /users/login
```

**Request Body:**

```json
{
  "userName": "raunak123",
  "password": "12345678"
}
```

**Response:**

```json
{
  "statusCode": 200,
  "data": {
    "user": {
      "_id": "67abaeb376f0d81f15ad50d6",
      "userName": "raunak123",
      "fullName": "Raunak Raj",
      "email": "raunakraj94543@test.com",
      "profileImg": "",
      "coverImg": "",
      "followers": [],
      "following": [],
      "bio": "",
      "link": "",
      "createdAt": "2025-02-11T20:10:27.969Z",
      "updatedAt": "2025-02-11T20:52:28.616Z",
      "__v": 0
    },
    "accessToken": "<JWT_ACCESS_TOKEN>",
    "refreshToken": "<JWT_REFRESH_TOKEN>"
  },
  "message": "Login successful",
  "success": true
}
```

---

### 3. Get User Profile

**Endpoint:**

```
POST /users/profile
```

**Headers:**

```
Authorization: Bearer <JWT_ACCESS_TOKEN>
```

**Response:**

```json
{
  "statusCode": 200,
  "data": {
    "_id": "67abaeb376f0d81f15ad50d6",
    "userName": "raunak123",
    "fullName": "Raunak Raj",
    "email": "raunakraj94543@test.com",
    "profileImg": "",
    "coverImg": "",
    "followers": [],
    "following": [],
    "bio": "",
    "link": "",
    "createdAt": "2025-02-11T20:10:27.969Z",
    "updatedAt": "2025-02-11T20:52:28.616Z",
    "__v": 0
  },
  "message": "Success",
  "success": true
}
```

---

### 4. User Logout

**Endpoint:**

```
POST /users/logout
```

**Headers:**

```
Authorization: Bearer <JWT_ACCESS_TOKEN>
```

**Response:**

```json
{
  "statusCode": 200,
  "data": {},
  "message": "User logged out successfully.",
  "success": true
}
```

---

## Routes Definition

```js
router.route("/signup").post(signup);
router.route("/login").post(login);
router.route("/logout").post(isAuthenticated, logout);
router.route("/profile").post(isAuthenticated, getMe);
```

## Authentication

- Users must provide a valid `accessToken` in the Authorization header for protected routes.
- The `refreshToken` is used for generating new access tokens.

## Dependencies

- Node.js
- Express.js
- MongoDB
- Mongoose
- JWT (jsonwebtoken)
- bcrypt for password hashing

## Setup Instructions

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```
3. Create a `.env` file and add required environment variables:
   ```
   MONGO_URI=
   ACCES_TOKEN_SECRET=your_jwt_secret
   ACCES_TOKEN_EXPIRY=1h
   REFRESH_TOKEN_SECRET=your_refresh_token_secret
   REFRESH_TOKEN_EXPIRY=7d
   ```
4. Start the server:
   ```bash
   npm start
   ```
