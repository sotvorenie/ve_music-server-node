export class AppError extends Error {
    status: number
    detail: string

    constructor(status: number, detail: string) {
        super(detail);
        this.status = status;
        this.detail = detail;
        this.name = 'AppError';
    }
}
export const HttpError = (status: number, detail: string) => {
    return new AppError(status, detail)
}

// база данных
export const dbException = HttpError(500, "Ошибка БД");

// авторизация и токен
export const jwtException = HttpError(401, "Не удалось валидировать токен");
export const registrationException = HttpError(409, "Пользователь с таким логином уже существует");
export const authException = HttpError(401, "Неверное имя или пароль");

// редактирование данных пользователя
export const emptyUserDataException = HttpError(400, "Неверные данные пользователя");
export const duplicationPasswordException = HttpError(400, "Новый пароль должен отличаться от текущего");

// музыка
export const musicException = HttpError(404, "Музыка не найдена");

// загрузка файлов
export const photoFormatException = HttpError(400, "Неподдерживаемый формат фото");
export const videoFormatException = HttpError(400, "Неподдерживаемый формат видео");
export const audioFormatException = HttpError(400, "Неподдерживаемый формат аудио");
export const emptyMusicDataException = HttpError(400, "Неверные данные музыки");

// исполнитель
export const artistException = HttpError(404, "Исполнитель не найден");

// пользователь
export const userException = HttpError(404, "Пользователь не найден");
