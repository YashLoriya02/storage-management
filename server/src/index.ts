import express from 'express';
import dotenv from 'dotenv';
import userRoutes from './routes/userRoutes';
import fileRoutes from './routes/fileRoutes';
import connectDB from './db/conn';
import cors from 'cors';
dotenv.config();

const app = express();

app.use(cors());
app.use(express.json());
app.use('/api/users', userRoutes);
app.use('/api/files', fileRoutes);

connectDB()

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server Running on Port ${PORT}`);
});
