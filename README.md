# Chat Backend API Reference

**Base URL:** `http://localhost:5000`\
**Content-Type:** `application/json`

This document describes the six required chat APIs and the health-check
endpoint for the Node.js + TypeScript, PostgreSQL, and Firebase
Firestore implementation.

## API Summary

  -----------------------------------------------------------------------------------------------
  \#                Method            Endpoint                                  Purpose
  ----------------- ----------------- ----------------------------------------- -----------------
  1                 POST              `/chat/create`                            Create a direct
                                                                                chat or return
                                                                                the existing chat

  2                 POST              `/chat/:chatId/message/send`              Send a message

  3                 GET               `/chat/:chatId/messages`                  Retrieve messages

  4                 POST              `/chat/:chatId/message/:messageId/read`   Mark a message as
                                                                                read

  5                 POST              `/chat/:chatId/lastseen`                  Update a user's
                                                                                last-seen message

  6                 GET               `/user/:userId/chats`                     List chats
                                                                                belonging to a
                                                                                user

  ---               GET               `/health`                                 Check whether the
                                                                                API is running
  -----------------------------------------------------------------------------------------------

------------------------------------------------------------------------

## 1. Create or Get Chat

Creates a one-to-one chat between two existing users. If a chat already
exists for the same pair of users, the existing `chatId` is returned.

-   **Method:** `POST`
-   **URL:** `/chat/create`
-   **Path parameters:** None
-   **Query parameters:** None
-   **Request body:** Required

### Request body

``` json
{
  "userAId": "RAHUL_UUID",
  "userBId": "AMIT_UUID"
}
```

  Field       Type          Required   Description
  ----------- ------------- ---------- ------------------
  `userAId`   UUID string   Yes        First user's ID
  `userBId`   UUID string   Yes        Second user's ID

### Success response --- `200 OK`

``` json
{
  "success": true,
  "message": "Chat created or retrieved",
  "chatId": "CHAT_UUID"
}
```

### Possible errors

-   `400 Bad Request` --- Invalid UUID or both user IDs are the same.
-   `404 Not Found` --- One or both users do not exist.
-   `500 Internal Server Error` --- Unexpected server/database error.

### Postman setup

-   Method: `POST`
-   URL: `http://localhost:5000/chat/create`
-   Body → raw → JSON: use the request body shown above.

------------------------------------------------------------------------

## 2. Send Message

Stores a message in the Firestore `chats/{chatId}/messages`
subcollection. The sender must be a member of the chat.

-   **Method:** `POST`
-   **URL:** `/chat/:chatId/message/send`
-   **Path parameters:** `chatId` --- UUID of the chat
-   **Query parameters:** None
-   **Request body:** Required

### Request body

``` json
{
  "senderId": "RAHUL_UUID",
  "text": "Hello Amit!"
}
```

  -----------------------------------------------------------------------
  Field             Type              Required          Description
  ----------------- ----------------- ----------------- -----------------
  `senderId`        UUID string       Yes               ID of the message
                                                        sender

  `text`            String            Yes               Message text;
                                                        1--5000
                                                        characters after
                                                        trimming
  -----------------------------------------------------------------------

### Success response --- `201 Created`

``` json
{
  "success": true,
  "message": {
    "id": "FIRESTORE_MESSAGE_ID",
    "senderId": "RAHUL_UUID",
    "text": "Hello Amit!",
    "createdAt": "2026-11-18T10:30:00.000Z",
    "deleted": false
  }
}
```

`createdAt` is assigned by Firestore using a server timestamp. The exact
value depends on when Firestore commits the write.

### Possible errors

-   `400 Bad Request` --- Empty message or message longer than 5000
    characters.
-   `403 Forbidden` --- Sender is not a member of the chat.
-   `500 Internal Server Error` --- Unexpected server or Firestore
    error.

### Postman setup

-   Method: `POST`
-   URL: `http://localhost:5000/chat/CHAT_UUID/message/send`
-   Body → raw → JSON: use the request body shown above.

------------------------------------------------------------------------

## 3. Get Messages

Retrieves messages from Firestore in chronological order (oldest to
newest within the returned page).

-   **Method:** `GET`
-   **URL:** `/chat/:chatId/messages`
-   **Path parameters:** `chatId` --- UUID of the chat
-   **Query parameters:** `userId`, `limit`
-   **Request body:** None

### Path parameters

  -----------------------------------------------------------------------
  Parameter         Type              Required          Description
  ----------------- ----------------- ----------------- -----------------
  `chatId`          UUID string       Yes               Chat whose
                                                        messages should
                                                        be retrieved

  -----------------------------------------------------------------------

### Query parameters

  --------------------------------------------------------------------------
  Parameter      Type           Required       Default        Description
  -------------- -------------- -------------- -------------- --------------
  `userId`       UUID string    Yes            ---            User
                                                              requesting the
                                                              messages; must
                                                              be a chat
                                                              member

  `limit`        Integer        No             `50`           Number of
                                                              messages to
                                                              return;
                                                              allowed range
                                                              is 1--100
  --------------------------------------------------------------------------

### Example request

``` http
GET http://localhost:5000/chat/CHAT_UUID/messages?userId=RAHUL_UUID&limit=50
```

### Success response --- `200 OK`

``` json
{
  "success": true,
  "count": 2,
  "messages": [
    {
      "id": "MESSAGE_ID_1",
      "senderId": "RAHUL_UUID",
      "text": "Hello Amit!",
      "createdAt": "2026-11-18T10:30:00.000Z",
      "deleted": false
    },
    {
      "id": "MESSAGE_ID_2",
      "senderId": "AMIT_UUID",
      "text": "Hi Rahul!",
      "createdAt": "2026-11-18T10:31:00.000Z",
      "deleted": false
    }
  ]
}
```

### Possible errors

-   `400 Bad Request` --- Invalid chat UUID, user UUID, or limit.
-   `403 Forbidden` --- Requesting user is not a member of the chat.
-   `500 Internal Server Error` --- Unexpected server or Firestore
    error.

### Important implementation note

The original task specifies `?limit=50`, but the provided implementation
also requires `userId` so it can check chat membership:

`GET /chat/CHAT_UUID/messages?userId=RAHUL_UUID&limit=50`

In a production application, derive the user ID from the authenticated
JWT instead of accepting it as a query parameter.

------------------------------------------------------------------------

## 4. Mark Message as Read

Creates or updates a read-receipt document in Firestore at:

`chats/{chatId}/readReceipts/{messageId}_{userId}`

The user must belong to the chat and cannot mark their own message as
read.

-   **Method:** `POST`
-   **URL:** `/chat/:chatId/message/:messageId/read`
-   **Path parameters:** `chatId`, `messageId`
-   **Query parameters:** None
-   **Request body:** Required

### Path parameters

  Parameter     Type          Required   Description
  ------------- ------------- ---------- -------------------------------
  `chatId`      UUID string   Yes        Chat containing the message
  `messageId`   String        Yes        Firestore message document ID

### Request body

``` json
{
  "userId": "AMIT_UUID"
}
```

  Field      Type          Required   Description
  ---------- ------------- ---------- -------------------------------------
  `userId`   UUID string   Yes        ID of the user who read the message

### Example request

``` http
POST http://localhost:5000/chat/CHAT_UUID/message/FIRESTORE_MESSAGE_ID/read
```

### Success response --- `200 OK`

``` json
{
  "success": true,
  "message": "Message marked as read"
}
```

### Firestore read-receipt document

``` json
{
  "messageId": "FIRESTORE_MESSAGE_ID",
  "userId": "AMIT_UUID",
  "readAt": "Firestore server timestamp"
}
```

### Possible errors

-   `400 Bad Request` --- Invalid chat UUID or user UUID, or user is
    trying to read their own message.
-   `403 Forbidden` --- User is not a member of the chat.
-   `404 Not Found` --- Message does not exist.
-   `500 Internal Server Error` --- Unexpected server or Firestore
    error.

------------------------------------------------------------------------

## 5. Update Last Seen Message

Stores the last message read by a user in Firestore at:

`chats/{chatId}/lastSeen/{userId}`

The user must be a member of the chat and the supplied message must
exist.

-   **Method:** `POST`
-   **URL:** `/chat/:chatId/lastseen`
-   **Path parameters:** `chatId`
-   **Query parameters:** None
-   **Request body:** Required

### Path parameters

  Parameter   Type          Required   Description
  ----------- ------------- ---------- ------------------------------------
  `chatId`    UUID string   Yes        Chat in which last seen is updated

### Request body

``` json
{
  "userId": "AMIT_UUID",
  "messageId": "FIRESTORE_MESSAGE_ID"
}
```

  -----------------------------------------------------------------------
  Field             Type              Required          Description
  ----------------- ----------------- ----------------- -----------------
  `userId`          UUID string       Yes               User whose
                                                        last-seen
                                                        position is being
                                                        updated

  `messageId`       String            Yes               Existing
                                                        Firestore message
                                                        document ID
  -----------------------------------------------------------------------

### Example request

``` http
POST http://localhost:5000/chat/CHAT_UUID/lastseen
```

### Success response --- `200 OK`

``` json
{
  "success": true,
  "message": "Last seen updated"
}
```

### Firestore last-seen document

``` json
{
  "userId": "AMIT_UUID",
  "lastSeenMessageId": "FIRESTORE_MESSAGE_ID",
  "lastSeenAt": "Firestore server timestamp"
}
```

### Possible errors

-   `400 Bad Request` --- Invalid chat UUID, user UUID, or missing
    message ID.
-   `403 Forbidden` --- User is not a member of the chat.
-   `404 Not Found` --- Message does not exist.
-   `500 Internal Server Error` --- Unexpected server or Firestore
    error.

**Note:** The current basic implementation does not prevent a user from
moving their last-seen position backwards. Add chronological validation
or a per-chat sequence number for production use.

------------------------------------------------------------------------

## 6. List User Chats

Retrieves all chats in which the specified user is a participant. Chat
and participant information comes from PostgreSQL.

-   **Method:** `GET`
-   **URL:** `/user/:userId/chats`
-   **Path parameters:** `userId`
-   **Query parameters:** None
-   **Request body:** None

### Path parameters

  Parameter   Type          Required   Description
  ----------- ------------- ---------- -----------------------------------
  `userId`    UUID string   Yes        User whose chats should be listed

### Example request

``` http
GET http://localhost:5000/user/RAHUL_UUID/chats
```

### Success response --- `200 OK`

``` json
{
  "success": true,
  "count": 1,
  "chats": [
    {
      "chat_id": "CHAT_UUID",
      "type": "direct",
      "created_at": "2026-11-18T10:00:00.000Z",
      "members": [
        "AMIT_UUID",
        "RAHUL_UUID"
      ]
    }
  ]
}
```

### Possible errors

-   `400 Bad Request` --- Invalid user UUID.
-   `500 Internal Server Error` --- Unexpected database error.

**Note:** The current implementation returns an empty array if the user
has no chats. It does not separately check whether that user exists.

------------------------------------------------------------------------

## 7. Health Check

Checks whether the Express API is responding.

-   **Method:** `GET`
-   **URL:** `/health`
-   **Path parameters:** None
-   **Query parameters:** None
-   **Request body:** None

### Example request

``` http
GET http://localhost:5000/health
```

### Success response --- `200 OK`

``` json
{
  "success": true,
  "message": "Chat backend is running"
}
```

------------------------------------------------------------------------

# Postman Testing Order

Use this sequence when testing the complete chat workflow.

1.  Create two users in PostgreSQL and copy their UUIDs.
2.  Call **Create or Get Chat** and save the returned `chatId`.
3.  Call **Send Message** and save the returned Firestore message `id`.
4.  Call **Get Messages** using the chat ID and requesting user's ID.
5.  Call **Mark Message as Read** using the message ID and the other
    user's ID.
6.  Call **Update Last Seen** using the message ID and the other user's
    ID.
7.  Call **List User Chats** using either participant's user ID.
8.  Call **Health Check** to verify the API is responding.

## IDs: Important Difference

There are two kinds of IDs in this application:

  ID           Generated/stored by   Used for
  ------------ --------------------- ---------------------------
  User ID      PostgreSQL            Identifying users
  Chat ID      PostgreSQL            Identifying conversations
  Message ID   Firestore             Identifying messages

Do not confuse the PostgreSQL chat UUID with the Firestore message
document ID.

## Database Responsibility

  Data                Storage
  ------------------- --------------------
  Users               PostgreSQL
  Chats               PostgreSQL
  Chat members        PostgreSQL
  Messages            Firebase Firestore
  Read receipts       Firebase Firestore
  Last-seen message   Firebase Firestore

## Security Notes

The examples use `userId` and `senderId` in request bodies or query
parameters to make local Postman testing straightforward. This is not
sufficient authentication for a production chat application.

Before production deployment:

-   Add JWT authentication.
-   Derive the acting user's ID from the verified token.
-   Check chat membership for every chat operation.
-   Never trust a client-supplied `senderId` or `userId` as proof of
    identity.
-   Keep Firebase service-account credentials out of source control.
-   Configure Firestore indexes and access permissions appropriately.
