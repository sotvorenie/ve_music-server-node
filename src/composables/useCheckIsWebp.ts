import path from "node:path";

export const checkIsWebp = (
    file: Express.Multer.File,
) => {
    return path.extname(file.originalname).slice(1).toLowerCase() === "webp"
}