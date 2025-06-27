"use server";

import { getCurrentUser } from "@/lib/actions/user.actions";
import { createAdminClient } from "@/lib/appwrite";
import { appwriteConfig } from "@/lib/appwrite/config";
import { constructFileUrl, getFileType, parseStringify } from "@/lib/utils";
import { revalidatePath } from "next/cache";
import { ID, Query } from "node-appwrite";
import { InputFile } from "node-appwrite/file";

const handleError = (error: unknown, message: string) => {
  console.log(error, message);
  throw error;
};

export const uploadFile = async ({
  file,
  ownerId,
  accountId,
  path,
}: UploadFileProps) => {
  const { storage } = await createAdminClient();

  try {
    const inputFile = InputFile.fromBuffer(file, file.name);

    const bucketFile = await storage.createFile(
      appwriteConfig.bucketId,
      ID.unique(),
      inputFile,
    );

    const fileDocument = {
      type: getFileType(bucketFile.name).type,
      name: bucketFile.name,
      url: constructFileUrl(bucketFile.$id),
      extension: getFileType(bucketFile.name).extension,
      size: bucketFile.sizeOriginal,
      owner: ownerId,
      accountId,
      users: [],
      bucketFileId: bucketFile.$id,
      bucketId: bucketFile.bucketId,
    };

    const res = await fetch('http://localhost:5000/api/files/addFiles', {
      method: "POST",
      headers: {
        'Content-Type': "application/json"
      },
      body: JSON.stringify(fileDocument)
    })

    if (res.ok) {
      revalidatePath(path);
      return parseStringify({ success: true });
    }
    else {
      revalidatePath(path);
      return null
    }
  } catch (error) {
    handleError(error, "Failed to upload file");
  }
};

export const getFiles = async ({
  types = [],
  searchText = "",
  sort = "$createdAt-desc",
  limit
}: GetFilesProps) => {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser) throw new Error("User not found");

    const res = await fetch(`http://localhost:5000/api/files/getFiles?ownerId=${currentUser._id}&types=${types}&sort=${sort}&limit=${limit}&searchText=${searchText}&email=${currentUser.email}`)

    if (res.ok) {
      const files = await res.json()
      return files
    }

    return parseStringify([]);
  } catch (error) {
    handleError(error, "Failed to get files");
  }
};

export const renameFile = async ({
  fileId,
  name,
  path,
}: RenameFileProps) => {
  try {

    const res = await fetch('http://localhost:5000/api/files/renameFile', {
      method: "POST",
      headers: {
        'Content-Type': "application/json"
      },
      body: JSON.stringify({ bucketFileId: fileId, name })
    })

    if (res.ok) {
      const data = await res.json()

      revalidatePath(path);
      return parseStringify({ updatedFile: data.updatedFile });
    }
  } catch (error) {
    handleError(error, "Failed to rename file");
  }
};

export const updateFileUsers = async ({
  fileId,
  emails,
  path,
}: UpdateFileUsersProps) => {
  try {
    const res = await fetch('http://localhost:5000/api/files/shareFile', {
      method: "POST",
      headers: {
        'Content-Type': "application/json"
      },
      body: JSON.stringify({ bucketFileId: fileId, users: emails })
    })

    const data = await res.json()
    console.log(data)

    if (res.ok) {
      revalidatePath(path);
      return parseStringify(data.updatedFile);
    }
  } catch (error) {
    handleError(error, "Failed to rename file");
  }
};

export const deleteFile = async ({
  bucketFileId,
  path,
}: DeleteFileProps) => {
  const { storage } = await createAdminClient();

  try {
    const res = await fetch('http://localhost:5000/api/files/deleteFile', {
      method: "POST",
      headers: {
        'Content-Type': "application/json"
      },
      body: JSON.stringify({ bucketFileId })
    })

    if (res.ok) {
      await storage.deleteFile(appwriteConfig.bucketId, bucketFileId);

      revalidatePath(path);
      return parseStringify({ status: "success" });
    }


  } catch (error) {
    handleError(error, "Failed to rename file");
  }
};

export async function getTotalSpaceUsed() {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser) throw new Error("User is not authenticated.");

    const res = await fetch(`http://localhost:5000/api/files/getFiles?ownerId=${currentUser._id}`)

    if (res.ok) {
      const files = await res.json()
      const totalSpace = {
        image: { size: 0, latestDate: "" },
        document: { size: 0, latestDate: "" },
        video: { size: 0, latestDate: "" },
        audio: { size: 0, latestDate: "" },
        other: { size: 0, latestDate: "" },
        used: 0,
        all: 2 * 1024 * 1024 * 1024
      };

      files.forEach((file: any) => {
        const fileType = file.type as FileType;
        totalSpace[fileType].size += file.size;
        totalSpace.used += file.size;

        if (
          !totalSpace[fileType].latestDate ||
          new Date(file.updatedAt) > new Date(totalSpace[fileType].latestDate)
        ) {
          totalSpace[fileType].latestDate = file.updatedAt;
        }
      });

      return parseStringify(totalSpace);
    }
  } catch (error) {
    handleError(error, "Error calculating total space used:, ");
  }
}
