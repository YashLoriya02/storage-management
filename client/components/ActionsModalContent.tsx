import Thumbnail from "@/components/Thumbnail";
import FormattedDateTime from "@/components/FormattedDateTime";
import { ACCESS_TYPES, convertFileSize, formatDateTime, getAccessType } from "@/lib/utils";
import React, { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import Image from "next/image";
import { RWebShare } from "react-web-share";
import { useToast } from "@/hooks/use-toast";
import { Check, Copy, TicketPlus } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

// Helper Components
const ImageThumbnail = ({ file }: { file: any }) => (
  <div className="file-details-thumbnail">
    <Thumbnail type={file.type} extension={file.extension} url={file.url} />
    <div className="flex flex-col">
      <p className="subtitle-2 mb-1">{file.name}</p>
      <FormattedDateTime date={file.createdAt} className="caption" />
    </div>
  </div>
);

const DetailRow = ({ label, value }: { label: string; value: string }) => (
  <div className="flex">
    <p className="file-details-label text-left">{label}</p>
    <p className="file-details-value text-left">{value}</p>
  </div>
);

// Child Components used in ActionDropdown file
export const FileDetails = ({ file }: { file: any }) => {
  return (
    <>
      <ImageThumbnail file={file} />
      <div className="space-y-4 px-2 pt-2">
        <DetailRow label="Format:" value={file.extension} />
        <DetailRow label="Size:" value={convertFileSize(file.size)} />
        <DetailRow label="Owner:" value={file.owner.fullName} />
        <DetailRow label="Last edit:" value={formatDateTime(file.updatedAt)} />
      </div>
    </>
  );
};

export const ShareInput = ({ file, onInputChange, onRemove }: Props) => {
  const [emailInput, setEmailInput] = useState<string>("");
  const [accessType, setAccessType] = useState<string>("r");

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const emails = e.target.value.trim().split(",").filter(Boolean);

    setEmailInput(e.target.value);
    const formatted = emails.map((email) => ({
      email,
      accessType,
    }));

    onInputChange(formatted);
  };

  const handleAccessChange = (value: string) => {
    setAccessType(value);
    const emails = emailInput.trim().split(",").filter(Boolean);
    const formatted = emails.map((email) => ({
      email,
      accessType: value,
    }));
    onInputChange(formatted);
  };

  return (
    <>
      <ImageThumbnail file={file} />

      <div className="share-wrapper">
        <p className="subtitle-2 pl-1 text-light-100">Share file with other users</p>

        {/* Email Input */}
        <Input
          type="email"
          placeholder="Enter email address"
          onChange={handleInputChange}
          className="share-input-field"
        />

        {/* Access Type Dropdown */}
        <Select value={accessType} onValueChange={handleAccessChange}>
          <SelectTrigger className="w-full mt-3 rounded-3xl border-none bg-[#dfddddc9] text-black">
            <SelectValue placeholder="Select Access Type" />
          </SelectTrigger>
          <SelectContent className="text-black border rounded-2xl shadow-lg">
            {ACCESS_TYPES.map((item) => (
              <SelectItem
                key={item.value}
                value={item.value}
                className="hover:!bg-[#aeabab55] border-red cursor-pointer"
              >
                {item.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Already Shared Users */}
        <div className="pt-4">
          <div className="flex justify-between">
            <p className="subtitle-2 text-light-100">Shared with</p>
            <p className="subtitle-2 text-light-200">{file.users.length} users</p>
          </div>

          <ul className="pt-2">
            {file.users.map((userObj: any, idx: number) => (
              <li key={userObj._id} className={`border-b-2 ${idx !== 0 && "pt-3"} flex items-center justify-between gap-2`}>
                <div className="flex flex-col items-start w-[75%] justify-start">
                  <p className="text-gray-600">
                    Email:
                    <span className="ml-1 text-light-100">{userObj.email}</span>
                  </p>
                  <p className="text-gray-600">Access:
                    <span className="ml-1 text-light-100">{getAccessType(userObj.accessType)}</span>
                  </p>
                </div>

                <Button onClick={() => onRemove(userObj.email)} className="share-remove-user">
                  <Image
                    src="/assets/icons/remove.svg"
                    alt="Remove"
                    width={24}
                    height={24}
                    className="remove-icon"
                  />
                </Button>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </>
  );
};

export const Keywords = ({ file, onInputChange }: {
  file: any,
  onInputChange: (strArr: string[]) => void
}) => {
  const [input, setInput] = useState("");

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setInput(value);

    const keywords = value
      .split(",")
      .map((kw) => kw.trim())
      .filter((kw) => kw.length > 0);

    onInputChange(keywords);
  };

  return (
    <>
      <ImageThumbnail file={file} />

      <div className="share-wrapper">
        <div className="mb-2 flex flex-col gap-1">
          <p className="subtitle-2 pl-1 text-light-100">
            Add custom keywords to search/filter the file efficiently.
          </p>
          <p className="subtitle-2 text-[12px] pl-1 text-light-100">
            Enter keywords as comma-separated values:<br />
            <span>e.g Resume, Document, CV, Other keywords</span>
          </p>
        </div>

        <Input
          type="text"
          placeholder="Enter your custom keywords"
          value={input}
          onChange={handleInputChange}
          className="share-input-field"
          aria-label="Custom keywords, comma separated"
        />

        {input && (
          <div className="mt-2 pl-1 text-xs text-[green]">
            <span>Preview:&nbsp;</span>
            {input
              .split(",")
              .map((kw) => kw.trim())
              .filter(Boolean)
              .map((kw, idx, arr) =>
                <span key={kw}>
                  {kw}
                  {idx < arr.length - 1 ? <span>, </span> : null}
                </span>
              )}
          </div>
        )}
      </div>
    </>
  );
};

export const Forward = ({ file }: { file: any }) => {
  const { toast } = useToast();
  const [copied, setCopied] = useState(false)

  const copyUrl = () => {
    navigator.clipboard
      .writeText(file.url)
      .then(() => {
        setCopied(true)

        toast({
          description: (
            <p className="body-2 text-white">Link Copied to Clipboard</p>
          ),
          className: "error-toast",
        });

        setTimeout(() => {
          setCopied(false)
        }, 3000);
      })
      .catch(() => {
        toast({
          description: (
            <p className="body-2 text-white">Could not copy text</p>
          ),
          className: "error-toast",
        });
      });
  };

  return (
    <div className="flex flex-col gap-3">
      <div className="hidden md:flex items-center justify-between bg-neutral-700 rounded-xl px-4 py-2 mb-1">
        <span title={file.url} className="text-wrap text-sm text-white">{file.url.substring(0, 38)}...</span>
        <button
          aria-label="Copy link"
          onClick={copyUrl}
          className="ml-3 text-neutral-200"
        >
          {copied ? <Check className="h-5 w-5" /> : <Copy className="w-5 h-5" />}
        </button>
      </div>

      <div className="flex md:hidden items-center justify-between bg-neutral-700 rounded-xl px-4 py-2 mb-1">
        <span title={file.url} className="text-wrap text-sm text-white">{file.url.substring(0, 28)}...</span>
        <button
          aria-label="Copy link"
          onClick={copyUrl}
          className="ml-3 text-neutral-200"
        >
          {copied ? <Check className="h-5 w-5" /> : <Copy className="w-5 h-5" />}
        </button>
      </div>

      <RWebShare
        data={{
          text: `Forward the file link`,
          url: `${file.url}`,
          title: "StoreIt",
        }}
      >
        <Button className="modal-submit-button w-full mt-1">
          <span className="capitalize">Other Options</span>
        </Button>
      </RWebShare>
    </div>
  );
};