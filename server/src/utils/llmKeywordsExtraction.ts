import { GoogleGenerativeAI } from "@google/generative-ai"
import dotenv from "dotenv"
dotenv.config()

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY as string);

export const extractKeywordsFromText = async (text: string, n = 20, fileName = ""): Promise<string[]> => {
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });
    const prompt = `
You are an expert AI document tagger for a file storage platform.
You will be provided with a document's content and its file name.

1. First, infer the document type (such as resume, invoice, receipt, research paper, presentation, etc.) based on BOTH the file name and the document content.
2. If the file name contains a meaningful type (e.g., "resume", "invoice", etc.), include this type as a keyword ONLY if it truly matches the document's actual content.
3. Otherwise, ignore generic file names and do not include them as keywords.
4. Extract the top ${n} most relevant, specific, and information-rich keywords or short phrases (comma separated, lowercase, no duplicates) that best describe the document.
5. Prioritize unique concepts, entities, topics, technical terms, locations, people, dates, organizations, or project names found in the document.

Document File Name: ${fileName}

Document Content:
"""
${text}
"""

Return ONLY the keywords, comma-separated, no numbering, no extra text.
    `
    const result = await model.generateContent(prompt);
    const response = result.response.text().trim();
    return response.split(",").map((k) => k.trim()).filter(Boolean);
};

