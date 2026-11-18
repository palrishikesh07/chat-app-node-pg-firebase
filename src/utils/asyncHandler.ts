
import { Request,Response,NextFunction,RequestHandler } from "express";

type AsyncController = (req: Request, res: Response,next: NextFunction) => Promise<void>;

export const asyncHandler = ( fn: AsyncController ): RequestHandler => {
    return (req, res, next) => {
        void fn(req, res, next).catch(next);
    };
};
