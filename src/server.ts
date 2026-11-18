
import "dotenv/config";

import app from "./app";

import { pool } from "./config/database";

const PORT = Number(process.env.PORT || 5000);

const startServer = async (): Promise<void> => {

    try {

        // Verify PostgreSQL connection
        await pool.query("SELECT 1");

        console.log("PostgreSQL connected successfully");

        // Start Express server
        app.listen(PORT, () => {
            console.log(
                `Server running at http://localhost:${PORT}`
            );
        });

    } catch (error) {

        console.error(
            "Failed to start server:",
            error
        );

        process.exit(1);
    }
};

void startServer();
