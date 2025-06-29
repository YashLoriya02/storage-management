'use client'

import React from "react";
import { Button } from "@/components/ui/button";
import Image from "next/image";
import Search from "@/components/Search";
import FileUploader from "@/components/FileUploader";
import Cookies from "js-cookie";
import { useRouter } from "next/navigation";

const Header = ({
  userId,
  accountId,
}: {
  userId: string;
  accountId: string;
}) => {
  const router = useRouter()

  return (
    <header className="header">
      <Search />
      <div className="header-wrapper">
        <FileUploader ownerId={userId} accountId={accountId} />
        <form>
          <Button
            onClick={() => {
              Cookies.remove('session_id')
              Cookies.remove('token')
              router.push('/')
            }}
            type="submit"
            className="sign-out-button"
          >
            <Image
              src="/assets/icons/logout.svg"
              alt="logo"
              width={24}
              height={24}
              className="w-6"
            />
          </Button>
        </form>
      </div>
    </header>
  );
};
export default Header;
