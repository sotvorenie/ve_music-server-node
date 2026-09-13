import {type Request, type Response, Router} from 'express';
import multer from "multer";
import {db} from "@/db.js";

import {artistUploadAvatarService} from "@routes/artist/services.js";

import {uploadStorage} from "@composables/useUploadStorage.js";
import {createUrl} from "@composables/useCreateUrl.js";

import {getAdmin} from "@utils/auth.js";
import {asyncHandler} from "@utils/asyncHandler.js";
import {artistException,} from "@utils/httpExceptions.js";

import {idSchema} from "@schemas/idSchema.js";
import {pathSchema} from "@schemas/pathSchema.js";
import {nameSchema} from "@schemas/nameSchema.js";

import {getAllMusic} from "@services/getMusicService.js";
import {modelMap} from "@services/modelMap.js";
import {deleteFromDB} from "@services/deleteService.js";
import {redactNameInDB} from "@services/redactNameService.js";
import {deleteAvatar} from "@services/deleteAvatar.js";

import {artistAdminSelect} from "@selects/artistSelect.js";

export const adminArtistRouter = Router();

adminArtistRouter.get('/:id', getAdmin(), asyncHandler(async (req: Request, res: Response) => {
    const {id} = idSchema.parse(req.params)

    const artist = await db.artist.findUnique({
        where: {
            id
        },
        select: artistAdminSelect
    })

    res.json(artist)
}))

adminArtistRouter.get('/music/:id', getAdmin(), asyncHandler(async (req: Request, res: Response) => {
    await getAllMusic(req, res, modelMap.artist)
}))

const create = multer({storage: uploadStorage})
adminArtistRouter.post(
    '/create',
    getAdmin(),
    create.fields([
        {name: 'avatar', maxCount: 1},
    ]),
    asyncHandler(async (req: Request, res: Response) => {
        const {name} = nameSchema.parse(req.body)

        const {id} = await db.artist.create({
            data: {
                name,
            },
            select: {
                id: true,
            }
        })

    await artistUploadAvatarService(req, res, id)
}))

adminArtistRouter.delete('/delete/:id', getAdmin(), asyncHandler(async (req: Request, res: Response) => {
    await deleteFromDB(req, res, modelMap.artist)
}))

adminArtistRouter.patch('/redact_name/:id', getAdmin(), asyncHandler(async (req: Request, res: Response) => {
    await redactNameInDB(req, res, modelMap.artist)
}))

const upload = multer({storage: uploadStorage})
adminArtistRouter.post(
    '/upload_avatar/:id',
    getAdmin(),
    upload.fields([
        {name: 'avatar', maxCount: 1},
    ]),
    asyncHandler(async (req: Request, res: Response) => {
        const {id} = idSchema.parse(req.params)

        await artistUploadAvatarService(req, res, id)
    })
)

adminArtistRouter.post('/redact_avatar_url/:id', getAdmin(), asyncHandler(async (req: Request, res: Response) => {
    const {id} = idSchema.parse(req.params)
    const {path} = pathSchema.parse(req.body)

    const url = createUrl(path)

    const newUrl = await db.artist.update({
        where: {
            id
        },
        data: {
            avatarUrl: url
        },
        select: {
            avatarUrl: true,
        }
    })

    res.json({
        url: newUrl
    })
}))

adminArtistRouter.patch('/delete_avatar/:id', getAdmin(), asyncHandler(async (req: Request, res: Response) => {
    await deleteAvatar(req, res, modelMap.artist, artistException)
}))