import { Router } from 'express';
import { createAccount, getCurrentUser, loginUser, sendOTP } from '../controllers/userController';

const router = Router();

router.post("/register", createAccount);
router.get('/currentUser/:accountId', getCurrentUser);
router.post('/login', loginUser);
router.post('/sendOTP', sendOTP);

export default router;
