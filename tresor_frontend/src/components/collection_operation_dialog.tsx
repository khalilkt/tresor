import { useContext, useEffect, useRef, useState } from "react";
import {
  AccountInterface,
  CollectionOperationDetail,
  CollectionOperationInterface,
} from "../logiC/interfaces";
import { AuthContext } from "../App";
import { rootUrl } from "../constants";
import { Td, Tr } from "./table";
import axios from "axios";
import { FilledButton, OutlinedButton } from "./buttons";
import { PrintIcon } from "./icons";
import { useReactToPrint } from "react-to-print";
import { PrintPage } from "./print_page";
import { Select } from "./comps";
import { formatAmount, numberToFrench } from "../logiC/utils";

export default function CollectionOpearionDetailDialog({ id }: { id: number }) {
  const printRef = useRef<HTMLDivElement>(null);
  const [selectedOption, setSelectedOption] = useState<
    "all" | "detail" | string
  >("all");

  const handlePrint = useReactToPrint({
    onBeforeGetContent() {},
    content: () => {
      return printRef.current;
    },
    onAfterPrint: () => {},
  });

  const [data, setData] = useState<CollectionOperationInterface | null>(null);
  const token = useContext(AuthContext).authData!.token;
  async function init() {
    try {
      let url = rootUrl;
      url += "collections/";

      const response = await axios.get(url + id + "/", {
        headers: {
          Authorization: "Token " + token,
        },
      });
      setData(response.data);
    } catch (e) {
      console.log(e);
    }
  }

  function donwloadFile(file: string) {
    const a = document.createElement("a");
    a.href = file;
    a.download = file;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  }

  useEffect(() => {
    init();
  }, [id]);

  //we shouuld group the details by bank name and add the total amount for each bank
  let groupedDetails: {
    bank_name: string;
    total: number;
  }[] = [];

  let groupedByBank: {
    account_data: AccountInterface;
    details: {
      name: string;
      cheque_number: string;
      montant: number;
    }[];
  }[] = [];

  for (const detail of data?.details || []) {
    let index = groupedByBank.findIndex(
      (group) => group.account_data.name === detail.account_data.name
    );
    if (index === -1) {
      groupedByBank.push({
        account_data: detail.account_data,
        details: [
          {
            name: detail.name,
            cheque_number: detail.cheque_number,
            montant: detail.montant,
          },
        ],
      });
    } else {
      groupedByBank[index].details.push({
        name: detail.name,
        cheque_number: detail.cheque_number,
        montant: detail.montant,
      });
    }
  }

  if (data) {
    data.details.forEach((detail) => {
      let index = groupedDetails.findIndex(
        (group) => group.bank_name === detail.account_data.name
      );
      if (index === -1) {
        groupedDetails.push({
          bank_name: detail.account_data.name,
          total: detail.montant,
        });
      } else {
        groupedDetails[index].total += detail.montant;
      }
    });
  }

  const filteredDetails =
    selectedOption === "all" || selectedOption === "detail"
      ? data?.details
      : data?.details.filter(
          (detail) => detail.account_data.name === selectedOption
        );

  const banks_names = groupedDetails.map((detail) => detail.bank_name);

  const tableHeaders =
    selectedOption === "all" || selectedOption === "detail"
      ? ["BANQUE", "MOTANT"]
      : ["N° CHEQUE", "PARTIE VERSANT", "MONTANT"];
  const detailsData =
    selectedOption === "all" || selectedOption === "detail"
      ? groupedDetails
      : filteredDetails;

  return (
    <div className="grid grid-cols-2 flex-col gap-y-3 w-[600px]">
      {data ? (
        <>
          {data.type === "operation" && (
            <>
              <div className="flex flex-col gap-y-1">
                <span className="font-semibold">Bénéficiaire:</span>
                <span>{data.beneficiaire}</span>
              </div>

              <div className="flex flex-col gap-y-1">
                <span className="font-semibold">Motif:</span>
                <span>{data.motif}</span>
              </div>
            </>
          )}
          <div className="flex flex-col gap-y-1">
            <span className="font-semibold">Montant:</span>
            <span>{formatAmount(data.total) + " MRU"}</span>
          </div>
          <div className="flex flex-col gap-y-1">
            <span className="font-semibold">Date:</span>
            <span>{data.date.toString()}</span>
          </div>
          {/* ref */}
          <div className="flex flex-col gap-y-1">
            <span className="font-semibold">Référence:</span>
            <span>{data.ref}</span>
          </div>

          {(data.type === "operation" || data.type === "versement") && (
            <>
              <div className="flex col-span-2 w-full justify-end gap-x-2">
                <Select
                  className="w-min"
                  value={selectedOption}
                  onChange={(e) => {
                    setSelectedOption(e.target.value);
                  }}
                >
                  <option value="all">Ordre</option>
                  <option value="detail">Détails</option>

                  {banks_names.map((name) => (
                    <option value={name}>{name}</option>
                  ))}
                </Select>
                {data.file && (
                  <OutlinedButton
                    onClick={() => {
                      donwloadFile(data.file!);
                    }}
                  >
                    Fichier
                  </OutlinedButton>
                )}
                {data.type === "operation" && (
                  <FilledButton
                    onClick={() => {
                      handlePrint();
                    }}
                    className="self-end flex gap-x-2"
                  >
                    <PrintIcon />
                    Imprimer
                  </FilledButton>
                )}
              </div>

              <div className="col-span-2 overflow-auto w-full overscroll-y-scroll max-h-[400px]">
                <table className="text-center w-full">
                  <thead>
                    <tr className="font-bold text-gray">
                      {tableHeaders.map((header, i) => (
                        <th className="text-medium py-3">{header}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {detailsData?.map((detail, i) => (
                      <Tr key={i}>
                        {"name" in detail ? (
                          <>
                            <Td>{detail.cheque_number}</Td>
                            <Td>{detail.name}</Td>
                            <Td>{formatAmount(detail.montant)}</Td>
                          </>
                        ) : (
                          <>
                            <Td>{detail.bank_name}</Td>
                            <Td>{formatAmount(detail.total)}</Td>
                          </>
                        )}
                      </Tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}
          <div
            ref={printRef}
            className={
              true
                ? "absolute print:opacity-100 opacity-0 -z-50 pointer-events-none"
                : ""
            }
          >
            {selectedOption === "detail" &&
              groupedByBank.map((group) => (
                <PrintPage>
                  <div className="flex flex-col gap-y-3 pt-8 pb-6">
                    <h3 className="text-base font-medium">
                      Ordre
                      {" d'encaissement "}
                      N° {data.ref}
                    </h3>
                    <div className="flex gap-x-1">
                      <span className="font-medium">BANQUE:</span>
                      <span>{group.account_data.name}</span>
                      <span className="font-medium ml-32">N° DE COMPTE: </span>
                      <span>{group.account_data.number}</span>
                    </div>
                  </div>

                  <table className="text-center w-full">
                    <thead>
                      <tr className="font-semibold bg-slate-100 text-center border">
                        <th className="py-1 border  text-center ">N° CHEQUE</th>

                        <th className="py-1 border  text-center ">
                          PARTIE VERSEMENT
                        </th>
                        <th className="py-1 border  text-center ">MONTANT</th>
                      </tr>
                    </thead>
                    <tbody className=" text-start ">
                      {group.details.map((detail, i) => (
                        <tr className="" key={i}>
                          <td className="border  text-center">
                            {detail.cheque_number}
                          </td>
                          <td className="border ">{detail.name}</td>

                          <td className="border  text-end">
                            {formatAmount(detail.montant)}
                          </td>
                        </tr>
                      ))}
                      <tr className="">
                        <td className="" colSpan={2}></td>
                        <td className="border  text-end">
                          {formatAmount(
                            group.details.reduce(
                              (acc, curr) => acc + curr.montant,
                              0
                            )
                          )}
                        </td>
                      </tr>
                    </tbody>
                  </table>
                  <div className="mt-4 self-end text-centerr flex flex-col font-semibold items-end">
                    <span className="text-center mr-5">Le Directeur</span>
                    <span className="text-center">Mohamed ZEIDANE</span>
                  </div>
                </PrintPage>
              ))}
            {selectedOption !== "detail" && (
              <PrintPage>
                {selectedOption === "all" && (
                  <div className="mt-2 mb-5 w-full text-center flex-col gap-y-2 items-center ">
                    <h3 className=" text-2xl font-semibold text-center">
                      Ordre
                      {" d'encaissement "}
                      N° {data.ref}
                    </h3>
                  </div>
                )}
                <div className="flex flex-col gap-y-3 pt-8 pb-6">
                  {selectedOption === "all" ? (
                    <>
                      <div className="flex gap-x-1">
                        <span className="font-semibold">Montant:</span>
                        <span>{formatAmount(data.total) + " MRU"}</span>
                      </div>
                      <div className="flex gap-x-1">
                        <span className="font-semibold">Motif:</span>
                        <span>{data.motif}</span>
                      </div>
                      <div className="flex gap-x-1">
                        <span className="font-semibold">Bénéficiaire:</span>
                        <span>{data.beneficiaire}</span>
                      </div>
                    </>
                  ) : (
                    <>
                      <h3 className="text-base font-semibold">
                        Ordre
                        {" d'encaissement "}
                        N° {data.ref}
                      </h3>
                      <div className="flex gap-x-1">
                        <span className="font-semibold">BANQUE:</span>
                        <span>{selectedOption}</span>
                      </div>
                      {selectedOption !== "all" &&
                        selectedOption !== "detail" && (
                          <div className="flex gap-x-1">
                            <span className="font-medium">N° DE COMPTE: </span>
                            <span>
                              {
                                data.details.find(
                                  (detail) =>
                                    detail.account_data.name === selectedOption
                                )?.account_data.number
                              }
                            </span>
                          </div>
                        )}
                    </>
                  )}
                </div>
                <table className="text-center w-full">
                  <thead>
                    <tr className="font-semibold bg-slate-100 text-center border-t border-r border-l">
                      {tableHeaders.map((header, i) => (
                        <th className="py-1 border-r  text-center ">
                          {header}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className=" text-start ">
                    {detailsData?.map((detail, i) => (
                      <tr className="last:border-b" key={i}>
                        {"name" in detail ? (
                          <>
                            <td className="border-r border-l  text-center">
                              {detail.cheque_number}
                            </td>
                            <td className="border-r border-l text-center">
                              {detail.name}
                            </td>
                            <td className="border-r border-l  text-center">
                              {formatAmount(detail.montant)}
                            </td>
                          </>
                        ) : (
                          <>
                            <td className="border-r border-l ">
                              {detail.bank_name}
                            </td>

                            <td className="border-r border-l  text-end">
                              {formatAmount(detail.total)}
                            </td>
                          </>
                        )}
                      </tr>
                    ))}
                  </tbody>
                </table>
                <div className="pt-4">
                  Arrêté le présent ordre à la somme de{" : "}{" "}
                  {numberToFrench(data.total) + " ouguiyas"}
                </div>
                <div className="mt-4 self-end text-centerr flex flex-col font-semibold items-end">
                  <span className="text-center mr-5">Le Directeur</span>
                  <span className="text-center">Mohamed ZEIDANE</span>
                </div>
              </PrintPage>
            )}
          </div>
        </>
      ) : (
        <div>Chargement...</div>
      )}
    </div>
  );
}
