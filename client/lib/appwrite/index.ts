"use server";

import { Account, Avatars, Client, Databases, Storage } from "node-appwrite";
import { appwriteConfig } from "@/lib/appwrite/config";
import { cookies } from "next/headers";

export const createSessionClient = async () => {
  const client = new Client()
    .setEndpoint(appwriteConfig.endpointUrl)
    .setProject(appwriteConfig.projectId);

  const session = (await cookies()).get("session_id");
  // const session = localStorage.getItem('session_id')
  if (!session) throw new Error("No session");

  // client.setSession(session.value);

  // return {
  //   get account() {
  //     return new Account(client);
  //   },
  //   get databases() {
  //     return new Databases(client);
  //   },
  // };

  return {
    session_id: session.value
  }
};

export const createAdminClient = async () => {
  const client = new Client()
    .setEndpoint(appwriteConfig.endpointUrl)
    .setProject(appwriteConfig.projectId)
    .setKey(appwriteConfig.secretKey);

  return {
    get account() {
      return new Account(client);
    },
    get databases() {
      return new Databases(client);
    },
    get storage() {
      return new Storage(client);
    },
    get avatars() {
      return new Avatars(client);
    },
  };
};
