
import { Request, Response } from "express";
import { z } from "zod";

import * as chatService from "../services/chat.service";

import { asyncHandler } from "../utils/asyncHandler";


// Validation schemas

const createChatSchema = z.object({
    userAId: z.string().uuid(),
    userBId: z.string().uuid()
});

const sendMessageSchema = z.object({
    senderId: z.string().uuid(),
    text: z.string().trim().min(1).max(5000)
});

const userSchema = z.object({
    userId: z.string().uuid()
});

const lastSeenSchema = z.object({
    userId: z.string().uuid(),
    messageId: z.string().min(1)
});

const messagesQuerySchema = z.object({
    userId: z.string().uuid(),
    limit: z.coerce.number().int().min(1).max(100).default(50)
});


// API 1: POST /chat/create

export const createChat = asyncHandler(
    async (req: Request, res: Response) => {

        const { userAId, userBId } =
            createChatSchema.parse(req.body);

        const chatId = await chatService.createChat(
            userAId,
            userBId
        );

        res.status(200).json({
            success: true,
            message: "Chat created or retrieved",
            chatId
        });
    }
);


// API 2: POST /chat/:chatId/message/send

export const sendChatMessage = asyncHandler(
    async (req: Request, res: Response) => {

        const chatId = z.string().uuid().parse(
            req.params.chatId
        );

        const { senderId, text } =
            sendMessageSchema.parse(req.body);

        const message = await chatService.sendMessage(
            chatId,
            senderId,
            text
        );

        res.status(201).json({
            success: true,
            message
        });
    }
);


// API 3: GET /chat/:chatId/messages

export const fetchMessages = asyncHandler(
    async (req: Request, res: Response) => {

        const chatId = z.string().uuid().parse(
            req.params.chatId
        );

        const { userId, limit } =
            messagesQuerySchema.parse(req.query);

        const messages = await chatService.getMessages(
            chatId,
            userId,
            limit
        );

        res.status(200).json({
            success: true,
            count: messages.length,
            messages
        });
    }
);


// API 4: POST /chat/:chatId/message/:messageId/read

export const readMessage = asyncHandler(
    async (req: Request, res: Response) => {

        const chatId = z.string().uuid().parse(
            req.params.chatId
        );

        const messageId = z.string().min(1).parse(
            req.params.messageId
        );

        const { userId } =
            userSchema.parse(req.body);

        await chatService.markMessageRead(
            chatId,
            messageId,
            userId
        );

        res.status(200).json({
            success: true,
            message: "Message marked as read"
        });
    }
);


// API 5: POST /chat/:chatId/lastseen

export const updateLastSeenMessage = asyncHandler(
    async (req: Request, res: Response) => {

        const chatId = z.string().uuid().parse(
            req.params.chatId
        );

        const { userId, messageId } =
            lastSeenSchema.parse(req.body);

        await chatService.updateLastSeen(
            chatId,
            messageId,
            userId
        );

        res.status(200).json({
            success: true,
            message: "Last seen updated"
        });
    }
);


// API 6: GET /user/:userId/chats

export const fetchUserChats = asyncHandler(
    async (req: Request, res: Response) => {

        const userId = z.string().uuid().parse(
            req.params.userId
        );

        const chats = await chatService.getUserChats(
            userId
        );

        res.status(200).json({
            success: true,
            count: chats.length,
            chats
        });
    }
);
