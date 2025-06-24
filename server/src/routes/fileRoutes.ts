import { Router } from 'express';
import { addFiles, getFiles, deleteFile, shareFile, renameFile } from '../controllers/fileController';

const router = Router();

router.post("/addFiles", addFiles);
router.get('/getFiles', getFiles);
router.post('/deleteFile', deleteFile);
router.post('/shareFile', shareFile);
router.post('/renameFile', renameFile);

export default router;
