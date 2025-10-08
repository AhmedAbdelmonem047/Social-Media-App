"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Compare = exports.Hash = void 0;
const bcrypt_1 = require("bcrypt");
const Hash = async (plaintext, saltRounds = Number(process.env.SALT_ROUNDS)) => {
    return (0, bcrypt_1.hash)(plaintext, saltRounds);
};
exports.Hash = Hash;
const Compare = async (plaintext, cipherText) => {
    return (0, bcrypt_1.compare)(plaintext, cipherText);
};
exports.Compare = Compare;
