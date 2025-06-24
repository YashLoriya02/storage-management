import mongoose, { Document, Schema } from 'mongoose';

export interface IUser extends Document {
    fullName: string;
    email: string;
    accountId: string;
    avatar?: string;
    otp?: string;
}

const UserSchema: Schema = new Schema(
    {
        fullName: {
            type: String,
            required: true
        },
        email: {
            type: String,
            required: true,
            unique: true
        },
        accountId: {
            type: String,
            required: true
        },
        avatar: {
            type: String,
            default: ''
        },
        otp: {
            type: String,
        },
    },
    { timestamps: true }
);

const User = mongoose.model<IUser>('users', UserSchema);

export default User