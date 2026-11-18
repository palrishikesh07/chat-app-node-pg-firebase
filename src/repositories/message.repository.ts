import { FieldValue } from "firebase-admin/firestore";

import { firestore } from "../config/firebase";

import { ChatMessage } from "../types/chat.types";

const getMessagesCollection = (chatId: string) => {
    return firestore
        .collection("chats")
        .doc(chatId)
        .collection("messages");
};


// Send message
export const createMessage = async (
    chatId: string,
    senderId: string,
    text: string
): Promise<ChatMessage> => {

    const messageRef = getMessagesCollection(chatId).doc();

    await messageRef.set({
        senderId,
        text,
        createdAt: FieldValue.serverTimestamp(),
        deleted: false
    });

    const savedMessage = await messageRef.get();

    const data = savedMessage.data();

    if (!data) {
        throw new Error("Unable to save message");
    }

    return {
        id: messageRef.id,
        senderId: data.senderId,
        text: data.text,
        createdAt: data.createdAt?.toDate().toISOString() ?? null,
        deleted: data.deleted
    };
};


// Get messages
export const findMessages = async (
    chatId: string,
    limit: number
): Promise<ChatMessage[]> => {

    const snapshot = await getMessagesCollection(chatId)
        .orderBy("createdAt", "desc")
        .limit(limit)
        .get();

    const messages: ChatMessage[] = snapshot.docs.map(doc => {

        const data = doc.data();

        return {
            id: doc.id,
            senderId: data.senderId,
            text: data.text,
            createdAt: data.createdAt?.toDate().toISOString() ?? null,
            deleted: data.deleted
        };
    });

    // Return oldest to newest
    return messages.reverse();
};


// Get one message
export const findMessage = async (
    chatId: string,
    messageId: string
): Promise<ChatMessage | null> => {

    const snapshot = await getMessagesCollection(chatId)
        .doc(messageId)
        .get();

    if (!snapshot.exists) {
        return null;
    }

    const data = snapshot.data();

    if (!data) {
        return null;
    }

    return {
        id: snapshot.id,
        senderId: data.senderId,
        text: data.text,
        createdAt: data.createdAt?.toDate().toISOString() ?? null,
        deleted: data.deleted
    };
};


// Mark message as read
export const createReadReceipt = async (
    chatId: string,
    messageId: string,
    userId: string
): Promise<void> => {

    const receiptRef = firestore
        .collection("chats")
        .doc(chatId)
        .collection("readReceipts")
        .doc(`${messageId}_${userId}`);

    await receiptRef.set({
        messageId,
        userId,
        readAt: FieldValue.serverTimestamp()
    });
};


// Update last seen
export const saveLastSeen = async (
    chatId: string,
    userId: string,
    messageId: string
): Promise<void> => {

    const lastSeenRef = firestore
        .collection("chats")
        .doc(chatId)
        .collection("lastSeen")
        .doc(userId);

    await lastSeenRef.set({
        userId,
        lastSeenMessageId: messageId,
        lastSeenAt: FieldValue.serverTimestamp()
    });
};
