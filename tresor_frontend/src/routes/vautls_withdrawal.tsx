import { useContext, useEffect, useRef, useState } from "react";
import { MDialog } from "../components/dialog";
import {
  VaultWithdrawalInterface,
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
import { VAULT_GROUPS } from "./vaults_deposit";

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
type VaultWithdrawalForm = Omit<
  VaultWithdrawalInterface,
  "id" | "created_at" | "vault_name" | "vault" | "account_name"
> & {
  vault: number | null;
  account: number | null;
};

function CreateVaultWithdrawalDialog({
  onSubmit,
  selectedGroup,
}: {
  onSubmit: (data: VaultWithdrawalForm) => Promise<void>;
  selectedGroup: number;
}) {
  const accounts = useContext(AuthContext).authData!.accounts;
  const [type, setType] = useState<"normal" | "fund_transfer">("normal");

  const [isSubmitting, setIsSubmitting] = useState(false);

  const [vaults, setVaults] = useState<VaultInterface[] | null>(null);

  const [formData, setFormData] = useState<VaultWithdrawalForm>({
    account: null,
    vault: null,
    amount: 0,
    motif: "",
  });

  const token = useContext(AuthContext).authData!.token;

  let isReadyToSubmit =
    formData.vault !== null && formData.amount > 0 && formData.motif.length > 0;
  const selectedVault =
    vaults?.find((vault) => vault.id === formData.vault) ?? null;
  if (selectedVault?.can_fund_transfer && type === "fund_transfer") {
    isReadyToSubmit = isReadyToSubmit && formData.account !== null;
  }
  function loadVaults() {
    axios
      .get(rootUrl + "vaults/", {
        headers: {
          Authorization: "Token " + token,
        },
      })
      .then((response) => {
        setVaults(
          (response.data as VaultInterface[]).filter(
            (vault) => vault.group === selectedGroup
          )
        );
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
      {selectedGroup === 1 && (
        <div className="w-full justify-center flex gap-x-3">
          <button
            onClick={() => {
              setType("normal");
              setFormData({
                ...formData,
                account: null,
              });
            }}
            className={`py-2 px-3 rounded font-medium transition-all ${type === "normal" ? "bg-primary text-white" : ""}`}
          >
            Paiement espèces
          </button>
          <button
            onClick={() => {
              setType("fund_transfer");
            }}
            className={`py-2 px-3 rounded font-medium transition-all ${type === "fund_transfer" ? "bg-primary text-white" : ""}`}
          >
            Dégagemnt de fonds
          </button>
        </div>
      )}
      <Select
        value={formData.vault ?? ""}
        onChange={(e) => {
          setFormData({
            ...formData,
            vault: parseInt(e.target.value),
            account: null,
          });
        }}
      >
        <option value="" disabled>
          Caisse
        </option>
        {(vaults ?? []).map((vault) => (
          <option value={vault.id}>{vault.name}</option>
        ))}
      </Select>
      {type === "fund_transfer" && (
        <Select
          value={formData.account ?? ""}
          onChange={(e) => {
            setFormData({
              ...formData,
              account: parseInt(e.target.value),
            });
          }}
        >
          <option value="" disabled>
            Compte
          </option>
          {accounts.map((account) => (
            <option value={account.id}>{account.name}</option>
          ))}
        </Select>
      )}
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
              if (type !== "fund_transfer") {
                formData.account = null;
              }
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

export default function VaultWithdrawalsPage() {
  const [isExportDialogOpen, setIsVaultCreateDialog] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  const [vaultWithdrawalData, setVaultWithdrawalData] =
    useState<PaginatedData<VaultWithdrawalInterface> | null>(null);

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
      if (!params.has("group")) {
        params.set("group", "1");
        params.set("page", "1");
      }
      const response = await axios.get(rootUrl + "vaults/withdrawal", {
        headers: {
          Authorization: "Token " + token,
        },
        params,
      });
      setVaultWithdrawalData(response.data);
    } catch (e) {
      console.log(e);
    }
  }

  async function deleteWithdrawal(id: number) {
    try {
      // pass the data and the token
      const response = await axios.delete(
        rootUrl + "vaults/withdrawal/" + id + "/",
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

  async function createVaultWithdrawal(data: VaultWithdrawalForm) {
    try {
      const response = await axios.post(
        rootUrl + "vaults/withdrawal/",
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
        title="Ajouter une operation de retrait"
        onClose={function (): void {
          setIsVaultCreateDialog(false);
        }}
      >
        <CreateVaultWithdrawalDialog
          onSubmit={async function (data) {
            await createVaultWithdrawal(data);
          }}
          selectedGroup={parseInt(searchParams.get("group") ?? "1")}
        />
      </MDialog>
      <MDialog
        isOpen={deletingId !== null}
        title="Supprimer une operation de retrait"
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
                  deleteWithdrawal(deletingId);
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

      <Title>Opérations de retrait</Title>
      <div className="flex justify-center gap-x-2 w-full">
        {VAULT_GROUPS.map((group) => (
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
        {!vaultWithdrawalData ? (
          <TableBodySquelette columnCount={isAdmin ? 7 : 6} />
        ) : (
          <tbody>
            {vaultWithdrawalData.data?.map((withdrawal, i) => (
              <Tr>
                <Td className="p-0 px-0 pl-0 text-start">{withdrawal.motif}</Td>
                <Td className="p-0 px-0 pl-0 text-start">
                  {withdrawal.vault_name}
                </Td>
                <Td className="p-0 px-0 pl-0 font-medium text-start">
                  {formatAmount(withdrawal.amount)}
                </Td>
                <Td className="p-0 px-0 pl-0 font-medium text-start">
                  {formatDate(withdrawal.created_at.split("T")[0])}
                </Td>
                {/* {isAdmin && (
                                    <Td className="p-0 px-0 pl-0 text-start">
                                        {withdrawal.created_by_name}
                                    </Td>
                                )} */}
                <Td className="p-0 px-0 pl-0">
                  <div className="flex gap-x-2 justify-start">
                    {isAdmin && (
                      <button
                        onClick={() => {
                          setDeletingId(withdrawal.id);
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
        total={vaultWithdrawalData?.total_pages ?? 1}
      />
    </div>
  );
}
