import { Router } from 'express';
import { addFiles, getFiles, deleteFile, shareFile, renameFile, fileShareAccessEmail, generateKeywords, addCustomKeywords } from '../controllers/fileController';
import multer from 'multer';

const router = Router();

const upload = multer({ dest: "src/uploads/" });

router.post("/addFiles", addFiles);
router.get('/getFiles', getFiles);
router.post('/deleteFile', deleteFile);
router.post('/shareFile', shareFile);
router.post('/renameFile', renameFile);
router.post('/generateKeywords', upload.single("file"), generateKeywords);
router.post('/fileShareAccessEmail', fileShareAccessEmail);
router.post('/addCustomKeywords', addCustomKeywords);

export default router;
