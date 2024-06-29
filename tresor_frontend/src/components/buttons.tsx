import React from "react";
import { useState, ReactNode, useEffect } from "react";

export function FilledButton({
  children,
  isLight = false,
  ...btnProps
}: {
  children: ReactNode;
  isLight?: boolean;
} & React.DetailedHTMLProps<
  React.ButtonHTMLAttributes<HTMLButtonElement>,
  HTMLButtonElement
>) {
  return (
    <button
      {...btnProps}
      className={`flex  flex-row items-center justify-center gap-x-[10px] rounded-md px-4 py-2 text-center font-medium transition-all duration-150 active:scale-95 ${isLight ? "bg-primaryLight text-primary hover:bg-primaryLight2" : "bg-primary text-white"} ${btnProps.className ?? ""}`}
    >
      {children}
    </button>
  );
}

export function OutlinedButton({
  children,
  ...btnProps
}: {
  children: ReactNode;
} & React.DetailedHTMLProps<
  React.ButtonHTMLAttributes<HTMLButtonElement>,
  HTMLButtonElement
>) {
  return (
    <button
      {...btnProps}
      className={
        "flex flex-row items-center justify-center gap-x-[10px] rounded-md border border-primary bg-white px-4 py-2 text-center font-medium text-primary transition-all duration-150 active:scale-95 " +
        (btnProps.className ?? "")
      }
    >
      {children}
    </button>
  );
}

export function DisconnectButton({
  ...btnProps
}: React.DetailedHTMLProps<
  React.ButtonHTMLAttributes<HTMLButtonElement>,
  HTMLButtonElement
>) {
  return (
    <button
      {...btnProps}
      className={
        "flex w-max items-center gap-x-3 text-sm text-gray " +
        btnProps.className
      }
    >
      <svg
        width="18"
        height="18"
        viewBox="0 0 18 18"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          d="M2 18C1.45 18 0.979167 17.8042 0.5875 17.4125C0.195833 17.0208 0 16.55 0 16V2C0 1.45 0.195833 0.979167 0.5875 0.5875C0.979167 0.195833 1.45 0 2 0H8C8.28333 0 8.52083 0.0958333 8.7125 0.2875C8.90417 0.479167 9 0.716667 9 1C9 1.28333 8.90417 1.52083 8.7125 1.7125C8.52083 1.90417 8.28333 2 8 2H2V16H8C8.28333 16 8.52083 16.0958 8.7125 16.2875C8.90417 16.4792 9 16.7167 9 17C9 17.2833 8.90417 17.5208 8.7125 17.7125C8.52083 17.9042 8.28333 18 8 18H2ZM14.175 10H7C6.71667 10 6.47917 9.90417 6.2875 9.7125C6.09583 9.52083 6 9.28333 6 9C6 8.71667 6.09583 8.47917 6.2875 8.2875C6.47917 8.09583 6.71667 8 7 8H14.175L12.3 6.125C12.1167 5.94167 12.025 5.71667 12.025 5.45C12.025 5.18333 12.1167 4.95 12.3 4.75C12.4833 4.55 12.7167 4.44583 13 4.4375C13.2833 4.42917 13.525 4.525 13.725 4.725L17.3 8.3C17.5 8.5 17.6 8.73333 17.6 9C17.6 9.26667 17.5 9.5 17.3 9.7L13.725 13.275C13.525 13.475 13.2875 13.5708 13.0125 13.5625C12.7375 13.5542 12.5 13.45 12.3 13.25C12.1167 13.05 12.0292 12.8125 12.0375 12.5375C12.0458 12.2625 12.1417 12.0333 12.325 11.85L14.175 10Z"
          fill="#888888"
        />
      </svg>
      Se déconnecter
    </button>
  );
}

export function SelectButtonTile({
  icon,
  children,
  ...btnProps
}: {
  icon: ReactNode;
  children: ReactNode;
} & React.DetailedHTMLProps<
  React.ButtonHTMLAttributes<HTMLButtonElement>,
  HTMLButtonElement
>) {
  return (
    <button
      {...btnProps}
      className={
        "flow-row text-medium flex items-center gap-x-3 px-4 py-2 text-sm hover:bg-slate-200 " +
        (btnProps.className ?? "")
      }
    >
      {icon}
      {children}
    </button>
  );
}
export function SelectButton({
  button,
  children,
}: {
  button: ReactNode;
  children: ReactNode;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const thisRef = React.createRef<HTMLDivElement>();

  useEffect(() => {
    if (!isOpen) return;

    function handleClickOutside(event: MouseEvent) {
      if (thisRef.current && !thisRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("mouseup", () => {
      setIsOpen(false);
    });
  }, [isOpen]);

  return (
    <div ref={thisRef} className="relative">
      <button
        onClick={() => {
          setIsOpen(!isOpen);
        }}
      >
        {button}
      </button>
      <div
        className={`absolute right-0 top-8 z-10 flex w-full flex-col overflow-hidden rounded bg-white shadow-2xl transition-all duration-150 ${isOpen ? "w-max" : "hidden w-0 opacity-80"}`}
      >
        {children}
      </div>
    </div>
  );
}
