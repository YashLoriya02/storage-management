// "use client"

// import React, { useEffect, useState } from "react";
// import Sidebar from "@/components/Sidebar";
// import MobileNavigation from "@/components/MobileNavigation";
// import Header from "@/components/Header";
// import { getCurrentUser } from "@/lib/actions/user.actions";
// import { redirect } from "next/navigation";
// // import { Toaster } from "@/components/ui/toaster";
// import { Toaster } from "react-hot-toast";

// export const dynamic = "force-dynamic";

// const Layout = ({ children }: { children: React.ReactNode }) => {

//   const [currentUser, setCurrentUser] = useState()

//   const getCurrentUserInfo = async () => {
//     const currentUserData = await getCurrentUser(localStorage.getItem('session_id') ?? "");
//     if (!currentUserData) return redirect("/sign-in");

//     setCurrentUser(currentUserData)
//   }

//   useEffect(() => {
//     getCurrentUserInfo()
//   }, [])

//   return (
//     <main className="flex h-screen">
//       <Sidebar {...currentUser} />

//       <section className="flex h-full flex-1 flex-col">
//         <MobileNavigation {...currentUser} />
//         <Header userId={currentUser.$id} accountId={currentUser.accountId} />
//         <div className="main-content">{children}</div>
//       </section>
//     </main>
//   );
// };
// export default Layout;


"use client";

import React, { useEffect, useState } from "react";
import Sidebar from "@/components/Sidebar";
import MobileNavigation from "@/components/MobileNavigation";
import Header from "@/components/Header";
import { getCurrentUser } from "@/lib/actions/user.actions";
import { redirect, useRouter } from "next/navigation";
import { Toaster } from "react-hot-toast";

const Layout = ({ children }: { children: React.ReactNode }) => {
  const [currentUser, setCurrentUser] = useState<any>(null);
  const router = useRouter();

  useEffect(() => {
    const getCurrentUserInfo = async () => {
      const currentUserData = await getCurrentUser();

      if (!currentUserData) {
        router.push("/sign-in");
        return;
      }

      console.log(currentUserData)
      setCurrentUser(currentUserData);
    };

    getCurrentUserInfo();
  }, []);

  if (!currentUser) return null;

  return (
    <>
      <Toaster position="top-center" />

      <main className="flex h-screen">
        <Sidebar {...currentUser} />

        <section className="flex h-full flex-1 flex-col">
          <MobileNavigation {...currentUser} />
          <Header userId={currentUser.$id} accountId={currentUser.accountId} />
          <div className="main-content">{children}</div>
        </section>
      </main>
    </>
  );
};

export default Layout;
