import { useContext, useEffect, useRef, useState } from "react";
import { MDialog } from "../components/dialog";
import { AccountInterface } from "../logiC/interfaces";
import { Pagination, TableBodySquelette, Td, Tr } from "../components/table";
import { Input, PrintButton, SearchBar, Title } from "../components/comps";
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

function AddEditAccountDialog({
  onSubmit,
  account,
}: {
  onSubmit: (data: { name: string; number: string; balance: number }) => void;
  account: AccountInterface | null;
}) {
  useEffect(() => {
    if (account) {
      (document.getElementById("name") as HTMLInputElement).value =
        account.name;
      (document.getElementById("balance") as HTMLInputElement).value =
        account.balance.toString();
      (document.getElementById("number") as HTMLInputElement).value =
        account.number;
    }
  }, [account]);

  return (
    <div className="flex flex-col">
      <div className="flex w-full flex-col gap-y-4 lg:w-[400px]">
        <Input
          type="text"
          id="name"
          placeholder="Banque"
          className={`border-gray-300 border p-2 ${account ? "hidden" : ""}`}
        />

        <Input
          type="number"
          id="balance"
          placeholder="Montant"
          className="border-gray-300 border p-2"
        />
        <Input
          type="text"
          id="number"
          placeholder="Numéro de compte"
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
            const number = (
              document.getElementById("number") as HTMLInputElement
            ).value;

            if (isNaN(balance)) {
              alert("Montant doit être un nombre");
              return;
            }

            onSubmit({ name, balance, number });
          }}
        >
          {account ? "Modifier" : "Ajouter"}
        </FilledButton>
      </div>
    </div>
  );
}

export default function AccountsPage() {
  const [accountsData, setAccountsData] = useState<AccountInterface[] | null>(
    null
  );

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
    state: "bank_statement" | "adding" | "none" | "editing";
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

    try {
      const response = await axios.get(rootUrl + "accounts", {
        headers: {
          Authorization: "Token " + token,
        },
        params,
      });
      console.log(response.data);
      setAccountsData(response.data);
    } catch (e) {
      console.log(e);
    }
  }

  async function deleteAccount(id: number) {
    try {
      // pass the data and the token
      const response = await axios.delete(rootUrl + "accounts/" + id + "/", {
        headers: {
          Authorization: "Token " + token,
        },
      });
      load();
      console.log(response.data);
    } catch (e) {
      console.log(e);
    }
  }

  async function updateAccount(
    name: string,
    balance: number,
    number: string,
    id: number
  ) {
    try {
      // pass the data and the token
      const response = await axios.patch(
        rootUrl + "accounts/" + id + "/",
        {
          name: name,
          balance: balance,
          number: number,
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

  async function createAccount(name: string, balance: number, number: string) {
    try {
      // pass the data and the token
      const response = await axios.post(
        rootUrl + "accounts/",
        {
          name: name,
          balance: balance,
          number: number,
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

  const total = accountsData?.reduce((acc, account) => {
    if (typeof account.balance !== "number") {
      return acc + parseFloat(account.balance);
    }
    return acc + account.balance;
  }, 0);

  return (
    <div className="flex flex-col items-start gap-y-10 px-8 pb-12 pt-12 lg:px-10 lg:pb-0 lg:pt-20l">
      <MDialog
        isOpen={dialogState.state === "adding"}
        title="Ajouter un compte"
        onClose={function (): void {
          setDialogState({ state: "none" });
        }}
      >
        <AddEditAccountDialog
          account={null}
          onSubmit={function (data): void {
            createAccount(data.name, data.balance, data.number);
          }}
        />
      </MDialog>
      <MDialog
        isOpen={dialogState.state === "editing"}
        title="Modifier un compte"
        onClose={function (): void {
          setDialogState({ state: "none" });
        }}
      >
        <AddEditAccountDialog
          account={dialogState.payload}
          onSubmit={function (data): void {
            updateAccount(
              data.name,
              data.balance,
              data.number,
              dialogState.payload.id
            );
          }}
        />
      </MDialog>
      <MDialog
        isOpen={dialogState.state === "bank_statement"}
        title={`Relevé bancaire de ${dialogState.payload?.name}`}
        onClose={function (): void {
          setDialogState({ state: "none" });
        }}
      >
        <BankStatementDialog account={dialogState.payload} type="account" />
      </MDialog>

      <Title>Comptes</Title>
      <div className="flex justify-end w-full gap-x-2 ">
        {/* <SearchBar
          id="search-bar"
          onChange={onSearchChange}
          placeholder="Chercher"
          className="w-full flex-1 lg:w-[300px]"
        /> */}
        <PrintButton onTap={() => handlePrint()} />

        {/* <OutlinedButton
          className="rounded-lg p-2"
          onClick={() => {
            handlePrint();
          }}
        >
          Imprimer
        </OutlinedButton> */}
        <FilledButton
          className="rounded-lg bg-primary p-2 text-white"
          onClick={() => {
            setDialogState({ state: "adding" });
          }}
        >
          Ajouter
        </FilledButton>
      </div>
      <table className="hidden w-full text-center text-lg lg:table">
        <thead className="">
          <tr className="font-bold text-gray">
            <th className="text-medium w-[30%] py-3 text-left text-base">
              Banque
            </th>
            <th className="text-medium py-3 text-base">Numéro de compte</th>
            <th className="text-medium py-3 text-base">Solde</th>
            <th className="text-medium py-3 text-base">Actions</th>
          </tr>
        </thead>
        {!accountsData ? (
          <TableBodySquelette columnCount={3} />
        ) : (
          <tbody>
            {accountsData?.map((account, i) => (
              <Tr>
                <Td className="p-0 px-0 pl-0 text-left">{account.name}</Td>
                <Td className="font-medium">{account.number}</Td>
                <Td className="font-medium">{formatAmount(account.balance)}</Td>
                <Td className="font-medium">
                  <div className="gap-x-4 justify-center flex">
                    <button
                      onClick={() => {
                        setDialogState({
                          state: "bank_statement",
                          payload: account,
                        });
                      }}
                    >
                      <BankStatementIcon />
                    </button>
                    <button
                      onClick={() => {
                        setDialogState({
                          state: "editing",
                          payload: account,
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
        className="absolute print:opacity-100 opacity-0 -z-50 scale-0 print:scale-100 pointer-events-none text-sm"
      >
        <PrintPage>
          <h1 className="text-center text-2xl font-medium my-10">
            Solde des comptes bancaires
          </h1>
          <table className="text-center w-full">
            <thead>
              <tr className="bg-slate-100">
                <th className="border ">Banque</th>
                <th className="border ">Numéro de compte</th>
                <th className="border ">Solde</th>
              </tr>
            </thead>
            <tbody>
              {accountsData?.map((account, i) => (
                <tr key={i}>
                  <td className="border">{account.name}</td>
                  <td className="border">{account.number}</td>
                  <td className="border">{formatAmount(account.balance)}</td>
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
