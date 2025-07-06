import { Request, Response } from 'express';
import File from '../models/File';
import mongoose from 'mongoose';
import { UUID } from 'crypto';
import fs from 'fs/promises';
import User from '../models/User';
import nodemailer from 'nodemailer';
import { extractTextFromFile } from '../utils/extractContentFromFile';
import { extractKeywordsFromText } from '../utils/llmKeywordsExtraction';

interface AddFileForm {
    type: string,
    name: string,
    url: string,
    extension: string,
    size: string,
    owner: mongoose.Types.ObjectId,
    accountId: UUID,
    users: Array<any>,
    bucketFileId: string,
    bucketId: string
}

export const addFiles = async (req: Request<{}, {}, AddFileForm>, res: Response) => {
    try {
        const { type, name, url, extension, size, owner, accountId, users, bucketFileId, bucketId } = req.body;

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
            bucketId,
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
        let { types = [], searchText = '', sort = 'createdAt-desc', limit, email, ownerId } = req.query as any;

        types = typeof types === 'string' && types.includes(',') ? types.split(',') : types;

        const accessOr = [
            { owner: ownerId },
            { "users.email": email }
        ];

        let searchOr: any[] = [];
        if (searchText) {
            searchOr = [
                { name: { $regex: searchText, $options: 'i' } },
                { keywords: { $elemMatch: { $regex: searchText, $options: 'i' } } }
            ];
        }

        let finalQuery: any = {};
        if (searchText) {
            finalQuery = {
                $and: [
                    { $or: accessOr },
                    { $or: searchOr }
                ]
            };
        } else {
            finalQuery = { $or: accessOr };
        }

        if (types && types.length > 0) {
            finalQuery.type = { $in: Array.isArray(types) ? types : [types] };
        }

        const sortObj: any = {};
        if (sort) {
            const [sortBy, orderBy] = sort.split('-');
            sortObj[sortBy === '$createdAt' ? 'createdAt' : sortBy] = orderBy === 'asc' ? 1 : -1;
        }

        const files = await File.find(finalQuery)
            .populate({
                path: 'owner',
                select: 'fullName',
            })
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
        const { bucketFileId, users, isRemove } = req.body;

        if (!bucketFileId || !users) {
            res.status(404).json({ message: 'Necessary data not passed' });
            return
        }

        if (isRemove) {
            const updatedFile = await File.findOneAndUpdate(
                { _id: bucketFileId },
                { $set: { users } },
                { new: true }
            );

            res.status(200).json({ message: 'File share list updated', updatedFile });
            return
        }

        const updatedFile = await File.findOneAndUpdate(
            { _id: bucketFileId },
            { $addToSet: { users: { $each: users } } },
            { new: true }
        );

        res.status(200).json({ message: 'File shared', updatedFile });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to share file' });
    }
};

export const renameFile = async (req: Request, res: Response) => {
    try {
        const { bucketFileId, name } = req.body
        if (!bucketFileId || !name) {
            res.status(404).json({ message: 'File not found' });
            return
        }

        const updatedFile = await File.findOneAndUpdate(
            { _id: bucketFileId },
            { name },
            { new: true }
        );

        res.status(200).json({ message: 'File renamed', updatedFile });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to rename file' });
    }
};

export const addCustomKeywords = async (req: Request, res: Response) => {
    try {
        const { bucketFileId, keywords } = req.body
        if (!bucketFileId || !keywords || keywords.length === 0) {
            res.status(404).json({ message: 'Necessary fields not passed.' });
            return
        }

        const updatedFile = await File.findByIdAndUpdate(
            bucketFileId,
            { $addToSet: { keywords: { $each: keywords } } },
            { new: true }
        );

        res.status(200).json({ message: 'Keywords added successfully', updatedFile });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to save custom keywords file' });
    }
};

export const fileShareAccessEmail = async (
    req: Request<{}, {}, { owner: any; email: string; accessType: string; url: string; name: string }>,
    res: Response
) => {
    try {
        const { owner, email, url, name, accessType } = req.body;

        if (!owner || !email || !url || !name) {
            res.status(400).json({ error: 'owner, email, url, and name are required' });
            return
        }

        const [user, fileResponse] = await Promise.all(
            [
                User.findOne({ email }),
                fetch(url)
            ]
        );

        const arrayBuffer = await fileResponse.arrayBuffer();
        const fileBuffer = Buffer.from(arrayBuffer);

        const transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
                user: process.env.EMAIL_FROM,
                pass: process.env.EMAIL_PASSWORD,
            },
        });

        const mailOptions = {
            from: `StoreIt <${process.env.EMAIL_FROM}>`,
            to: user?.email ?? email,
            subject: `📁 ${name} - File Access Granted by ${owner.fullName}`,
            html: `
        <div style="font-family: Arial, sans-serif; background-color: #ffffff; padding: 20px 30px; border-radius: 10px; max-width: 600px; margin: auto; box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);">
          <h2 style="text-align: center; color: #4CAF50;">✅ File Access Granted</h2>
          <p>Hi ${user?.fullName || 'there'},</p>
          <p><strong>${owner.fullName}</strong> has shared a file with you on <strong>StoreIt</strong>.</p>
          <p><strong>File Name:</strong> ${name}</p>
          <p>You can open the file using this link: <a href="${url}" target="_blank">${url}</a></p>
          <p>The file is also attached to this email for your convenience.</p>
          <p>
            If you don't recognize this request, you can safely ignore this email.
          </p>
          <hr style="margin: 20px 0; border: none; border-top: 1px solid #eee;">
          <p style="font-size: 14px; color: #999; text-align: center;">
            Thanks for using <strong>StoreIt</strong>!<br>
            Secure. Simple. Reliable.
          </p>
          <p style="font-size: 12px; color: #ccc; text-align: center; margin-top: 20px;">
            &copy; 2025 StoreIt. All rights reserved.
          </p>
        </div>
      `,
            attachments: [
                {
                    filename: name,
                    content: fileBuffer,
                },
            ],
        };

        await transporter.sendMail(mailOptions);
        res.status(200).json({ message: 'File share access email sent with attachment' });
    } catch (error) {
        console.error('Email Sending Error:', error);
        res.status(500).json({ error: 'Failed to send file access email with attachment' });
        return
    }
};

export const generateKeywords = async (
    req: Request<{}, {}, { fileId: string }>,
    res: Response
) => {
    if (!req.file) {
        res.status(400).json({ error: "No file uploaded" });
        return
    }

    const file = req.file;
    const { fileId } = req.body;
    const filePath = file.path;

    try {
        const ext = file.originalname.split('.').pop()?.toLowerCase();

        const text = await extractTextFromFile(filePath, file.mimetype, ext ?? "");
        if (!text.trim()) {
            await fs.unlink(filePath).catch(() => { });
            res.status(400).json({ message: "Text not found", keywords: [] });
            return
        }

        const keywords = await extractKeywordsFromText(text, 20, file.filename);

        const [_, __] = await Promise.all([
            fs.unlink(filePath),
            File.findByIdAndUpdate(fileId, { keywords })
        ])

        res.status(200).json({ keywords });
    } catch (error) {
        console.error("Keyword Extraction Error:", error);
        await fs.unlink(filePath).catch(() => { });
        res.status(500).json({ error: "Failed to extract keywords" });
    }
};