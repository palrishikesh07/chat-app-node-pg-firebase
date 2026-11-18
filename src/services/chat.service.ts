
import * as chatRepository from "../repositories/chat.repository";

import * as messageRepository from "../repositories/message.repository";

import { AppError } from "../utils/appError";


// API 1: Create or Get Chat
export const createChat = async (
    userAId: string,
    userBId: string
): Promise<string> => {

    if (userAId === userBId) {
        throw new AppError(
            400,
            "Cannot create chat with yourself"
        );
    }

    return chatRepository.createOrGetChat(
        userAId,
        userBId
    );
};


// API 2: Send Message
export const sendMessage = async (
    chatId: string,
    senderId: string,
    text: string
) => {

    if (!text || !text.trim()) {
        throw new AppError(
            400,
            "Message cannot be empty"
        );
    }

    if (text.length > 5000) {
        throw new AppError(
            400,
            "Message cannot exceed 5000 characters"
        );
    }

    // Check chat membership
    const isMember = await chatRepository.isChatMember(
        chatId,
        senderId
    );

    if (!isMember) {
        throw new AppError(
            403,
            "User is not a member of this chat"
        );
    }

    // Save message in Firestore
    return messageRepository.createMessage(
        chatId,
        senderId,
        text.trim()
    );
};


// API 3: Get Messages
export const getMessages = async (
    chatId: string,
    userId: string,
    limit: number
) => {

    const isMember = await chatRepository.isChatMember(
        chatId,
        userId
    );

    if (!isMember) {
        throw new AppError(
            403,
            "Unauthorized chat access"
        );
    }

    const safeLimit = Math.min(
        Math.max(limit, 1),
        100
    );

    return messageRepository.findMessages(
        chatId,
        safeLimit
    );
};


// API 4: Mark Message Read
export const markMessageRead = async (
    chatId: string,
    messageId: string,
    userId: string
): Promise<void> => {

    const isMember = await chatRepository.isChatMember(
        chatId,
        userId
    );

    if (!isMember) {
        throw new AppError(
            403,
            "User is not a member of this chat"
        );
    }

    const message = await messageRepository.findMessage(
        chatId,
        messageId
    );

    if (!message) {
        throw new AppError(
            404,
            "Message not found"
        );
    }

    if (message?.senderId === userId) {
        throw new AppError(
            400,
            "Cannot mark your own message as read"
        );
    }

    await messageRepository.createReadReceipt(
        chatId,
        messageId,
        userId
    );
};


// API 5: Update Last Seen
export const updateLastSeen = async (
    chatId: string,
    messageId: string,
    userId: string
): Promise<void> => {

    const isMember = await chatRepository.isChatMember(
        chatId,
        userId
    );

    if (!isMember) {
        throw new AppError(
            403,
            "User is not a member of this chat"
        );
    }

    const message = await messageRepository.findMessage(
        chatId,
        messageId
    );

    if (!message) {
        throw new AppError(
            404,
            "Message not found"
        );
    }

    await messageRepository.saveLastSeen(
        chatId,
        userId,
        messageId
    );
};


// API 6: List User Chats
export const getUserChats = async (userId: string) => {
    return chatRepository.getUserChats(userId);
};
