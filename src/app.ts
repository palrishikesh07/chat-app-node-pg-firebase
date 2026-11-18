
import express from "express";
import cors from "cors";

import chatRoutes from "./routes/chat.routes";

import {
    errorHandler
} from "./middlewares/error.middleware";

const app = express();


// Middleware
app.use(cors());

app.use(express.json());


// Health check API
app.get("/health", (req, res) => {
    res.status(200).json({
        success: true,
        message: "Chat backend is running"
    });
});


// Register chat routes
app.use("/", chatRoutes);


// Handle unknown routes
app.use((req, res) => {
    res.status(404).json({
        success: false,
        message: "API endpoint not found"
    });
});


// Global error handler (must be last)
app.use(errorHandler);

export default app;
