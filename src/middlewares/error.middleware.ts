import {
    Request,
    Response,
    NextFunction
} from "express";

import { ZodError } from "zod";

import { AppError } from "../utils/appError";

export const errorHandler = (
    error: unknown,
    req: Request,
    res: Response,
    next: NextFunction
): void => {

    console.error(error);

    // Validation errors
    if (error instanceof ZodError) {
        res.status(400).json({
            success: false,
            message: "Validation failed",
            errors: error.issues.map(issue => ({
                field: issue.path.join("."),
                message: issue.message
            }))
        });

        return;
    }

    // Custom application errors
    if (error instanceof AppError) {
        res.status(error.statusCode).json({
            success: false,
            message: error.message
        });

        return;
    }

    // Google Firestore database unavailable or not initialized
    if (
        typeof error === "object" &&
        error !== null &&
        "code" in error &&
        error.code === 5
    ) {
        res.status(503).json({
            success: false,
            message: "Firestore database is unavailable. Create the default database in Firebase Console and enable required IAM permissions.",
            code: "FIRESTORE_NOT_FOUND"
        });
        return;
    }

    // Unexpected errors
    res.status(500).json({
        success: false,
        message: "Internal server error"
    });
};
