import { useContext, useEffect, useRef, useState } from "react";
import { MDialog } from "../components/dialog";
import {
  VaultDepositInterface,
  PaginatedData,
  CollectionOperationInterface,
  VaultInterface,
} from "../logiC/interfaces";
import { Pagination, TableBodySquelette, Td, Tr } from "../components/table";
import { Input, SearchBar, Select, Textarea, Title } from "../components/comps";
import { FilledButton } from "../components/buttons";
import axios, { AxiosError } from "axios";
import { rootUrl } from "../constants";
import { AuthContext } from "../App";
import { useSearchParams } from "react-router-dom";
import * as XLSX from "xlsx";
import {
  DeleteIcon,
  LoadingIcon,
  MdpIcon,
  MoreIcon,
  PrintIcon,
  ViewIcon,
} from "../components/icons";
import { formatAmount, formatDate } from "../logiC/utils";

export const ALLOWED_BANK_NAMES = [
  "ATTIJARI BANK",
  "AUB",
  "BAMIS",
  "BCI",
  "BCM",
  "BEA",
  "BFI",
  "BIM",
  "BMCI",
  "BMI",
  "BMS",
  "BNM",
  "BPM",
  "CCP",
  "CHINGUITTI BANK",
  "DFI",
  "GBM",
  "IBM",
  "NBM",
  "ORABANK",
  "SGM",
  "TRESOR",
];
type VaultDepositForm = Omit<
  VaultDepositInterface,
  "id" | "created_at" | "vault_name" | "vault"
> & {
  vault: number | null;
};

function CreateVaultDialog({
  onSubmit,
}: {
  onSubmit: (data: VaultDepositForm) => Promise<void>;
}) {
  const accounts = useContext(AuthContext).authData!.accounts;

  const [isSubmitting, setIsSubmitting] = useState(false);

  const [vaults, setVaults] = useState<VaultInterface[] | null>(null);

  const [formData, setFormData] = useState<VaultDepositForm>({
    vault: null,
    amount: 0,
    motif: "",
  });

  const token = useContext(AuthContext).authData!.token;

  const isReadyToSubmit =
    formData.vault !== null && formData.amount > 0 && formData.motif.length > 0;
  function loadVaults() {
    axios
      .get(rootUrl + "vaults/", {
        headers: {
          Authorization: "Token " + token,
        },
      })
      .then((response) => {
        setVaults(response.data);
      })
      .catch((e) => {
        console.log(e);
      });
  }

  useEffect(() => {
    loadVaults();
  }, []);

  return (
    <div className="flex w-full flex-col gap-y-4 lg:w-[400px]">
      <Select
        value={formData.vault ?? ""}
        onChange={(e) =>
          setFormData({
            ...formData,
            vault: parseInt(e.target.value),
          })
        }
      >
        <option value="" disabled>
          Caisse
        </option>
        {(vaults ?? []).map((vault) => (
          <option value={vault.id}>{vault.name}</option>
        ))}
      </Select>
      <Textarea
        placeholder="Motif"
        value={formData.motif}
        onChange={(e) =>
          setFormData({
            ...formData,
            motif: e.target.value,
          })
        }
      />
      <Input
        placeholder="Montant"
        value={formData.amount}
        onChange={(e) => {
          let value = parseInt(e.target.value);
          if (isNaN(value)) {
            value = 0;
          }
          setFormData({
            ...formData,
            amount: value,
          });
        }}
      />

      <FilledButton
        className="rounded-lg bg-primary p-2 text-white disabled:opacity-50"
        disabled={!isReadyToSubmit || isSubmitting}
        onClick={async () => {
          if (isReadyToSubmit) {
            setIsSubmitting(true);
            try {
              await onSubmit(formData);
            } catch (e) {}
            setIsSubmitting(false);
          }
        }}
      >
        Ajouter
        <LoadingIcon className={`ml-2 ${isSubmitting ? "" : "hidden"}`} />
      </FilledButton>

      {/* <pre>{JSON.stringify(formData.details, null, 2)}</pre> */}
    </div>
  );
}

export default function VaultDepositsPage() {
  const [isExportDialogOpen, setIsVaultCreateDialog] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  const [vaultDepositData, setVaultDepositData] =
    useState<PaginatedData<VaultDepositInterface> | null>(null);

  const [searchParams, setSearchParams] = useSearchParams();

  const token = useContext(AuthContext).authData!.token;
  const searchTimer = useRef<NodeJS.Timeout>();
  const isAdmin = useContext(AuthContext).authData!.user.is_admin;

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
      const response = await axios.get(rootUrl + "vaults/deposit", {
        headers: {
          Authorization: "Token " + token,
        },
        params,
      });
      setVaultDepositData(response.data);
    } catch (e) {
      console.log(e);
    }
  }

  async function deleteDeposit(id: number) {
    try {
      // pass the data and the token
      const response = await axios.delete(
        rootUrl + "vaults/deposit/" + id + "/",
        {
          headers: {
            Authorization: "Token " + token,
          },
        }
      );
      load();
      console.log(response.data);
    } catch (e) {
      if (axios.isAxiosError(e)) {
        const data = e.response?.data;
        if (data === "NOT_ENOUGH_BALANCE") {
          alert("Le solde est insuffisant.");
        }
      } else {
        alert("Une erreur s'est produite. Veuillez réessayer.");
      }
    }
  }

  async function createVaultDeposit(data: VaultDepositForm) {
    try {
      const response = await axios.post(
        rootUrl + "vaults/deposit/",
        {
          ...data,
          file: null,
        },
        {
          headers: {
            Authorization: "Token " + token,
          },
        }
      );
      load();
      setIsVaultCreateDialog(false);
      console.log(response.data);
    } catch (e) {
      console.log(e);
      if (axios.isAxiosError(e)) {
        const error = e as AxiosError;
        const errorData = error.response?.data as { [key: string]: string[] };
        if (errorData && errorData.details) {
          if (errorData.details[0] === "NOT_ENOUGH_BALANCE") {
            alert("Solde insuffisant dans le compte d'opération.");
            return;
          }
        }
        alert("Une erreur s'est produite. Veuillez réessayer.");
      }
    }
  }
  return (
    <div className="flex flex-col items-start gap-y-10 px-8 pb-12 pt-12 lg:px-10 lg:pb-0 lg:pt-20l">
      <MDialog
        isOpen={isExportDialogOpen}
        title="Ajouter une operation de depot"
        onClose={function (): void {
          setIsVaultCreateDialog(false);
        }}
      >
        <CreateVaultDialog
          onSubmit={async function (data) {
            await createVaultDeposit(data);
          }}
        />
      </MDialog>
      <MDialog
        isOpen={deletingId !== null}
        title="Supprimer une operation de depot"
        onClose={() => {
          setDeletingId(null);
        }}
      >
        <div className="flex flex-col gap-y-4">
          <p>Voulez-vous vraiment supprimer cette opération ?</p>
          <div className="flex gap-x-4">
            <FilledButton
              onClick={() => {
                if (deletingId) {
                  deleteDeposit(deletingId);
                  setDeletingId(null);
                }
              }}
            >
              Oui
            </FilledButton>
            <FilledButton
              onClick={() => {
                setDeletingId(null);
              }}
            >
              Non
            </FilledButton>
          </div>
        </div>
      </MDialog>

      <Title>Operation de depots</Title>
      <div className="flex justify-between w-full">
        <SearchBar
          id="search-bar"
          onChange={onSearchChange}
          placeholder="Chercher"
          className="w-full flex-1 lg:w-[300px]"
        />
        <FilledButton
          className="rounded-lg bg-primary p-2 text-white"
          onClick={() => {
            setIsVaultCreateDialog(true);
          }}
        >
          Ajouter
        </FilledButton>
      </div>
      <table className="hidden w-full text-center text-lg lg:table">
        <thead className="">
          <tr className="font-bold text-gray">
            <th className="text-medium w-[25%] py-3 text-start text-base">
              Motif
            </th>
            <th className="text-medium py-3 text-start text-base">Caisse</th>

            <th className="text-medium py-3 text-start text-base">Montant</th>
            <th className="text-medium py-3 text-start text-base">Date</th>
            {/* {isAdmin && (
              <th className="text-medium py-3 text-start text-base">Agent</th>
            )} */}
            {isAdmin && (
              <th className="text-medium py-3 text-start text-base">Actions</th>
            )}
          </tr>
        </thead>
        {!vaultDepositData ? (
          <TableBodySquelette columnCount={isAdmin ? 7 : 6} />
        ) : (
          <tbody>
            {vaultDepositData.data?.map((deposit, i) => (
              <Tr>
                <Td className="p-0 px-0 pl-0 text-start">{deposit.motif}</Td>
                <Td className="p-0 px-0 pl-0 text-start">
                  {deposit.vault_name}
                </Td>
                <Td className="p-0 px-0 pl-0 font-medium text-start">
                  {formatAmount(deposit.amount)}
                </Td>
                <Td className="p-0 px-0 pl-0 font-medium text-start">
                  {formatDate(deposit.created_at.split("T")[0])}
                </Td>
                {/* {isAdmin && (
                  <Td className="p-0 px-0 pl-0 text-start">
                    {deposit.created_by_name}
                  </Td>
                )} */}
                <Td className="p-0 px-0 pl-0">
                  <div className="flex gap-x-2 justify-start">
                    {isAdmin && (
                      <button
                        onClick={() => {
                          setDeletingId(deposit.id);
                        }}
                      >
                        <DeleteIcon />
                      </button>
                    )}
                  </div>
                </Td>
              </Tr>
            ))}
          </tbody>
        )}
      </table>
      <Pagination
        className="mb-10 mt-6 lg:mt-10"
        onItemClick={(page) => {
          setSearchParams((params) => {
            params.set("page", page.toString());
            return params;
          });
          // if mobile scroll to the top
          window.scrollTo(0, 0);
        }}
        current={
          searchParams.get("page") ? parseInt(searchParams.get("page")!) : 1
        }
        total={vaultDepositData?.total_pages ?? 1}
      />
    </div>
  );
}
