
import { Router } from "express";

import {
    createChat,
    sendChatMessage,
    fetchMessages,
    readMessage,
    updateLastSeenMessage,
    fetchUserChats
} from "../controllers/chat.controller";

const router = Router();


// 1. Create or Get Chat
router.post(
    "/chat/create",
    createChat
);


// 2. Send Message
router.post(
    "/chat/:chatId/message/send",
    sendChatMessage
);


// 3. Get Messages
router.get(
    "/chat/:chatId/messages",
    fetchMessages
);


// 4. Mark Message Read
router.post(
    "/chat/:chatId/message/:messageId/read",
    readMessage
);


// 5. Update Last Seen
router.post(
    "/chat/:chatId/lastseen",
    updateLastSeenMessage
);


// 6. List User Chats
router.get(
    "/user/:userId/chats",
    fetchUserChats
);

export default router;
