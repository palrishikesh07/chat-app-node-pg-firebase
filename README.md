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

 ---               GET               `/health`                                 Check health
                                                                                of API is running
  -----------------------------------------------------------------------------------------------
