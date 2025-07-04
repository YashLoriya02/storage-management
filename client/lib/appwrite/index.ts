"use server";

import { Account, Avatars, Client, Databases, Storage } from "node-appwrite";
import { appwriteConfig } from "@/lib/appwrite/config";
import { cookies } from "next/headers";

export const createSessionClient = async () => {
  const session = (await cookies()).get("session_id");
  const token = (await cookies()).get("token");

  if (!session) throw new Error("No session");
  if (!token) throw new Error("No Token");

  return {
    session_id: session.value,
    token: token.value,
  }
};

export const createAdminClient = async () => {
  const client = new Client()
    .setEndpoint(appwriteConfig.endpointUrl)
    .setProject(appwriteConfig.projectId)
    .setKey(appwriteConfig.secretKey);

  return {
    get storage() {
      return new Storage(client);
    }
  };
};
