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
}

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
        type: [String]
        , default: []
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