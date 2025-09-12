import bcrypt from 'bcryptjs';
import uuid from 'uuid';
import UserModel from '../models/UserModel';
import MailService from './MailService';
import TokenService from './TokenService';
import UserDto from '../dtos/userDto';
import ApiError from '../exceptions/ApiError';

class UserService {
    static async registration(email: string, password: string) {
        // Проверяем существование аккаунтов с такой почтой
        const condidate = await UserModel.findOne({ email });
        if (condidate) {
            throw ApiError.badRequest(
                `User with email ${email} already exists`
            );
        }
        // Хешируем пароль, создаем "ссылку" для активации
        const hashPassword = await bcrypt.hash(password, 7);
        const activationLink = uuid.v4();
        // Создаем пользователя, отправляем код активации
        const newUser = await UserModel.create({
            email,
            password: hashPassword,
            activationLink,
        });
        await MailService.sendActivationMail(
            email,
            `${process.env.API_URL}/api/activate/${activationLink}`
        );
        // Создаем токены, сохраняем рефреш токен в базе данных
        const userDto = new UserDto(newUser);
        const tokens = TokenService.generateTokens({ ...userDto });
        await TokenService.saveToken(userDto.id, tokens.refreshToken);
        // отправляем ответ
        return {
            ...tokens,
            user: userDto,
        };
    }

    static async activate(activationLink: string) {
        const user = await UserModel.findOne({ activationLink });
        if (!user) {
            throw ApiError.badRequest('Некорректная ссылка активации');
        }
        if (user.isActivated) {
            throw ApiError.badRequest('Аккаунт уже активирован');
        }
        user.isActivated = true;
        await user.save();
    }

    static async login(email: string, password: string) {
        // Проверяем существует ли аккаунт с этой почтой
        const user = await UserModel.findOne({ email });
        if (!user) {
            throw ApiError.badRequest(`User is not exist`);
        }
        // Проверяем пароль
        const isPassTrue = await bcrypt.compare(password, user.password);
        if (!isPassTrue) {
            throw ApiError.badRequest('Wrong password');
        }
        // Создаем токены, сохраняем рефреш токен в базе данных
        const userDto = new UserDto(user);
        console.log(userDto);
        const tokens = TokenService.generateTokens({ ...userDto });
        // Сохраняем токены и отправляем ответ
        await TokenService.saveToken(userDto.id, tokens.refreshToken);
        return {
            ...tokens,
            user: userDto,
        };
    }

    static async logout(refreshToken: string) {
        const token = await TokenService.removeToken(refreshToken);
        return token;
    }

    static async refresh(refreshToken: string) {
        // Проверяем наличие самого токена
        if (!refreshToken) {
            throw ApiError.unauthorizedError();
        }
        // Проверяем токен на валидацию и наличие в БД
        const userData: any = TokenService.validateRefreshToken(refreshToken);
        const tokenFromDB = await TokenService.findToken(refreshToken);
        if (!userData || !tokenFromDB) {
            throw ApiError.unauthorizedError();
        }
        // Создаем токены, сохраняем рефреш токен в базе данных
        const user = await UserModel.findById(userData.id);
        const userDto = new UserDto(user);
        const tokens = TokenService.generateTokens({ ...userDto });
        // Сохраняем токены и отправляем ответ
        await TokenService.saveToken(userDto.id, tokens.refreshToken);
        return {
            ...tokens,
            user: userDto,
        };
    }
}

export default UserService;
