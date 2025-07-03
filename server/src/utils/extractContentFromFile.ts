import fs from "fs/promises";
import pdfParse from "pdf-parse";
import mammoth from "mammoth";
import Tesseract from "tesseract.js";

export const extractTextFromFile = async (filePath: string, mimetype: string, ext: string): Promise<string> => {
    if (mimetype === "application/pdf") {
        const data = await fs.readFile(filePath);
        const pdfData = await pdfParse(data);
        return pdfData.text;
    }
    if (
        mimetype === "application/vnd.openxmlformats-officedocument.wordprocessingml.document" ||
        filePath.endsWith(".docx")
    ) {
        const data = await fs.readFile(filePath);
        const { value } = await mammoth.extractRawText({ buffer: data });
        return value;
    }

    if (
        mimetype.startsWith("image/") ||
        (mimetype === "application/octet-stream" && ["jpg", "jpeg", "png", "webp", "svg"].includes(ext || ""))
    ) {
        const { data: { text } } = await Tesseract.recognize(filePath, "eng");
        return text;
    }

    if (mimetype === "text/plain" || filePath.endsWith(".txt")) {
        return await fs.readFile(filePath, "utf-8");
    }

    throw new Error("Unsupported file type");
};