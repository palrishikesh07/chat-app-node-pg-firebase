
import { pool } from "../config/database";
import { AppError } from "../utils/appError";

// Create a new chat or return an existing chat
export const createOrGetChat = async (
    userAId: string,
    userBId: string
): Promise<string> => {

    // Normalize user IDs to prevent duplicate chats
    const [user1, user2] = [userAId, userBId].sort();

    const client = await pool.connect();

    try {
        await client.query("BEGIN");

        console.log("user1", user1)
        console.log("user2", user2)
        // Check whether both users exist
        const users = await client.query(
            `SELECT id FROM users
             WHERE id = ANY($1::uuid[])`,
            [[user1, user2]]
        );
        console.log("users: ", users.rows)

        if (users.rowCount !== 2) {
            throw new AppError(
                404,
                "One or both users do not exist"
            );
        }

        // Create chat or return existing chat
        const result = await client.query(
            `INSERT INTO chats (user1_id, user2_id)
             VALUES ($1, $2)

             ON CONFLICT (user1_id, user2_id)
             DO UPDATE SET user1_id = EXCLUDED.user1_id

             RETURNING id`,
            [user1, user2]
        );

        const chatId: string = result.rows[0].id;

        // Insert chat members
        await client.query(
            `INSERT INTO chat_members (chat_id, user_id)
             VALUES ($1, $2), ($1, $3)

             ON CONFLICT (chat_id, user_id)
             DO NOTHING`,
            [chatId, user1, user2]
        );

        await client.query("COMMIT");

        return chatId;

    } catch (error) {

        await client.query("ROLLBACK");

        throw error;

    } finally {

        client.release();

    }
};


// Check whether user belongs to a chat
export const isChatMember = async (
    chatId: string,
    userId: string
): Promise<boolean> => {

    const result = await pool.query(
        `SELECT 1
         FROM chat_members
         WHERE chat_id = $1
         AND user_id = $2`,
        [chatId, userId]
    );

    return (result.rowCount ?? 0) > 0;
};


// Get all chats belonging to a user
export const getUserChats = async (
    userId: string
) => {

    const result = await pool.query(
        `SELECT
            c.id AS chat_id,
            c.type,
            c.created_at,
            ARRAY_AGG(cm.user_id ORDER BY cm.user_id) AS members

         FROM chats c

         INNER JOIN chat_members cm
            ON c.id = cm.chat_id

         WHERE EXISTS (
            SELECT 1
            FROM chat_members own
            WHERE own.chat_id = c.id
            AND own.user_id = $1
         )

         GROUP BY c.id, c.type, c.created_at

         ORDER BY c.created_at DESC`,
        [userId]
    );

    return result.rows;
};
