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
import { FilledButton } from "../components/buttons";
import axios, { AxiosError } from "axios";
import { rootUrl } from "../constants";
import { AuthContext } from "../App";
import { useSearchParams } from "react-router-dom";
import * as XLSX from "xlsx";
import {
  LoadingIcon,
  MdpIcon,
  MoreIcon,
  PrintIcon,
  ViewIcon,
} from "../components/icons";
import DisbursementOperationDetailDialog from "../components/disbusement_operation_dialog";

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
}: {
  onSubmit: (data: DisbursementOperationForm) => Promise<void>;
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
        setFormData({ ...formData, details: extractedData, file: file });
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
      <div className="flex gap-x-2">
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
            });
          }}
        >
          Frais
        </button>
      </div>
      <hr className="w-32 self-center mb-2" />
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
          onChange={(e) => {
            let value = parseInt(e.target.value);
            if (isNaN(value)) {
              value = 0;
            }
            setFormData({
              ...formData,
              details: [{ ...formData.details[0], montant: value }],
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

export default function DecaissementPage() {
  const [isExportDialogOpen, setIsExportDialogOpen] = useState(false);
  const [disbursementsData, setDisbursementsData] =
    useState<PaginatedData<DisbursementOperationInterface> | null>(null);

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
    }
  }

  async function createDisbursementOperation(data: DisbursementOperationForm) {
    try {
      const file = data.file;

      if (!file) {
        alert("Veuillez importer un fichier.");
        return;
      }

      alert("file :" + file.name);
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
        />
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
            setIsExportDialogOpen(true);
          }}
        >
          Ajouter
        </FilledButton>
      </div>
      <table className="hidden w-full text-center text-lg lg:table">
        <thead className="">
          <tr className="font-bold text-gray">
            <th className="text-medium w-[30%] py-3 text-start text-base">
              Motif
            </th>
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
          <TableBodySquelette columnCount={3} />
        ) : (
          <tbody>
            {disbursementsData.data?.map((disbursementOperation, i) => (
              <Tr>
                <Td className="p-0 px-0 pl-0 text-start">
                  {disbursementOperation.motif}
                </Td>
                <Td className="p-0 px-0 pl-0 text-start">
                  {disbursementOperation.account_name}
                </Td>
                <Td className="p-0 px-0 pl-0 font-medium text-start">
                  {disbursementOperation.total.toString() + " MRU"}
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
        total={disbursementsData?.total_pages ?? 1}
      />
    </div>
  );
}
