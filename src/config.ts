import path from "node:path";

export const BASE_STORAGE_DIR = path.resolve(process.env.BASE_STORAGE_DIR as string)
export const TEMPORARY_DIRECTORY = path.join(BASE_STORAGE_DIR, 'temporary')

export const AVATARS_DIRECTORY = path.join(BASE_STORAGE_DIR, 'users_avatars')
export const ARTISTS_AVATARS_DIRECTORY = path.join(BASE_STORAGE_DIR, 'artists_avatars')

export const MUSIC_DIRECTORY = path.join(BASE_STORAGE_DIR, 'music')
export const TRACKS_DIRECTORY = path.join(MUSIC_DIRECTORY, 'music')
export const PREVIEWS_DIRECTORY = path.join(MUSIC_DIRECTORY, 'previews')
export const VIDEOS_DIRECTORY = path.join(MUSIC_DIRECTORY, 'videos')
export const BACKUP_PREVIEWS_DIRECTORY = path.join(MUSIC_DIRECTORY, 'backup_previews')

export const ALLOWED_MUSIC_SUFFIX = new Set(['.mp3', '.wav'])
export const ALLOWED_VIDEO_SUFFIX = new Set(['.mp4', '.mkv', '.avi', '.mov'])
export const ALLOWED_PHOTO_SUFFIX = new Set(['.jpg', '.jpeg', '.png', '.webp', '.gif'])

export const segmentTime: number = 6