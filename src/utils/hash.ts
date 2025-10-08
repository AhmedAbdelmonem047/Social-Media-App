import { compare, hash } from "bcrypt"

export const Hash = async (plaintext: string, saltRounds: number = Number(process.env.SALT_ROUNDS)) => {
    return hash(plaintext, saltRounds);
}

export const Compare = async (plaintext: string, cipherText: string) => {
    return compare(plaintext, cipherText);
}