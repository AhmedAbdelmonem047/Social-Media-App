import mongoose, { Types } from "mongoose";

export enum GenderType {
    male = "male",
    female = "female"
}

export enum RoleType {
    user = "user",
    admin = "admin"
}

export enum FlagType {
    all = "all",
    current = "current"
}

export enum ProviderType {
    system = "system",
    google = "google"
}


export interface IUser {
    _id: Types.ObjectId,
    fName: string,
    lName: string,
    userName: string,
    email: string,
    password: string,
    age: number,
    image?: string,
    phone?: string,
    address?: string,
    gender: GenderType,
    provider: ProviderType,
    role?: RoleType,
    otp?: string,
    deletedAt?: Date,
    deletedBy?: Types.ObjectId,
    restoredAt?: Date,
    restoredBy?: Types.ObjectId,
    isConfirmed?: boolean,
    changeCredentials?: Date,
    profileImage?: string,
    tempProfileImage?: string,
    friends: Types.ObjectId[],
    blockedUsers: Types.ObjectId[],
    createdAt: Date,
    updatedAt: Date
}

export const userSchema = new mongoose.Schema<IUser>({
    fName: { type: String, required: true, minLength: 2, trim: true },
    lName: { type: String, required: true, minLength: 2, trim: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: function () { return this.provider === ProviderType.google ? false : true } },
    age: { type: Number, min: 18, max: 65, required: function () { return this.provider === ProviderType.google ? false : true } },
    phone: { type: String },
    address: { type: String },
    profileImage: { type: String },
    tempProfileImage: { type: String },
    gender: { type: String, enum: GenderType, required: function () { return this.provider === ProviderType.google ? false : true } },
    role: { type: String, enum: RoleType, default: RoleType.user },
    provider: { type: String, enum: ProviderType, default: ProviderType.system },
    image: { type: String },
    otp: { type: String },
    deletedAt: { type: Date },
    deletedBy: { type: Types.ObjectId, ref: "User" },
    restoredAt: { type: Date },
    restoredBy: { type: Types.ObjectId, ref: "User" },
    isConfirmed: { type: Boolean },
    friends: [{ type: Types.ObjectId, ref: "User" }],
    blockedUsers: [{ type: Types.ObjectId, ref: "User" }],
    changeCredentials: { type: Date },
}, {
    timestamps: true,
    toObject: { virtuals: true },
    toJSON: { virtuals: true }
})

userSchema.virtual("userName").set(function (val) {
    const [fName, lName] = val.split(" ");
    this.set({ fName, lName });
}).get(function () {
    return this.fName + " " + this.lName;
})

const userModel = mongoose.models.User || mongoose.model<IUser>("User", userSchema);

export default userModel;