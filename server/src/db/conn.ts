import mongoose from "mongoose";
import dotenv from "dotenv";
dotenv.config();

const uri: string = process.env.MONGO_URI ?? "";

const connectDB = async (): Promise<void> => {
    try {
        await mongoose.connect(uri);
        console.log('Connected to MongoDB successfully');
    } catch (error) {
        console.error('Error connecting to MongoDB:', error);
        process.exit(1);
    }
};

export default connectDB