import { NextFunction, Request, Response } from 'express';
import ApiError from '../exceptions/ApiError';
import TokenService from '../service/TokenService';

export default function (req: Request, res: Response, next: NextFunction) {
    try {
        const authorizationHeader = req.headers.authorization;
        if (!authorizationHeader) {
            return next(ApiError.unauthorizedError());
        }

        const accessToken = authorizationHeader.split(' ')[1];
        if (!accessToken) {
            return next(ApiError.unauthorizedError());
        }

        const userData = TokenService.validateAccessToken(accessToken);
        if (!userData) {
            return next(ApiError.unauthorizedError());
        }

        req.user = userData;
        next();
    } catch (error) {
        return next(ApiError.unauthorizedError());
    }
}
