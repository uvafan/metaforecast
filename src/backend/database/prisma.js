"use strict";
exports.__esModule = true;
exports.prisma = void 0;
var client_1 = require("@prisma/client");
exports.prisma = global._prisma ||
    new client_1.PrismaClient({
        log: ["query"]
    });
if (process.env.NODE_ENV !== "production")
    global._prisma = exports.prisma;
