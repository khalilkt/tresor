import React, { ReactNode, useEffect } from "react";
import { AuthContext } from "../App";
import { Link, Navigate, Outlet, useLocation } from "react-router-dom";
import {
  AgentsIcon,
  BankIcon,
  CollectionIcon,
  DisbursementIcon,
  FileIcon,
  StatsIcon,
} from "./icons";
import { DisconnectButton, FilledButton } from "./buttons";
import logo from "../assets/rim.png";
import { MDialog } from "./dialog";
import { rootUrl } from "../constants";
import axios from "axios";
import { numberToFrench } from "../logiC/utils";

function FileDownloadDialog() {
  // 2024-04
  const [selectedDate, setSelectedDate] = React.useState<string | null>(null);
  const [selectedOption, setSelectedOption] = React.useState<
    "collection" | "disbursement"
  >("collection");
  const [total, setTotal] = React.useState<number | null>(null);

  function downloadFile() {
    const url = `${rootUrl}files/${selectedDate!.replace("-", "/")}?count=false&type=${selectedOption}`;
    const a = document.createElement("a");
    a.href = url;
    a.download = url;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  }

  async function updateTotal() {
    setTotal(null);
    const url = `${rootUrl}files/${selectedDate!.replace("-", "/")}?count=true&type=${selectedOption}`;
    const response = await axios.get(url);
    setTotal(response.data);
  }

  useEffect(() => {
    if (selectedDate) {
      updateTotal();
    }
  }, [selectedDate, selectedOption]);

  return (
    <div className="flex flex-col gap-y-4 w-[500px]">
      <div className="flex gap-x-3">
        {["collection", "disbursement"].map((option) => (
          <button
            className={`flex-1 p-2 rounded-lg ${
              option === selectedOption
                ? "bg-primary text-white"
                : "bg-gray-200"
            }`}
            onClick={() => {
              setSelectedOption(option as "collection" | "disbursement");
            }}
          >
            {option === "collection" ? "Encaissement" : "Décaissement"}
          </button>
        ))}
      </div>
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

function NavGroup({
  children,
  icon,
  label,
  isOpen,
  onClick,
}: {
  children: ReactNode;
  icon: ReactNode;
  label: string;
  isOpen: boolean;
  onClick: () => void;
}) {
  return (
    <li>
      <div className="flex flex-col">
        <button
          onClick={onClick}
          className="flex flex-row gap-x-2 overflow-x-clip text-ellipsis rounded-md p-3 text-sm font-semibold transition-all duration-100 bg-transparent text-gray"
        >
          <span className="fill-gray">{icon}</span>
          <span>{label}</span>
        </button>
        {isOpen && <div className="flex ml-4 flex-col gap-y-1">{children}</div>}
      </div>
    </li>
  );
}

function NavItem({
  to,
  children,
  icon,
  onClick,
  isOpen,
}: {
  to: string;
  icon: React.ReactNode;
  children: React.ReactNode;
  isOpen: boolean;
  isSubChild?: boolean;
  onClick?: () => void;
}) {
  const { pathname } = useLocation();
  const isActive = pathname === to;

  return (
    <li>
      <Link
        className={`flex flex-row gap-x-2 overflow-x-clip text-ellipsis rounded-md p-3 text-sm font-semibold transition-all duration-100 ${isActive ? "bg-[#E5EEFF] text-primary" : "bg-transparent text-gray"}`}
        to={to}
        onClick={onClick}
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
  const [selectedGroup, setSelectedGroup] = React.useState<
    "accounts" | "vautls" | "none"
  >("none");

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
          "relative flex flex-col gap-y-2 border-r-2 border-r-primaryBorder bg-white px-6 pt-10 transition-all duration-150 " +
          (isOpen ? "w-[340px]" : "w-[100px]")
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
            <NavItem
              onClick={() => {
                setSelectedGroup("none");
              }}
              isOpen={isOpen}
              to="/"
              icon={<StatsIcon />}
            >
              Tableau de bord
            </NavItem>
            <NavItem
              onClick={() => {
                setSelectedGroup("none");
              }}
              isOpen={isOpen}
              to="/agents"
              icon={<AgentsIcon />}
            >
              Agents
            </NavItem>
          </>
        )}
        {(user?.is_admin || user?.has_accounts_access) && (
          <NavGroup
            isOpen={selectedGroup === "accounts"}
            icon={<BankIcon />}
            onClick={() => {
              if (selectedGroup === "accounts") {
                setSelectedGroup("none");
              } else setSelectedGroup("accounts");
            }}
            label={"Comptes"}
          >
            {user.is_admin && (
              <NavItem isOpen={isOpen} to="/accounts" icon={<BankIcon />}>
                Relevé
              </NavItem>
            )}
            <NavItem
              isOpen={isOpen}
              isSubChild={true}
              to="/encaissements"
              icon={<CollectionIcon />}
            >
              Opération d'encaissement
            </NavItem>
            <NavItem
              isOpen={isOpen}
              to="/decaissements"
              icon={<DisbursementIcon />}
            >
              Opérration de décaissement
            </NavItem>
          </NavGroup>
        )}

        {(user?.is_admin || user!.assigned_vault_groups.length > 0) && (
          <NavGroup
            isOpen={selectedGroup === "vautls"}
            icon={<BankIcon />}
            onClick={() => {
              if (selectedGroup === "vautls") {
                setSelectedGroup("none");
              } else setSelectedGroup("vautls");
            }}
            label={"Caisse"}
          >
            {user!.is_admin && (
              <NavItem isOpen={isOpen} to="/caisses" icon={<BankIcon />}>
                Relevé
              </NavItem>
            )}
            <NavItem isOpen={isOpen} to="/depots" icon={<CollectionIcon />}>
              Opérations de recettes
            </NavItem>
            <NavItem isOpen={isOpen} to="/retraits" icon={<DisbursementIcon />}>
              Opérations des dépenses
            </NavItem>
          </NavGroup>
        )}
        <span
          onClick={() => {
            setIsFileDownloadDialogOpen(true);
          }}
          className={`flex cursor-pointer flex-row gap-x-2 overflow-x-clip text-ellipsis rounded-md p-3 text-sm font-semibold transition-all duration-100 bg-transparent text-gray`}
        >
          <span className={``}>
            <FileIcon />
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
