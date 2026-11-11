import {type Request, type Response, Router} from 'express';
import multer from "multer";

import {uploadAvatar} from "@routes/artist/services/helpers.js";
import {getArtist, createArtist, deleteArtist, updateAvatarPath} from "@routes/artist/services/index.js";

import {uploadStorage} from "@utils/uploadStorage.js";
import {cleanupTempFiles} from "@utils/cleanupTempFiles.js";

import {getAdmin} from "@utils/auth.js";
import {asyncHandler} from "@utils/asyncHandler.js";
import {artistException, emptyUserDataException, musicException,} from "@utils/httpExceptions.js";

import {getMusic} from "@services/getMusic.js";
import {modelMap} from "@services/modelMap.js";
import {updateNameInDB} from "@services/updateNameInDB.js";
import {deleteAvatar} from "@services/deleteAvatar.js";

import {idSchema} from "@schemas/idSchema.js";
import {pathSchema} from "@schemas/pathSchema.js";
import {nameSchema} from "@schemas/nameSchema.js";
import {pageLimitSchema} from "@schemas/pageLimitSchema.js";

import {successResponse} from "@responses/successResponse.js";

export const adminArtistRouter = Router();

const upload = multer({storage: uploadStorage})

adminArtistRouter.get('/:id', getAdmin(), asyncHandler(async (req: Request, res: Response) => {
    const {id} = idSchema.parse(req.params)

    const artist = await getArtist(id)

    if (!artist) throw artistException

    res.json(artist)
}))

adminArtistRouter.get('/music/:id', getAdmin(), asyncHandler(async (req: Request, res: Response) => {
    const {id, page, limit} = idSchema.extend(pageLimitSchema.shape).parse(req.params)

    const music = await getMusic(id, page, limit, modelMap.artist)

    if (!music?.length) throw musicException

    res.json({
        data: music,
        meta: {
            page,
            limit,
        },
    })
}))

adminArtistRouter.post(
    '/create',
    getAdmin(),
    upload.fields([
        {name: 'avatar', maxCount: 1},
    ]),
    cleanupTempFiles,
    asyncHandler(async (req: Request, res: Response) => {
        const {name} = nameSchema.parse(req.body)

        const files = req.files as Record<string, Express.Multer.File[]> | undefined
        const avatarFile = files?.avatar?.[0]

        if (!avatarFile) throw emptyUserDataException

        const newAvatarUrl = await createArtist(name, avatarFile)

        res.status(201).json({
            url: newAvatarUrl,
        })
    })
)

adminArtistRouter.delete('/delete/:id', getAdmin(), asyncHandler(async (req: Request, res: Response) => {
    const {id} = idSchema.parse(req.params)

    await deleteArtist(id)

    successResponse(res)
}))

adminArtistRouter.patch('/update_name/:id', getAdmin(), asyncHandler(async (req: Request, res: Response) => {
    const {id} = idSchema.parse(req.params)
    const {name} = nameSchema.parse(req.body)

    await updateNameInDB(id, name, modelMap.artist)

    successResponse(res)
}))

adminArtistRouter.post(
    '/upload_avatar/:id',
    getAdmin(),
    upload.fields([
        {name: 'avatar', maxCount: 1},
    ]),
    cleanupTempFiles,
    asyncHandler(async (req: Request, res: Response) => {
        const {id} = idSchema.parse(req.params)

        const files = req.files as Record<string, Express.Multer.File[]> | undefined
        const avatarFile = files?.avatar?.[0]

        if (!avatarFile) throw emptyUserDataException

        const newAvatarUrl = await uploadAvatar(id, avatarFile)

        res.json({
            url: newAvatarUrl,
        })
    })
)

adminArtistRouter.patch('/update_avatar_path/:id', getAdmin(), asyncHandler(async (req: Request, res: Response) => {
    const {id} = idSchema.parse(req.params)
    const {path} = pathSchema.parse(req.body)

    const newUrl = await updateAvatarPath(id, path)

    res.json({
        url: newUrl.avatarUrl,
    })
}))

adminArtistRouter.patch('/delete_avatar/:id', getAdmin(), asyncHandler(async (req: Request, res: Response) => {
    const {id} = idSchema.parse(req.params)

    await deleteAvatar(id, modelMap.artist, artistException)

    successResponse(res)
}))