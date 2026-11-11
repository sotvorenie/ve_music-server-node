import {passwordSchema} from "@schemas/passwordSchema.js";
import {loginSchema} from "@schemas/loginSchema.js";

export const authBaseSchema = passwordSchema.extend(loginSchema.shape)