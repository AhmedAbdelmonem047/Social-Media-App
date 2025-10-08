import { Model } from "mongoose";
import { DbRepository } from "./db.repository";
import { IRevokeToken } from "../DB/models/revokeToken.model";

export class RevokeTokenRepository extends DbRepository<IRevokeToken> {
    constructor(protected readonly model: Model<IRevokeToken>) {
        super(model);
    }
}
