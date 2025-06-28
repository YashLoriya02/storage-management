import { Request, Response } from 'express';
import User from '../models/User';
import { v4 as uuidv4 } from 'uuid';
import jwt from 'jsonwebtoken';
import nodemailer from "nodemailer"

export const createAccount = async (req: Request<{}, {}, {
    fullName: string,
    email: string,
    avatar: string
}>, res: Response) => {
    try {
        const { fullName, email, avatar } = req.body;

        const userExist = await User.findOne({ email })
        if (userExist) {
            res.status(400).json({ error: "User with the same email already exists!" });
            return
        }

        const accountId = uuidv4()

        const newUser = new User({
            fullName,
            email,
            avatar,
            accountId
        });

        const user = await newUser.save();
        res.status(201).json(user);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
};

export const getCurrentUser = async (req: Request<{ accountId: string }, {}, {}>, res: Response) => {
    try {
        const { accountId } = req.params;

        if (!accountId) {
            res.status(400).json({ error: 'Missing or invalid accountId' });
            return
        }

        const user = await User.findById(accountId);
        if (!user) {
            res.status(404).json({ error: 'User not found' });
            return
        }

        res.status(200).json(user);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
};

export const sendOTP = async (req: Request<{}, {}, { email: string }>, res: Response) => {
    try {
        const { email } = req.body;
        if (!email) {
            res.status(400).json({ error: 'Email is required' });
            return
        }

        const otp = Math.floor(100000 + Math.random() * 900000).toString();
        await User.findOneAndUpdate(
            { email },
            { otp },
            { new: true, upsert: true, setDefaultsOnInsert: true }
        );

        const transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
                user: process.env.EMAIL_FROM,
                pass: process.env.EMAIL_PASSWORD,
            },
        });

        const mailOptions = {
            from: `StoreIt <${process.env.EMAIL_FROM}>`,
            to: email,
            subject: 'Account Verification OTP - StoreIt',
            html: `
<div style="font-family: Arial, sans-serif; background-color: #ffffff; padding: 5px 30px; border-radius: 10px; max-width: 520px; margin: auto; box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);">
          <h2 style="text-align: center; color: #EA6365; margin-bottom: 20px;">🔐 OTP Verification</h2>
          <p style="font-size: 16px; color: #444;">Hi there,</p>
          <p style="font-size: 16px; color: #444;">We received a login request for your StoreIt account.</p>
          <p style="font-size: 16px; color: #444;">Please enter the following One-Time Password (OTP) to proceed:</p>
          <div style="font-size: 36px; font-weight: bold; color: #EA6365; text-align: center; margin: 20px 0; letter-spacing: 6px;">${otp}</div>
          <p style="font-size: 14px; color: #666; text-align: center; padding:0 50px">This OTP will expire in 10 minutes. If you did not initiate this request, you can safely ignore this message.</p>
          <hr style="margin: 20px 0; border: none; border-top: 1px solid #eee;">
          <p style="font-size: 14px; color: #999; text-align: center;">
            Thank you for choosing <strong>StoreIt</strong>.<br>
            Secure. Simple. Reliable.
          </p>
          <p style="font-size: 13px; color: #ccc; text-align: center; margin-top: 20px;">&copy; ${new Date().getFullYear()} StoreIt. All rights reserved.</p>
        </div>
        </div>
      `,
        };

        await transporter.sendMail(mailOptions);
        res.status(200).json({ message: 'OTP sent successfully' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to send OTP' });
    }
};

export const getUserByEmail = async (req: Request<{}, {}, { email: string }>, res: Response) => {
    try {
        const { email } = req.body;

        if (!email) {
            res.status(400).json({ error: 'Email is required' });
            return
        }

        const user = await User.findOne({ email });
        if (!user) {
            res.status(401).json({ error: 'User not found' });
            return
        }

        res.status(200).json({ accountId: user.accountId });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
};

export const loginUser = async (req: Request<{}, {}, { accountId: string, otp: string }>, res: Response) => {
    try {
        const { accountId, otp } = req.body;

        if (!accountId || !otp) {
            res.status(400).json({ error: 'Email and OTP are required' });
            return
        }

        const user = await User.findOne({ accountId });
        if (!user || user.otp !== otp) {
            res.status(401).json({ error: 'Invalid email or OTP' });
            return
        }

        user.otp = ""
        await user.save()

        const token = jwt.sign(
            { accountId: user.accountId, email: user.email },
            process.env.JWT_SECRET || 'SECRET_123',
            { expiresIn: '30d' }
        );

        res.status(200).json({ token, accountId: user.accountId, $id: user._id });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
};