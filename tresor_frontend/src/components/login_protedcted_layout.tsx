import React, { useEffect } from "react";
import { AuthContext } from "../App";
import { Link, Navigate, Outlet, useLocation } from "react-router-dom";
import { StatsIcon } from "./icons";
import { DisconnectButton, FilledButton } from "./buttons";
import logo from "../assets/rim.png";
import { MDialog } from "./dialog";
import { rootUrl } from "../constants";
import axios from "axios";

function FileDownloadDialog() {
  // 2024-04
  const [selectedDate, setSelectedDate] = React.useState<string | null>(null);
  const [total, setTotal] = React.useState<number | null>(null);

  function downloadFile() {
    const url = `${rootUrl}files/${selectedDate!.replace("-", "/")}?count=false`;
    const a = document.createElement("a");
    a.href = url;
    a.download = url;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  }

  async function updateTotal() {
    setTotal(null);
    const url = `${rootUrl}files/${selectedDate!.replace("-", "/")}?count=true`;
    const response = await axios.get(url);
    setTotal(response.data);
  }

  useEffect(() => {
    if (selectedDate) {
      updateTotal();
    }
  }, [selectedDate]);

  return (
    <div className="flex flex-col gap-y-4 w-[500px]">
      <div className="flex flex-col gap-y-2">
        <label className="text-medium text-gray">Date</label>
        <input
          type="month"
          lang="fr"
          //   make the month name in french

          className="border border-gray rounded-md p-2"
          value={selectedDate || ""}
          onChange={(e) => {
            setSelectedDate(e.target.value);
          }}
        />
      </div>

      {selectedDate ? (
        <div className="flex flex-col">
          <FilledButton
            className="mt-5 disabled:opacity-50"
            disabled={!total}
            onClick={() => {
              downloadFile();
            }}
          >
            Télécharger
          </FilledButton>
          <span
            className={`text-gray text-center mt-2 ${total !== null ? "" : "opacity-0"}`}
          >
            {total} fichiers trouvés pour cette date
          </span>
        </div>
      ) : (
        <span className="text-gray text-center mt-5">
          Veuillez choisir une date
        </span>
      )}
    </div>
  );
}

function NavItem({
  to,
  children,
  icon,
  isOpen,
}: {
  to: string;
  icon: React.ReactNode;
  children: React.ReactNode;
  isOpen: boolean;
}) {
  const { pathname } = useLocation();
  const isActive = pathname === to;

  return (
    <li>
      <Link
        className={`flex flex-row gap-x-2 overflow-x-clip text-ellipsis rounded-md p-3 text-sm font-semibold transition-all duration-100 ${isActive ? "bg-[#E5EEFF] text-primary" : "bg-transparent text-gray"}`}
        to={to}
      >
        <span className={` ${isActive ? "fill-primary " : "fill-gray"}`}>
          {icon}
        </span>
        {isOpen && children}
      </Link>
    </li>
  );
}
export default function LoginProtectedLayout() {
  const authContext = React.useContext(AuthContext);
  const [isOpen, setIsOpen] = React.useState<boolean>(true);

  const [isFileDownloadDialogOpen, setIsFileDownloadDialogOpen] =
    React.useState<boolean>(false);

  const user = authContext.authData?.user;

  if (!authContext.authData) {
    return <Navigate to="/login" />;
  }
  return (
    <div className="flex h-screen flex-row">
      <MDialog
        isOpen={isFileDownloadDialogOpen}
        onClose={() => {
          setIsFileDownloadDialogOpen(false);
        }}
        title="Télécharger les fichiers"
      >
        <FileDownloadDialog />
      </MDialog>

      <ul
        className={
          "relative flex flex-col gap-y-2 border-r-2 border-r-primaryBorder bg-white px-6 pt-20 transition-all duration-150 " +
          (isOpen ? "w-[15%]" : "w-[100px]")
        }
      >
        <img src={logo} alt="logo" className="mb-6 h-20 w-fit self-center" />
        <h3
          onClick={() => {
            // authContext.logOut();
          }}
          className="mb-2 font-semibold text-gray"
        >
          Menu
        </h3>
        {user?.is_admin && (
          <>
            <NavItem isOpen={isOpen} to="/" icon={<StatsIcon />}>
              Tableau de bord
            </NavItem>
            <NavItem isOpen={isOpen} to="/agents" icon={<StatsIcon />}>
              Agents
            </NavItem>
            <NavItem isOpen={isOpen} to="/accounts" icon={<StatsIcon />}>
              Comptes
            </NavItem>
          </>
        )}
        <NavItem isOpen={isOpen} to="/encaissements" icon={<StatsIcon />}>
          Opération d'encaissement
        </NavItem>
        <NavItem isOpen={isOpen} to="/decaissements" icon={<StatsIcon />}>
          Opérration de décaissement
        </NavItem>

        <span
          onClick={() => {
            setIsFileDownloadDialogOpen(true);
          }}
          className={`flex cursor-pointer flex-row gap-x-2 overflow-x-clip text-ellipsis rounded-md p-3 text-sm font-semibold transition-all duration-100 bg-transparent text-gray`}
        >
          <span className={`fill-gray`}>
            <StatsIcon />
          </span>
          <span>Fichiers</span>
        </span>

        <div className="text-medium  font- mb-20 mt-auto flex flex-col gap-y-6 self-center text-gray">
          <DisconnectButton
            className="text-semibold "
            onClick={() => {
              authContext.logOut();
            }}
          />
        </div>
      </ul>
      <section className="h-screen flex-1 overflow-y-auto ">
        <Outlet />
      </section>
    </div>
  );
}
