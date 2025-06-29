"use client";

import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useEffect, useState } from "react";
import Image from "next/image";
import { actionsDropdownItems } from "@/constants";
import Link from "next/link";
import { constructDownloadUrl } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  deleteFile,
  renameFile,
  updateFileUsers,
} from "@/lib/actions/file.actions";
import { usePathname } from "next/navigation";
import { FileDetails, ShareInput } from "@/components/ActionsModalContent";
import { useToast } from "@/hooks/use-toast";
import { getCurrentUser } from "@/lib/actions/user.actions";

const ActionDropdown = ({ sessionId, file }: { sessionId: string, file: any }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [action, setAction] = useState<ActionType | null>(null);
  const [name, setName] = useState(file.name);
  const [isLoading, setIsLoading] = useState(false);
  const [emails, setEmails] = useState<{ email: string; accessType: string }[]>([]);
  const [newActionsDropdownItems, setNewActionsDropdownItems] = useState<Array<any>>([]);

  const { toast } = useToast()
  const path = usePathname();

  useEffect(() => {
    getCurrentUserInfo();
  }, []);

  const getCurrentUserInfo = async () => {
    const currentUser = await getCurrentUser();

    if (file.owner._id !== sessionId && currentUser?.email) {
      const currentUserAccess = file.users.find((f: any) => f.email === currentUser.email);

      if (currentUserAccess) {
        switch (currentUserAccess.accessType) {
          case "r":
            const customActionsDropdownItemsR = actionsDropdownItems.filter(
              (d) => d.value === "download" || d.value === "details"
            );
            setNewActionsDropdownItems(customActionsDropdownItemsR)
            break;
          case "wr":
            const customActionsDropdownItemsWR = actionsDropdownItems.filter(
              (d) =>
                d.value === "rename" ||
                d.value === "download" ||
                d.value === "details"
            );
            setNewActionsDropdownItems(customActionsDropdownItemsWR)
            break;
          case "wrs":
            const customActionsDropdownItemsWRS = actionsDropdownItems.filter(
              (d) =>
                d.value === "rename" ||
                d.value === "download" ||
                d.value === "details" ||
                d.value === "share"
            );
            setNewActionsDropdownItems(customActionsDropdownItemsWRS)
            break;
          default:
            setNewActionsDropdownItems(actionsDropdownItems)
            break;
        }
      }
    }
    else {
      setNewActionsDropdownItems(actionsDropdownItems)
    }
  };

  const closeAllModals = () => {
    setIsModalOpen(false);
    setIsDropdownOpen(false);
    setAction(null);
    setName(file.name);
  };

  const handleAction = async () => {
    if (!action) return;
    setIsLoading(true);
    let success = false;

    const actions = {
      rename: async () => {
        await renameFile({ fileId: file._id, name, path })
        return toast({
          description: (
            <p className="body-2 text-white">
              <span className="font-semibold">{file.name}</span> is renamed successfully.
            </p>
          ),
          className: "error-toast",
        });
      },
      share: async () => {
        await updateFileUsers({ file, emails, path })
        return toast({
          description: (
            <p className="body-2 text-white">
              <span className="font-semibold">{file.name}</span> shared with {emails[0].email} successfully.
            </p>
          ),
          className: "error-toast",
        });
      },
      delete: () =>
        deleteFile({ fileId: file._id, bucketFileId: file.bucketFileId, path }),
    };

    success = await actions[action.value as keyof typeof actions]();
    if (success) closeAllModals();

    setIsLoading(false);
  };

  const handleRemoveUser = async (email: string) => {
    const updatedEmails = file.users.filter((e: any) => e.email !== email);
    const removedEmail = file.users.find((e: any) => e.email === email);

    const success = await updateFileUsers({
      file,
      emails: updatedEmails,
      path,
      isRemove: true
    });

    if (success) {
      setEmails(updatedEmails)
      closeAllModals();

      return toast({
        description: (
          <p className="body-2 text-white">
            <span className="font-semibold">{removedEmail.email}</span> has been removed from file access.
          </p>
        ),
        className: "error-toast",
      });
    };
  };

  const renderDialogContent = () => {
    if (!action) return null;

    const { value, label } = action;

    return (
      <DialogContent className="shad-dialog button">
        <DialogHeader className="flex flex-col gap-3">
          <DialogTitle className="text-center text-light-100">
            {label}
          </DialogTitle>
          {value === "rename" && (
            <Input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          )}
          {value === "details" && <FileDetails file={file} />}
          {value === "share" && (
            <ShareInput
              file={file}
              onInputChange={setEmails}
              onRemove={handleRemoveUser}
            />
          )}
          {value === "delete" && (
            <p className="delete-confirmation">
              Are you sure you want to delete{` `}
              <span className="delete-file-name">{file.name}</span>?
            </p>
          )}
        </DialogHeader>
        {["rename", "delete", "share"].includes(value) && (
          <DialogFooter className="flex flex-col gap-3 md:flex-row">
            <Button onClick={closeAllModals} className="modal-cancel-button">
              Cancel
            </Button>
            <Button onClick={handleAction} className="modal-submit-button">
              <p className="capitalize">{value}</p>
              {isLoading && (
                <Image
                  src="/assets/icons/loader.svg"
                  alt="loader"
                  width={24}
                  height={24}
                  className="animate-spin"
                />
              )}
            </Button>
          </DialogFooter>
        )}
      </DialogContent>
    );
  };

  return (
    <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
      <DropdownMenu open={isDropdownOpen} onOpenChange={setIsDropdownOpen}>
        <DropdownMenuTrigger className="shad-no-focus">
          <Image
            src="/assets/icons/dots.svg"
            alt="dots"
            width={34}
            height={34}
          />
        </DropdownMenuTrigger>
        <DropdownMenuContent>
          <DropdownMenuLabel className="max-w-[200px] truncate">
            {file.name}
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          {newActionsDropdownItems.map((actionItem) => (
            <DropdownMenuItem
              key={actionItem.value}
              className="shad-dropdown-item"
              onClick={() => {
                setAction(actionItem);

                if (
                  ["rename", "share", "delete", "details"].includes(
                    actionItem.value,
                  )
                ) {
                  setIsModalOpen(true);
                }
              }}
            >
              {actionItem.value === "download" ? (
                <Link
                  href={constructDownloadUrl(file.bucketFileId)}
                  download={file.name}
                  className="flex items-center gap-2"
                >
                  <Image
                    src={actionItem.icon}
                    alt={actionItem.label}
                    width={30}
                    height={30}
                  />
                  {actionItem.label}
                </Link>
              ) : (
                <div className="flex items-center gap-2">
                  <Image
                    src={actionItem.icon}
                    alt={actionItem.label}
                    width={30}
                    height={30}
                  />
                  {actionItem.label}
                </div>
              )}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>

      {renderDialogContent()}
    </Dialog>
  );
};

export default ActionDropdown;
