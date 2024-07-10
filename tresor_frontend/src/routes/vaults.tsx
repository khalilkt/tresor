import { useContext, useEffect, useRef, useState } from "react";
import { MDialog } from "../components/dialog";
import { VaultInterface } from "../logiC/interfaces";
import { Pagination, TableBodySquelette, Td, Tr } from "../components/table";
import { Input, SearchBar, Title } from "../components/comps";
import { FilledButton, OutlinedButton } from "../components/buttons";
import axios from "axios";
import { rootUrl } from "../constants";
import { AuthContext } from "../App";
import { useSearchParams } from "react-router-dom";
import { BankStatementIcon, EditIcon } from "../components/icons";
import { BankStatementDialog } from "../components/bank_statement_dialog";
import { PrintPage } from "../components/print_page";
import { useReactToPrint } from "react-to-print";
import { formatAmount, numberToFrench } from "../logiC/utils";
import { VAULT_GROUPS } from "./vaults_deposit";

function EditVaultDialog({
  onSubmit,
  vault,
}: {
  onSubmit: (data: { name: string; code: string; balance: number }) => void;
  vault: VaultInterface | null;
}) {
  useEffect(() => {
    if (vault) {
      (document.getElementById("name") as HTMLInputElement).value = vault.name;
      (document.getElementById("balance") as HTMLInputElement).value =
        vault.balance.toString();
      (document.getElementById("code") as HTMLInputElement).value = vault.code;
    }
  }, [vault]);

  return (
    <div className="flex flex-col">
      <div className="flex w-full flex-col gap-y-4 lg:w-[400px]">
        {
          <Input
            type="text"
            id="name"
            placeholder="Caisse"
            className={`border-gray-300 border p-2 ${vault ? "hidden" : ""}`}
          />
        }
        <Input
          type="number"
          id="balance"
          placeholder="Montant"
          className="border-gray-300 border p-2"
        />
        <Input
          type="text"
          id="code"
          placeholder="Numéro de caisse"
          className="border-gray-300 border p-2"
        />
        <FilledButton
          className="rounded-lg bg-primary p-2 text-white"
          onClick={() => {
            const name = (document.getElementById("name") as HTMLInputElement)
              .value;
            let balance = parseFloat(
              (document.getElementById("balance") as HTMLInputElement).value
            );
            const code = (document.getElementById("code") as HTMLInputElement)
              .value;

            if (isNaN(balance)) {
              alert("Montant doit être un nombre");
              return;
            }

            onSubmit({ name, balance, code });
          }}
        >
          {vault ? "Modifier" : "Ajouter"}
        </FilledButton>
      </div>
    </div>
  );
}

export default function VaultsPage() {
  const [vaultsData, setVaultsData] = useState<VaultInterface[] | null>(null);

  const printRef = useRef<HTMLDivElement>(null);

  const handlePrint = useReactToPrint({
    onBeforeGetContent() {},
    content: () => {
      return printRef.current;
    },
    onAfterPrint: () => {},
  });

  const [searchParams, setSearchParams] = useSearchParams();

  const token = useContext(AuthContext).authData?.token;
  const searchTimer = useRef<NodeJS.Timeout>();

  const [dialogState, setDialogState] = useState<{
    state: "bank_statement" | "editing" | "none";
    payload?: any;
  }>({
    state: "none",
  });

  useEffect(() => {
    load();
  }, [searchParams]);

  useEffect(() => {
    const searchBar = document.getElementById("search-bar");

    const searchParam = searchParams.get("search");
    if (searchBar) {
      (searchBar as HTMLInputElement).value = searchParam ?? "";
    }
  }, []);

  function onSearchChange(e: React.ChangeEvent<HTMLInputElement>) {
    const search = e.target.value;

    clearTimeout(searchTimer.current!);
    searchTimer.current = setTimeout(() => {
      setSearchParams((params) => {
        params.set("page", "1");
        if (search.length === 0) {
          params.delete("search");
        } else {
          params.set("search", search);
        }
        return params;
      });
    }, 500);
  }

  async function load() {
    let params = new URLSearchParams(searchParams);

    if (!params.get("group")) {
      params.set("group", "1");
    }
    try {
      const response = await axios.get(rootUrl + "vaults", {
        headers: {
          Authorization: "Token " + token,
        },
        params,
      });
      console.log(response.data);
      setVaultsData(response.data);
    } catch (e) {
      console.log(e);
    }
  }

  async function updateVault(
    name: string,
    balance: number,
    code: string,
    id: number
  ) {
    try {
      // pass the data and the token
      const response = await axios.patch(
        rootUrl + "vaults/" + id + "/",
        {
          name: name,
          balance: balance,
          code: code,
        },
        {
          headers: {
            Authorization: "Token " + token,
          },
        }
      );
      load();
      setDialogState({ state: "none" });
      console.log(response.data);
    } catch (e) {
      console.log(e);
      alert("Une erreur s'est produite. Veuillez réessayer.");
    }
  }

  const total = vaultsData?.reduce((acc, vault) => {
    if (typeof vault.balance !== "number") {
      return acc + parseFloat(vault.balance);
    }
    return acc + vault.balance;
  }, 0);

  const user = useContext(AuthContext).authData?.user;

  return (
    <div className="flex flex-col items-start gap-y-10 px-8 pb-12 pt-12 lg:px-10 lg:pb-0 lg:pt-20l">
      <MDialog
        isOpen={dialogState.state === "editing"}
        title="Modifier une caisse"
        onClose={function (): void {
          setDialogState({ state: "none" });
        }}
      >
        <EditVaultDialog
          vault={dialogState.payload}
          onSubmit={function (data): void {
            updateVault(
              data.name,
              data.balance,
              data.code,
              dialogState.payload.id
            );
          }}
        />
      </MDialog>
      <MDialog
        isOpen={dialogState.state === "bank_statement"}
        title={`Relevé de ${dialogState.payload?.name}`}
        onClose={function (): void {
          setDialogState({ state: "none" });
        }}
      >
        <BankStatementDialog account={dialogState.payload} type="vault" />
      </MDialog>
      {/* <MDialog
        isOpen={dialogState.state === "bank_statement"}
        title={`Relevé bancaire de ${dialogState.payload?.name}`}
        onClose={function (): void {
          setDialogState({ state: "none" });
        }}
      >

        <BankStatementDialog vault={dialogState.payload} />
      </MDialog> */}

      <Title>Caisse</Title>
      <div className="flex justify-center gap-x-2 w-full">
        {VAULT_GROUPS.filter((group) =>
          user?.assigned_vault_groups.includes(group.id)
        ).map((group) => (
          <button
            onClick={() => {
              setSearchParams((params) => {
                params.set("group", group.id.toString());
                params.set("page", "1");
                return params;
              });
            }}
            className={`py-2 px-3 rounded font-medium ${parseInt(searchParams.get("group") ?? "1") === group.id ? "bg-primary text-white" : ""}`}
          >
            {group.name}
          </button>
        ))}
      </div>
      <div className="flex justify-end w-full gap-x-2 ">
        {/* <SearchBar
                                        id="search-bar"
                                        onChange={onSearchChange}
                                        placeholder="Chercher"
                                        className="w-full flex-1 lg:w-[300px]"
                                /> */}
        <OutlinedButton
          className="rounded-lg p-2"
          onClick={() => {
            handlePrint();
          }}
        >
          Imprimer
        </OutlinedButton>
      </div>
      <table className="hidden w-full text-center text-lg lg:table">
        <thead className="">
          <tr className="font-bold text-gray">
            <th className="text-medium w-[30%] py-3 text-left text-base">
              Caisse
            </th>
            <th className="text-medium py-3 text-base">Numéro de caisse</th>
            <th className="text-medium py-3 text-base">Montant</th>
            <th className="text-medium py-3 text-base">Actions</th>
          </tr>
        </thead>
        {!vaultsData ? (
          <TableBodySquelette columnCount={3} />
        ) : (
          <tbody>
            {vaultsData?.map((vault, i) => (
              <Tr>
                <Td className="p-0 px-0 pl-0 text-left">{vault.name}</Td>
                <Td className="font-medium">{vault.code}</Td>
                <Td className="font-medium">{formatAmount(vault.balance)}</Td>
                <Td className="font-medium">
                  <div className="gap-x-4 justify-center flex">
                    <button
                      onClick={() => {
                        setDialogState({
                          state: "bank_statement",
                          payload: vault,
                        });
                      }}
                    >
                      <BankStatementIcon />
                    </button>
                    <button
                      onClick={() => {
                        setDialogState({
                          state: "editing",
                          payload: vault,
                        });
                      }}
                    >
                      <EditIcon />
                    </button>
                  </div>
                </Td>
              </Tr>
            ))}
          </tbody>
        )}
      </table>
      <div
        ref={printRef}
        className="absolute print:opacity-100 opacity-0 -z-50 scale-0 text-sm print:scale-100 pointer-events-none"
      >
        <PrintPage>
          <h1 className="text-center text-2xl font-medium my-10">
            Solde des caisses
          </h1>
          <table className="text-center w-full">
            <thead>
              <tr className="bg-slate-100">
                <th className="border ">Caisse</th>
                <th className="border ">Numéro de caisse</th>
                <th className="border ">Montant</th>
              </tr>
            </thead>
            <tbody>
              {vaultsData?.map((vault, i) => (
                <tr key={i}>
                  <td className="border">{vault.name}</td>
                  <td className="border">{vault.code}</td>
                  <td className="border">{formatAmount(vault.balance)}</td>
                </tr>
              ))}
              <tr>
                <td colSpan={2} className="border"></td>
                <td className="border">{formatAmount(total ?? 0)}</td>
              </tr>
            </tbody>
          </table>
          <div className="pt-4">
            Arrêté à la somme de{" : "}{" "}
            {numberToFrench(parseInt(total?.toString() ?? "0")) + " ouguiyas"}
          </div>
        </PrintPage>
      </div>
    </div>
  );
}
