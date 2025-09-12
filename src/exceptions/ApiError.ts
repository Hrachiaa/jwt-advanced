class ApiError extends Error {
    status: number;
    errors: any;
    constructor(
        status: 400 | 401 | 403 | 404 | 500,
        message: string,
        errors: any = []
    ) {
        super(message);
        this.status = status;
        this.errors = errors;
    }

    static unauthorizedError() {
        return new ApiError(401, 'Пользователь не авторизован');
    }

    static badRequest(message: string, errors: any = []) {
        return new ApiError(400, message, errors);
    }

    static serverError(message: string) {
        return new ApiError(500, message);
    }
}

export default ApiError;
