
export interface CreateChatRequest {
    userAId: string;
    userBId: string;
}

export interface SendMessageRequest {
    senderId: string;
    text: string;
}

export interface MarkReadRequest {
    userId: string;
}

export interface UpdateLastSeenRequest {
    userId: string;
    messageId: string;
}

export interface Chat {
    id: string;
    user1_id: string;
    user2_id: string;
    type: string;
    created_at: Date;
}

export interface ChatMessage {
    id: string;
    senderId: string;
    text: string;
    createdAt: string | null;
    deleted: boolean;
}

export interface UserChat {
    chat_id: string;
    type: string;
    members: string[];
    created_at: Date;
}
