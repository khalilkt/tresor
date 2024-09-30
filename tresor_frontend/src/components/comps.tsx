import { ReactNode, useContext, useEffect, useRef } from "react";
import { LeftArrow, SearchIcon } from "./icons";
import React from "react";
import { AuthContext } from "../App";
import axios from "axios";
import * as Popover from "@radix-ui/react-popover";
import { rootUrl } from "../constants";
import { OutlinedButton } from "./buttons";
import signature from "../assets/signature.png";
// h1props is a type that represents the props that can be passed to an h1 element
export function Title({
  children,
  ...h1Props
}: { children: ReactNode } & React.HTMLProps<HTMLHeadingElement>) {
  return (
    <h1
      {...h1Props}
      className={`text-2xl font-semibold ${h1Props.className ?? ""}`}
    >
      {children}
    </h1>
  );
}

export function SearchBar({
  ...inputProps
}: React.HTMLProps<HTMLInputElement>) {
  return (
    <div className="relative w-full">
      <input
        {...inputProps}
        className={`relative rounded-md border-2 border-primaryBorder py-2 pl-9 pr-3 text-black ${inputProps.className ?? ""}`}
      ></input>
      <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 transform" />
    </div>
  );
}

export function Input({
  ...inputProps
}: React.DetailedHTMLProps<
  React.InputHTMLAttributes<HTMLInputElement>,
  HTMLInputElement
>) {
  return (
    <input
      {...inputProps}
      className={`rounded-md border border-primaryBorder px-3 py-2 text-sm text-black lg:text-base ${inputProps.className ?? ""}`}
    />
  );
}
export function Select({
  children,
  ...selectedProps
}: { children: React.ReactNode } & React.DetailedHTMLProps<
  React.SelectHTMLAttributes<HTMLSelectElement>,
  HTMLSelectElement
>) {
  return (
    <select
      {...selectedProps}
      className={`relative h-full w-full text-ellipsis rounded-md border border-primaryBorder px-3 py-2 text-sm text-black lg:text-base ${selectedProps.className ?? ""}`}
    >
      {children}
    </select>
  );
}

export function SearchSelect<T>({
  value,
  onSelected,
  placeHolder,
  search = false,
  url,
  lookupColumn = "name",
  className,
}: {
  value: string | null;
  onSelected: (value: T) => void;
  placeHolder: string;
  search?: boolean;
  lookupColumn?: string;
  className?: string;

  url: string;
}) {
  const [isOpen, setIsOpen] = React.useState<boolean>(false);
  const thisRef = useRef<any>(null);
  const [searchValue, setSearchValue] = React.useState<string>("");
  const [items, setItems] = React.useState<T[]>([]);

  const token = useContext(AuthContext).authData?.token;

  async function close() {
    setIsOpen(false);
    await new Promise((resolve) => setTimeout(resolve, 200));
    setSearchValue("");
  }

  useEffect(() => {
    // const handleClickOutside = (event: MouseEvent) => {
    //   if (thisRef.current && !thisRef.current.contains(event.target as Node)) {
    //     close();
    //   }
    // };
    // document.addEventListener("click", handleClickOutside);
    // return () => {
    //   document.removeEventListener("click", handleClickOutside);
    // };
  }, []);

  useEffect(() => {
    if (isOpen) {
      setSearchValue("");
    }
  }, [isOpen]);

  useEffect(() => {
    axios
      .get(rootUrl + url, {
        headers: {
          Authorization: "Token " + token,
        },
        params: {
          search: searchValue,
        },
      })
      .then((response) => {
        setItems(response.data.data);
      });
  }, [searchValue, url]);

  return (
    <div className={`relative ${className}`}>
      <Popover.Root
        open={isOpen}
        onOpenChange={() => {
          setIsOpen(!isOpen);
        }}
      >
        <Popover.Trigger asChild>
          <button
            ref={thisRef}
            onClick={() => {
              setIsOpen(!isOpen);
            }}
            className="relative flex w-full cursor-pointer items-center justify-between rounded-md border border-primaryBorder px-3 py-2 pl-3 text-black"
          >
            <span className={value && value.length > 0 ? "" : "text-gray"}>
              {value && value.length > 0 ? value : placeHolder}
            </span>
            <LeftArrow className="absolute right-4 -rotate-90 transform fill-black" />
          </button>
        </Popover.Trigger>
        <Popover.Portal>
          <Popover.Content className="z-50 w-52 rounded bg-white">
            {search && isOpen && (
              <div className="flex items-center justify-center">
                <Input
                  placeholder=""
                  value={searchValue}
                  className="mx-auto mt-2 w-[80%] self-center"
                  onChange={(e: any) => {
                    setSearchValue(e.target.value);
                  }}
                />
              </div>
            )}
            <div className="max-h-[300px] overflow-y-auto">
              {items.map((val, index) => {
                return (
                  <div
                    className="cursor-pointer px-4 py-2 hover:bg-primaryLight"
                    onClick={() => {
                      onSelected(val);
                      setIsOpen(false);
                    }}
                  >
                    {(val as any)[lookupColumn]}
                  </div>
                );
              })}
            </div>
          </Popover.Content>
        </Popover.Portal>
      </Popover.Root>
    </div>
  );

  // return (
  //   <div ref={thisRef} className={`relative`}>
  //     <div
  //       className={`relative flex cursor-pointer items-center justify-between rounded-md border border-primaryBorder px-3 py-2 pl-3 text-black`}
  //       onClick={() => {
  //         if (!isOpen) {
  //           setIsOpen(true);
  //         } else {
  //           close();
  //         }
  //       }}
  //     >
  //       <span
  //         className={` line-clamp-1  text-ellipsis ${!value || value.length === 0 ? "text-gray" : "text-black"}`}
  //       >
  //         {!value || value.length === 0 ? placeHolder : value}
  //       </span>
  //       <LeftArrow className="-rotate-90 transform" />
  //     </div>
  //     <div
  //       className={`absolute z-20 mt-2 w-full origin-top-left rounded-sm border border-slate-300 bg-white py-px shadow transition-all duration-200 ${
  //         isOpen ? "scale-100 opacity-100" : "scale-0 opacity-0"
  //       }`}
  //     >
  //       {search && isOpen && (
  //         <div className="flex items-center justify-center">
  //           <Input
  //             placeholder=""
  //             value={searchValue}
  //             className="mx-auto mt-2 w-[80%] self-center"
  //             onChange={(e: any) => {
  //               setSearchValue(e.target.value);
  //             }}
  //           />
  //         </div>
  //       )}
  //       <div className="max-h-[300px] overflow-y-scroll">
  //         {items.map((val, index) => {
  //           return (
  //             <div
  //               className=" cursor-pointer  px-4 py-2 hover:bg-primaryLight "
  //               onClick={() => {
  //                 onSelected(val);
  //                 setIsOpen(false);
  //               }}
  //             >
  //               {(val as any)[lookupColumn]}
  //             </div>
  //           );
  //         })}
  //       </div>
  //     </div>
  //   </div>
  // );
}

export function Textarea({
  ...textareaProps
}: React.DetailedHTMLProps<
  React.TextareaHTMLAttributes<HTMLTextAreaElement>,
  HTMLTextAreaElement
>) {
  return (
    <textarea
      {...textareaProps}
      className={`rounded-md border border-primaryBorder py-2 pl-3 pr-3 text-sm text-black lg:text-base ${textareaProps.className ?? ""}`}
    />
  );
}

export function Border({
  children,
  ...divProps
}: { children: ReactNode } & React.HTMLProps<HTMLDivElement>) {
  return (
    <div
      {...divProps}
      className={`h-max w-max rounded-lg bg-primaryLight px-3 py-[6px] text-xs font-semibold text-primary ${divProps.className ?? ""}`}
    >
      {children}
    </div>
  );
}

export function Tag({
  title,
  tag,
  ...buttonProps
}: { title: string; tag: string } & React.DetailedHTMLProps<
  React.ButtonHTMLAttributes<HTMLButtonElement>,
  HTMLButtonElement
>) {
  return (
    <button
      {...buttonProps}
      className={`flex h-max w-max items-center gap-x-2 rounded-lg border-2 border-primaryBorder px-2 py-2 text-sm ${buttonProps.className}`}
    >
      {title.length > 0 && <span>{title}</span>}
      <span className="text-primary">{tag}</span>
    </button>
  );
}

export function PrintButton({
  onTap,

  className = "",
  showSignatureChoice = false,
}: {
  onTap: (showSignature: Boolean) => void;
  className?: string;
  showSignatureChoice?: boolean;
}) {
  const showSignature = useContext(AuthContext).showSignature;
  const authContext = useContext(AuthContext);
  const isAdmin = authContext.authData?.user?.is_admin;

  return (
    <div className={"flex gap-x-1 relative " + className}>
      {showSignatureChoice && isAdmin && (
        <label className="flex w-max absolute top-[50px] items-center gap-x-1">
          <input
            type="checkbox"
            className="form-checkbox w-3 h-3"
            checked={showSignature}
            onChange={(e) => {
              authContext.updateShowSignature(e.target.checked);
            }}
          />
          <span className="text-xs">Avec signature</span>
        </label>
      )}

      <OutlinedButton
        onClick={() => {
          onTap(showSignature);
        }}
      >
        Imprimer
      </OutlinedButton>
    </div>
  );
}

export function Signature() {
  return <img src={signature} className="w-[4.6cm] h-[4.6cm] mr-4 mt-2" />;
}
