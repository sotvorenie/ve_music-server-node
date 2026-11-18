import {imageSizeFromFile} from "image-size/fromFile";

export const getImageSize = async (
    imagePath: string,
) => {
    const sizes = await imageSizeFromFile(imagePath)

    return {
        width: sizes.width,
        height: sizes.height,
    }
}