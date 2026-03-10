"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.avatarUploadInterceptor = void 0;
const platform_express_1 = require("@nestjs/platform-express");
const multer_1 = require("multer");
const path_1 = require("path");
exports.avatarUploadInterceptor = (0, platform_express_1.FileInterceptor)('avatar', {
    storage: (0, multer_1.diskStorage)({
        destination: 'uploads/avatars',
        filename: (req, file, cb) => {
            const unique = Date.now() + '-' + Math.round(Math.random() * 1e9);
            cb(null, unique + (0, path_1.extname)(file.originalname));
        },
    }),
    limits: { fileSize: 2 * 1024 * 1024 },
    fileFilter: (req, file, cb) => {
        if (!file.mimetype.startsWith('image/')) {
            return cb(null, false);
        }
        cb(null, true);
    },
});
//# sourceMappingURL=avatar-upload.interceptor.js.map