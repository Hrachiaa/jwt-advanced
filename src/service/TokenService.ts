import jwt from 'jsonwebtoken';
import TokenModel from '../models/TokenModel';
import ApiError from '../exceptions/ApiError';

class TokenService {
    static generateTokens(payload: any) {
        if (!process.env.JWT_ACCESS_SECRET || !process.env.JWT_REFRESH_SECRET) {
            throw ApiError.serverError(
                'Сервер не нашел ключи для генерации токенов'
            );
        }
        const accessToken = jwt.sign(payload, process.env.JWT_ACCESS_SECRET, {
            expiresIn: '30m',
        });
        const refreshToken = jwt.sign(payload, process.env.JWT_REFRESH_SECRET, {
            expiresIn: '30d',
        });
        return {
            accessToken,
            refreshToken,
        };
    }

    static validateAccessToken(token: string) {
        try {
            if (!process.env.JWT_ACCESS_SECRET) {
                throw ApiError.serverError(
                    'Сервер не нашел ключи для генерации токенов'
                );
            }
            const userData = jwt.verify(token, process.env.JWT_ACCESS_SECRET);
            return userData;
        } catch (error) {
            return null;
        }
    }

    static validateRefreshToken(token: string) {
        try {
            if (!process.env.JWT_REFRESH_SECRET) {
                throw ApiError.serverError(
                    'Сервер не нашел ключи для генерации токенов'
                );
            }
            const userData = jwt.verify(token, process.env.JWT_REFRESH_SECRET);
            console.log(userData);
            return userData;
        } catch (error) {
            return null;
        }
    }

    static async saveToken(userId: string, refreshToken: string) {
        const tokenData = await TokenModel.findOne({ user: userId });
        if (tokenData) {
            tokenData.refreshToken = refreshToken;
            return tokenData.save();
        }
        const token = await TokenModel.create({ user: userId, refreshToken });
        return token;
    }

    static async findToken(refreshToken: string) {
        const tokenData = await TokenModel.findOne({ refreshToken });
        return tokenData;
    }

    static async removeToken(refreshToken: string) {
        const tokenData = await TokenModel.deleteOne({ refreshToken });
        return tokenData;
    }
}

export default TokenService;
