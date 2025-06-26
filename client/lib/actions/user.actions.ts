"use server";

import { avatarPlaceholderUrl } from "@/constants";
import { createSessionClient } from "@/lib/appwrite";
import { parseStringify } from "@/lib/utils";

const handleError = (error: unknown, message: string) => {
  console.log(error, message);
  throw error;
};

const getUserByEmail = async (email: string) => {
  try {
    const response = await fetch('http://localhost:5000/api/users/getUserByEmail', {
      method: "POST",
      headers: {
        'Content-type': 'application/json'
      },
      body: JSON.stringify({ email })
    })

    const data = await response.json()

    if (response.ok) {
      return data.accountId
    }

    return null
  } catch (error) {
    handleError(error, "Failed to send email OTP");
    return null
  }
};

export const sendEmailOTP = async ({ email }: { email: string }) => {
  try {
    await fetch('http://localhost:5000/api/users/sendOTP', {
      method: "POST",
      headers: {
        'Content-type': 'application/json'
      },
      body: JSON.stringify({ email })
    })
  } catch (error) {
    handleError(error, "Failed to send email OTP");
  }
};

export const createAccount = async ({
  fullName,
  email,
}: {
  fullName: string;
  email: string;
}) => {
  const existingUser = await getUserByEmail(email);

  if (!existingUser) {
    try {
      const res = await fetch('http://localhost:5000/api/users/register', {
        method: "POST",
        headers: {
          'Content-type': 'application/json'
        },
        body: JSON.stringify({
          fullName, email, avatar: avatarPlaceholderUrl
        })
      })

      const data = await res.json()

      if (res.ok) {
        await sendEmailOTP({ email })
        return data.accountId
      }
    } catch (error) {
      console.log(error)
    }
  }
};

export const verifySecret = async ({
  accountId,
  otp
}: {
  accountId: string;
  otp: string;
}) => {
  try {
    const res = await fetch('http://localhost:5000/api/users/login', {
      method: "POST",
      headers: {
        'Content-type': 'application/json'
      },
      body: JSON.stringify({ accountId, otp })
    })

    const session = await res.json()
    if (res.ok) {
      return { sessionId: session.$id, token: session.token };
    }
  } catch (error) {
    handleError(error, "Failed to verify OTP");
  }
};

export const getCurrentUser = async () => {
  try {
    const { session_id } = await createSessionClient()
    if (!session_id || session_id === "") {
      return null
    }

    const res = await fetch(`http://localhost:5000/api/users/currentUser/${session_id}`)

    if (res.ok) {
      const data = await res.json()
      return data
    }
  } catch (error) {
    console.log(error);
  }
};

export const signInUser = async ({ email }: { email: string }) => {
  try {
    const existingUser = await getUserByEmail(email);

    if (existingUser) {
      await sendEmailOTP({ email });
      return existingUser
    }

    return parseStringify({ accountId: null, error: "User not found" });
  } catch (error) {
    handleError(error, "Failed to sign in user");
  }
};
