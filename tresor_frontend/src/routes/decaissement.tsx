import { useContext, useEffect, useRef, useState } from "react";
import { MDialog } from "../components/dialog";
import {
  DisbursementOperationInterface,
  DisbursementOperationDetail,
  PaginatedData,
  CollectionOperationInterface,
} from "../logiC/interfaces";
import { Pagination, TableBodySquelette, Td, Tr } from "../components/table";
import { Input, SearchBar, Select, Textarea, Title } from "../components/comps";
import { FilledButton, OutlinedButton } from "../components/buttons";
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
import DisbursementOperationDetailDialog from "../components/disbusement_operation_dialog";
import { formatAmount } from "../logiC/utils";
import { DateFilter } from "../components/date_filter";
import { PrintPage } from "../components/print_page";
import React from "react";
import { useReactToPrint } from "react-to-print";

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
type DisbursementOperationForm = Omit<
  DisbursementOperationInterface,
  | "id"
  | "created_at"
  | "updated_at"
  | "total"
  | "account_name"
  | "account_data"
  | "ref"
  | "created_by_name"
  | "file"
> & { file: File | null };

function ExcelImportDialog({
  onSubmit,
  type,
}: {
  onSubmit: (data: DisbursementOperationForm) => Promise<void>;
  type: DisbursementOperationType;
}) {
  const accounts = useContext(AuthContext).authData!.accounts;

  const [isSubmitting, setIsSubmitting] = useState(false);

  const [formData, setFormData] = useState<DisbursementOperationForm>({
    account: accounts[0].id,
    beneficiaire: "",
    motif: "",
    details: [],
    date: new Date().toISOString().split("T")[0],
    type: "operation",
    file: null,
  });

  useEffect(() => {
    if (type === "frais") {
      setFormData({
        ...formData,
        type: type,
        details: [
          {
            montant: 0,
            name: "-",
            banq_name: "-",
            banq_number: "-",
            created_at: new Date().toISOString(),
          },
        ],
        beneficiaire: "-",
        file: null,
      });
    }
  }, []);

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const arrayBuffer = e.target?.result as ArrayBuffer;
      const workbook = XLSX.read(arrayBuffer, { type: "array" });

      const firstSheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[firstSheetName];

      const jsonData = XLSX.utils.sheet_to_json<any[]>(worksheet, {
        header: 1,
      });
      const extractedData = processExcelData(jsonData);

      if (extractedData) {
        // check if the bank name is allowed

        const bankNames = extractedData.map((data) => data.banq_name);
        const invalidBankNames = bankNames.filter(
          (name) => !ALLOWED_BANK_NAMES.includes(name)
        );
        if (invalidBankNames.length > 0) {
          alert(
            "Les banques suivantes ne sont pas autorisées : " +
              invalidBankNames.join(", ")
          );
          return;
        } else {
          setFormData({ ...formData, details: extractedData, file: file });
        }
      }
    };

    reader.readAsArrayBuffer(file);
  };

  const processExcelData = (
    data: any[][]
  ): DisbursementOperationDetail[] | null => {
    const columnsToSearch = ["Nom", "Banque", "Compte", "Montant"];
    const columnsName: { [key: string]: string } = {
      Nom: "name",
      Banque: "banq_name",
      Compte: "banq_number",
      Montant: "montant",
    };
    let headerRowIndex = 0;
    let headerRow: any[] = data[headerRowIndex];
    let columnIndices: { [key: string]: number } = {};

    // Loop to find the header row with at least one of the specified columns
    while (headerRowIndex < data.length) {
      columnIndices = {};
      headerRow = data[headerRowIndex];

      columnsToSearch.forEach((column) => {
        const columnIndex = headerRow.findIndex(
          (value) => value?.toString().toLowerCase() === column.toLowerCase()
        );
        console.log("found", columnIndex, column);
        if (columnIndex !== -1) {
          columnIndices[column] = columnIndex;
        }
      });

      if (Object.keys(columnIndices).length === columnsToSearch.length) {
        break;
      }
      headerRowIndex++;
    }

    if (Object.keys(columnIndices).length === 0) {
      console.error("None of the specified columns were found");
      alert("Certaines colonnes n'ont pas été trouvées dans le fichier.");

      return null;
    }
    if (Object.keys(columnIndices).length < columnsToSearch.length) {
      console.error("Some columns were not found");
      alert("Certaines colonnes n'ont pas été trouvées dans le fichier.");
      return null;
    }

    // Extract the data for each specified column
    let extractedData: DisbursementOperationDetail[] = [];

    for (let i = headerRowIndex + 1; i < data.length; i++) {
      const row = data[i];
      let item: any = {};
      for (let [columnName, columnIndex] of Object.entries(columnIndices)) {
        item[columnsName[columnName]] = row[columnIndex];
      }

      if (
        !Object.values(item).some(
          (value) => value === "" || value === null || value === undefined
        )
      ) {
        extractedData.push(item);
      }
    }

    console.log(extractedData);
    return extractedData;
  };

  const isReadyToSubmit =
    formData.details.length > 0 &&
    formData.account &&
    formData.beneficiaire &&
    formData.motif &&
    (formData.type === "operation" || formData.details[0].montant > 0);

  return (
    <div className="flex w-full flex-col gap-y-4 lg:w-[400px]">
      <div className="gap-x-2 hidden">
        <button
          className={`flex-1 p-2 rounded-lg ${
            formData.type === "operation"
              ? "bg-primary text-white"
              : "bg-gray-200"
          }`}
          onClick={() =>
            setFormData({
              ...formData,
              type: "operation",
              details: [],
              beneficiaire: "",
              file: null,
            })
          }
        >
          Opération
        </button>
        <button
          className={`flex-1 p-2 rounded-lg ${
            formData.type === "frais" ? "bg-primary text-white" : "bg-gray-200"
          }`}
          onClick={() => {
            setFormData({
              ...formData,
              type: "frais",
              details: [
                {
                  montant: 0,
                  name: "-",
                  banq_name: "-",
                  banq_number: "-",
                  created_at: new Date().toISOString(),
                },
              ],
              beneficiaire: "-",
              file: null,
            });
          }}
        >
          Frais
        </button>
      </div>
      {/* <hr className="w-32 self-center mb-2" /> */}
      {formData.type === "operation" && (
        <div className="flex items-center justify-center w-full">
          <label
            className={`flex flex-col items-center justify-center w-full h-64 border-2 border-dashed rounded-lg cursor-pointer bg-gray-50 dark:hover:bg-bray-800 dark:bg-gray-700 hover:bg-gray-100 dark:border-gray-600 dark:hover:border-gray-500 dark:hover:bg-gray-600 ${formData.details.length > 0 ? "border-primary" : "border-gray-300"}`}
          >
            {formData.details.length > 0 ? (
              <div className="flex flex-col items-center justify-center pt-5 pb-6">
                <svg
                  className="w-8 h-8 mb-4 text-primary"
                  aria-hidden="true"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 20 16"
                >
                  <path
                    stroke="currentColor"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M13 13h3a3 3 0 0 0 0-6h-.025A5.56 5.56 0 0 0 16 6.5 5.5 5.5 0 0 0 5.207 5.021C5.137 5.017 5.071 5 5 5a4 4 0 0 0 0 8h2.167M10 15V6m0 0L8 8m2-2 2 2"
                  />
                </svg>
                <p className="mb-2 text-sm text-primary">
                  <span className="font-semibold">Fichier importé</span>
                </p>
                {/* print some infos about the data */}
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {formData.details.length} lignes importées
                </p>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center pt-5 pb-6">
                <svg
                  className="w-8 h-8 mb-4 text-gray-500 dark:text-gray-400"
                  aria-hidden="true"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 20 16"
                >
                  <path
                    stroke="currentColor"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M13 13h3a3 3 0 0 0 0-6h-.025A5.56 5.56 0 0 0 16 6.5 5.5 5.5 0 0 0 5.207 5.021C5.137 5.017 5.071 5 5 5a4 4 0 0 0 0 8h2.167M10 15V6m0 0L8 8m2-2 2 2"
                  />
                </svg>
                <p className="mb-2 text-sm text-gray-500 dark:text-gray-400">
                  <span className="font-semibold">
                    Cliquez pour télécharger
                  </span>{" "}
                  ou glisser pour déposer
                </p>
              </div>
            )}
            <input
              id="file"
              onChange={handleFileUpload}
              type="file"
              className="hidden"
            />
          </label>
        </div>
      )}
      <Select
        value={formData.account}
        onChange={(e) =>
          setFormData({
            ...formData,
            account: parseInt(e.target.value),
          })
        }
      >
        {accounts.map((account) => (
          <option value={account.id}>{account.name}</option>
        ))}
      </Select>
      <Input
        type="date"
        value={formData.date}
        onChange={(e) => setFormData({ ...formData, date: e.target.value })}
      />
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
      {formData.type === "operation" ? (
        <>
          <Input
            placeholder="Bénéficiaire"
            value={formData.beneficiaire}
            onChange={(e) =>
              setFormData({
                ...formData,
                beneficiaire: e.target.value,
              })
            }
          />
        </>
      ) : (
        <Input
          placeholder="Montant"
          value={formData.details[0].montant}
          type="number"
          step="0.01"
          onChange={(e) => {
            setFormData({
              ...formData,
              details: [
                {
                  ...formData.details[0],
                  montant: parseFloat(parseFloat(e.target.value).toFixed(2)),
                },
              ],
            });
          }}
        />
      )}
      {formData.details.length > 0 && formData.type === "operation" && (
        <span className="text-red-700">
          Total :{" "}
          {formData.details.reduce((acc, detail) => acc + detail.montant, 0)}
        </span>
      )}
      {/* <pre>
        {
          // show the data in a map
          JSON.stringify(formData, null, 2)
        }
      </pre> */}
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

type DisbursementOperationType = "operation" | "frais";

export default function DecaissementPage() {
  const [isExportDialogOpen, setIsExportDialogOpen] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [disbursementsData, setDisbursementsData] =
    useState<PaginatedData<DisbursementOperationInterface> | null>(null);
  const printRef = React.createRef<HTMLDivElement>();

  const handlePrint = useReactToPrint({
    onBeforeGetContent() {},
    content: () => {
      return printRef.current;
    },
    onAfterPrint: () => {},
  });

  const [searchParams, setSearchParams] = useSearchParams();
  const userList = useContext(AuthContext).authData!.users;

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
    if (!params.get("type")) {
      params.set("type", selectedType);
    }
    try {
      const response = await axios.get(rootUrl + "disbursements", {
        headers: {
          Authorization: "Token " + token,
        },
        params,
      });
      setDisbursementsData(response.data);
    } catch (e) {
      console.log(e);
    }
  }

  async function deleteDisbursement(id: number) {
    try {
      // pass the data and the token
      const response = await axios.delete(
        rootUrl + "disbursements/" + id + "/",
        {
          headers: {
            Authorization: "Token " + token,
          },
        }
      );
      load();
      console.log(response.data);
    } catch (e) {
      console.log(e);
      alert("Une erreur s'est produite. Veuillez réessayer.");
    }
  }

  async function createDisbursementOperation(data: DisbursementOperationForm) {
    try {
      const file = data.file;

      // in data.detatils we need to make sure the montat after . is 2
      data.details = data.details.map((detail) => {
        return {
          ...detail,
          montant: parseFloat(parseFloat(detail.montant.toString()).toFixed(2)),
        };
      });

      const response = await axios.post(
        rootUrl + "disbursements/",
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
      const id = response.data.id;
      if (file) {
        const formData = new FormData();
        formData.append("file", file);
        await axios.patch(rootUrl + "disbursements/" + id + "/", formData, {
          headers: {
            Authorization: "Token " + token,
            "Content-Type": "multipart/form-data",
          },
        });
      }

      load();
      setIsExportDialogOpen(false);
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

  const selectedType: DisbursementOperationType = (searchParams.get("type") ??
    "operation") as DisbursementOperationType;

  const selectedDate = searchParams.get("date");
  const selectedUserName = searchParams.get("created_by")
    ? userList.find(
        (user) => user.id === parseInt(searchParams.get("created_by")!)
      )?.name
    : null;
  return (
    <div className="flex flex-col items-start gap-y-10 px-8 pb-12 pt-12 lg:px-10 lg:pb-0 lg:pt-20l">
      <MDialog
        isOpen={isExportDialogOpen}
        title="Ajouter une operation de décaissement"
        onClose={function (): void {
          setIsExportDialogOpen(false);
        }}
      >
        <ExcelImportDialog
          onSubmit={async function (data) {
            await createDisbursementOperation(data);
          }}
          type={selectedType}
        />
      </MDialog>
      <MDialog
        isOpen={deletingId !== null}
        title="Supprimer l'opération de décaissement"
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
                  deleteDisbursement(deletingId);
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
      <MDialog
        isOpen={searchParams.has("selected_id")}
        title="Détails de l'opération de décaissement"
        onClose={() => {
          setSearchParams((params) => {
            params.delete("selected_id");
            return params;
          });
        }}
      >
        <DisbursementOperationDetailDialog
          id={parseInt(searchParams.get("selected_id")!)}
        />
      </MDialog>

      <Title>Operation de Décaissement</Title>
      <div className="flex justify-center gap-x-4 w-full">
        {["operation", "frais"].map((type) => (
          <button
            onClick={() => {
              setSearchParams((params) => {
                params.set("type", type);
                params.set("page", "1");
                return params;
              });
            }}
            className={`py-2 px-3 rounded font-medium transition-all ${selectedType === type ? "bg-primary text-white" : ""}`}
          >
            {type.toUpperCase()}
          </button>
        ))}
      </div>
      <div className="flex justify-between w-full">
        <div className="flex gap-x-3">
          <SearchBar
            id="search-bar"
            onChange={onSearchChange}
            placeholder="Chercher"
            className="w-full flex-1 lg:w-[300px]"
          />
          <DateFilter
            date={searchParams.get("date")}
            onChange={(date) => {
              setSearchParams((params) => {
                if (date) {
                  params.set("date", date);
                } else {
                  params.delete("date");
                }
                return params;
              });
            }}
          />
          <Select
            value={searchParams.get("created_by") ?? ""}
            onChange={(e) => {
              setSearchParams((params) => {
                if (e.target.value) {
                  params.set("created_by", e.target.value);
                } else {
                  params.delete("created_by");
                }
                params.set("page", "1");

                return params;
              });
            }}
          >
            <option value="">Tous les agents</option>
            {isAdmin &&
              userList.map((user) => (
                <option value={user.id}>{user.name}</option>
              ))}
          </Select>
        </div>
        <div className="flex gap-x-4">
          <OutlinedButton
            onClick={() => {
              handlePrint();
            }}
          >
            Imprimer
          </OutlinedButton>
          <FilledButton
            className="rounded-lg bg-primary p-2 text-white"
            onClick={() => {
              setIsExportDialogOpen(true);
            }}
          >
            Ajouter
          </FilledButton>
        </div>
      </div>
      <table className="hidden w-full text-center text-lg lg:table">
        <thead className="">
          <tr className="font-bold text-gray">
            <th className="text-medium w-[25%] py-3 text-start text-base">
              Motif
            </th>
            {selectedType === "operation" && (
              <th className="text-medium py-3 text-start text-base">OD</th>
            )}

            <th className="text-medium py-3 text-start text-base">
              Compte d'opération
            </th>
            <th className="text-medium py-3 text-start text-base">Montant</th>
            <th className="text-medium py-3 text-start text-base">Date</th>
            {isAdmin && (
              <th className="text-medium py-3 text-start text-base">Agent</th>
            )}
            <th className="text-medium py-3 text-start text-base">Actions</th>
          </tr>
        </thead>
        {!disbursementsData ? (
          <TableBodySquelette columnCount={isAdmin ? 7 : 6} />
        ) : (
          <tbody>
            {disbursementsData.data?.map((disbursementOperation, i) => (
              <Tr>
                <Td className="p-0 px-0 pl-0 text-start">
                  {disbursementOperation.motif}
                </Td>
                {selectedType === "operation" && (
                  <Td className="p-0 px-0 pl-0 font-medium text-start">
                    {disbursementOperation.ref.split("/")[0]}
                  </Td>
                )}
                <Td className="p-0 px-0 pl-0 text-start">
                  {disbursementOperation.account_name}
                </Td>
                <Td className="p-0 px-0 pl-0 font-medium text-start">
                  {formatAmount(disbursementOperation.total)}
                </Td>
                <Td className="p-0 px-0 pl-0 font-medium text-start">
                  {disbursementOperation.date.toString()}
                </Td>
                {isAdmin && (
                  <Td className="p-0 px-0 pl-0 text-start">
                    {disbursementOperation.created_by_name}
                  </Td>
                )}
                <Td className="p-0 px-0 pl-0">
                  <div className="flex gap-x-2">
                    <button
                      onClick={() => {
                        setSearchParams((params) => {
                          params.set(
                            "selected_id",
                            disbursementOperation.id.toString()
                          );
                          return params;
                        });
                      }}
                    >
                      <ViewIcon />
                    </button>
                    {isAdmin && (
                      <button
                        onClick={() => {
                          setDeletingId(disbursementOperation.id);
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
      <div
        ref={printRef}
        className="-z-50 opacity-0 print:opacity-100 absolute"
      >
        <PrintPage>
          <h2 className="text-xl mb-4 text-center ">
            Operation de Décaissement ({selectedType})
          </h2>
          {selectedDate && (
            <h3 className="mb-2 ">
              Date : <span className="font-semibold">{selectedDate}</span>
            </h3>
          )}
          {selectedUserName && (
            <h3 className="mb-4 ">
              Agent : <span className="font-semibold">{selectedUserName}</span>
            </h3>
          )}

          <table className="w-full text-center text-sm">
            <thead className="">
              <tr className="font-semibold text-black">
                <th className="text-medium w-[25%] py-3  text-center border">
                  Motif
                </th>
                {selectedType === "operation" && (
                  <th className="text-medium py-2 text-center border">OD</th>
                )}
                <th className="text-medium py-2 text-center border">
                  Compte d'opération
                </th>
                <th className="text-medium py-2 text-center border">Montant</th>
                <th className="text-medium py-2 text-center border">Date</th>
              </tr>
            </thead>
            {!disbursementsData ? (
              <TableBodySquelette columnCount={5} />
            ) : (
              <tbody>
                {disbursementsData.data?.map((disbursementOperation, i) => (
                  <tr>
                    <td className="p-0 px-0 pl-0 text-start border">
                      {disbursementOperation.motif}
                    </td>
                    {selectedType === "operation" && (
                      <td className="p-0 px-0 pl-0 font-medium text-start border">
                        {disbursementOperation.ref.split("/")[0]}
                      </td>
                    )}
                    <td className="p-0 px-0 pl-0 text-start border">
                      {disbursementOperation.account_name}
                    </td>
                    <td className="p-0 px-0 pl-0 font-medium text-start border">
                      {formatAmount(disbursementOperation.total)}
                    </td>
                    <td className="p-0 px-0 pl-0 font-medium text-start border">
                      {disbursementOperation.date.toString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            )}
          </table>
        </PrintPage>
      </div>
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
        total={disbursementsData?.total_pages ?? 1}
      />
    </div>
  );
}
