import { Request, Response } from 'express';
import File from '../models/File';
import mongoose from 'mongoose';
import { UUID } from 'crypto';

interface AddFileForm {
    type: string,
    name: string,
    url: string,
    extension: string,
    size: string,
    owner: mongoose.Types.ObjectId,
    accountId: UUID,
    users: Array<any>,
    bucketFileId: string
}

export const addFiles = async (req: Request<{}, {}, AddFileForm>, res: Response) => {
    try {
        const { type, name, url, extension, size, owner, accountId, users, bucketFileId } = req.body;

        const fileDoc = new File({
            type,
            name,
            url,
            extension,
            size: size,
            owner,
            accountId,
            users: users || [],
            bucketFileId,
        });

        await fileDoc.save();
        res.status(201).json({ message: 'File added successfully', file: fileDoc });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to add file' });
    }
};

export const getFiles = async (req: Request, res: Response) => {
    try {
        const { types = [], searchText = '', sort = 'createdAt-desc', limit, email, ownerId } = req.query as any;

        const query: any = {
            $or: [
                { owner: ownerId },
                { users: { $in: [email] } },
            ]
        };

        if (types && types.length > 0) {
            query.type = { $in: Array.isArray(types) ? types : [types] };
        }

        if (searchText) {
            query.name = { $regex: searchText, $options: 'i' };
        }

        const sortObj: any = {};
        if (sort) {
            const [sortBy, orderBy] = sort.split('-');
            sortObj[sortBy === '$createdAt' ? 'createdAt' : sortBy] = orderBy === 'asc' ? 1 : -1;
        }

        const files = await File.find(query)
            .sort(sortObj)
            .limit(limit ? parseInt(limit) : 0);

        res.status(200).json(files);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to fetch files' });
    }
};

export const deleteFile = async (req: Request, res: Response) => {
    try {
        const { bucketFileId } = req.body;
        if (!bucketFileId) {
            res.status(404).json({ message: 'Necessary data not passed' });
            return
        }

        await File.findOneAndDelete({ bucketFileId });
        res.status(200).json({ message: 'File deleted successfully' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to delete file' });
    }
};

export const shareFile = async (req: Request, res: Response) => {
    try {
        const { bucketFileId, users } = req.body;

        if (!bucketFileId || !users || users.length === 0) {
            res.status(404).json({ message: 'Necessary data not passed' });
            return
        }

        const updatedFile = await File.findOneAndUpdate(
            { bucketFileId },
            { $addToSet: { users: { $each: users } } },
            { new: true }
        );
        res.status(200).json({ message: 'File shared', file: updatedFile });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to share file' });
    }
};

export const renameFile = async (req: Request, res: Response) => {
    try {
        const { bucketFileId, name } = req.body;

        if (!bucketFileId || !name) {
            res.status(404).json({ message: 'File not found' });
            return
        }

        const updatedFile = await File.findOneAndUpdate(
            { bucketFileId },
            { name },
            { new: true }
        );

        res.status(200).json({ message: 'File renamed', file: updatedFile });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to rename file' });
    }
};