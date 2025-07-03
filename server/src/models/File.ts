import mongoose, { Document, Schema } from 'mongoose';

export interface IFile extends Document {
    type: string;
    name: string;
    url: string;
    extension: string;
    size: number;
    owner: mongoose.Types.ObjectId;
    accountId: string;
    users: string[];
    bucketFileId: string;
    bucketId: string;
    keywords: string[];
}

const FileUserSchema = new Schema(
    {
        email: {
            type: String,
            required: true
        },
        accessType: {
            type: String,
            enum: ['r', 'wr', 'wrs', 'all'],
            required: true
        }
    },
    { timestamps: true }
);

const FileSchema: Schema = new Schema({
    type: {
        type: String,
        required: true
    },
    name: {
        type: String,
        required: true
    },
    url: {
        type: String,
        required: true
    },
    extension: {
        type: String,
        required: true
    },
    keywords: {
        type: [String],
        default: []
    },
    size: {
        type: Number,
        required: true
    },
    owner: {
        type: Schema.Types.ObjectId,
        ref: 'users',
        required: true
    },
    accountId: {
        type: String,
        required: true
    },
    users: {
        type: [FileUserSchema],
        default: []
    },
    bucketFileId: {
        type: String,
        required: true
    },
    bucketId: {
        type: String,
        required: true
    },
},
    {
        timestamps: true
    }
);

const File = mongoose.model<IFile>('files', FileSchema);

export default File