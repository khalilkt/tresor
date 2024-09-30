import { useContext, useEffect, useRef, useState } from "react";
import {
  DisbursementOperationDetail,
  DisbursementOperationInterface,
} from "../logiC/interfaces";
import { AuthContext } from "../App";
import { rootUrl } from "../constants";
import { Td, Tr } from "./table";
import axios, { all } from "axios";
import { FilledButton, OutlinedButton } from "./buttons";
import { PrintIcon } from "./icons";
import { useReactToPrint } from "react-to-print";
import { PrintPage } from "./print_page";
import { PrintButton, Select } from "./comps";
import { formatAmount, numberToFrench } from "../logiC/utils";
import signature from "../assets/signature.png";

export default function DisbursementOperationDetailDialog({
  id,
}: {
  id: number;
}) {
  const showSignature = useContext(AuthContext).showSignature;
  const isAdmin = useContext(AuthContext).authData?.user?.is_admin;
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

  const [data, setData] = useState<DisbursementOperationInterface | null>(null);
  const token = useContext(AuthContext).authData!.token;
  async function init() {
    try {
      let url = rootUrl;
      url += "disbursements/";

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

  useEffect(() => {
    init();
  }, [id]);

  //we shouuld group the details by bank name and add the total amount for each bank
  let groupedDetails: {
    bank_name: string;
    total: number;
  }[] = [];

  if (data) {
    data.details.forEach((detail) => {
      let index = groupedDetails.findIndex(
        (group) => group.bank_name === detail.banq_name
      );
      if (index === -1) {
        groupedDetails.push({
          bank_name: detail.banq_name,
          total: detail.montant,
        });
      } else {
        groupedDetails[index].total += detail.montant;

        // groupedDetails[index].total =
        //   Math.round(groupedDetails[index].total * 100) / 100;
      }
    });
  }
  let groupedByBank: {
    bank_name: string;
    details: {
      name: string;
      banq_number: string;
      montant: number;
    }[];
  }[] = [];

  for (const detail of data?.details || []) {
    let index = groupedByBank.findIndex(
      (group) => group.bank_name === detail.banq_name
    );
    if (index === -1) {
      groupedByBank.push({
        bank_name: detail.banq_name,
        details: [
          {
            name: detail.name,
            banq_number: detail.banq_number,
            montant: detail.montant,
          },
        ],
      });
    } else {
      groupedByBank[index].details.push({
        name: detail.name,
        banq_number: detail.banq_number,
        montant: detail.montant,
      });
    }
  }

  function donwloadFile(file: string) {
    if (file.includes("http://")) {
      file = file.replace("http://", "https://");
    }
    const a = document.createElement("a");
    a.href = file;
    a.download = file;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  }

  // const filteredDetails =
  //   selectedOption === "all" || selectedOption === "detail"
  //     ? data?.details
  //     : data?.details.filter((detail) => detail.banq_name === selectedOption);
  const banks_names = groupedDetails.map((detail) => detail.bank_name);

  const tableHeaders =
    selectedOption === "all" || selectedOption === "detail"
      ? ["Banque", "Montant"]
      : ["Nom", "Numéro de compte", "Montant"];
  // const detailsData =
  //   selectedOption === "all" || selectedOption === "detail"
  //     ? groupedDetails
  //     : filteredDetails;

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
            <span className="font-semibold">Compte d'opération:</span>
            <span>{data.account_name}</span>
          </div>
          <div className="flex flex-col gap-y-1">
            <span className="font-semibold">Montant:</span>
            <span>{formatAmount(data.total) + " MRU"}</span>
          </div>
          <div className="flex flex-col gap-y-1">
            <span className="font-semibold">Date:</span>
            <span>{data.date.toString()}</span>
          </div>
          <div className="flex flex-col gap-y-1">
            <span className="font-semibold">Référence:</span>
            <span>{data.ref}</span>
          </div>

          {data.type === "operation" && (
            <>
              <div className="flex mb-4 col-span-2 w-full justify-end gap-x-2">
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
                <PrintButton
                  showSignatureChoice={true}
                  onTap={() => handlePrint()}
                />

                {/* <FilledButton
                  onClick={() => {
                    handlePrint();
                  }}
                  className="self-end flex gap-x-2"
                >
                  <PrintIcon />
                  Imprimer
                </FilledButton> */}
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
                    {selectedOption === "all" || selectedOption === "detail"
                      ? groupedDetails.map((detail, i) => {
                          return (
                            <Tr key={i}>
                              <Td>{detail.bank_name}</Td>
                              <Td>{formatAmount(detail.total)}</Td>
                            </Tr>
                          );
                        })
                      : groupedByBank
                          .find(
                            (detail) => detail.bank_name === selectedOption
                          )!
                          .details.map((detail, i) => {
                            return (
                              <Tr key={i}>
                                <Td>{detail.name}</Td>
                                <Td>{detail.banq_number}</Td>
                                <Td>{formatAmount(detail.montant)}</Td>
                              </Tr>
                            );
                          })}
                  </tbody>
                </table>
              </div>
            </>
          )}
          <div
            ref={printRef}
            className="absolute print:opacity-100 opacity-0 -z-50 pointer-events-none"
          >
            {selectedOption !== "all" &&
              groupedByBank
                .filter(
                  (detail) =>
                    selectedOption === "detail" ||
                    detail.bank_name === selectedOption
                )
                .map((group) => (
                  <PrintPage>
                    <div className="flex flex-col gap-y-3 pt-8 pb-6 text-sm">
                      <h3 className="text-base font-medium">
                        Ordre
                        {" de décaissement "}
                        N° {data.ref}
                      </h3>
                      <div className="flex gap-x-1">
                        <span className="font-medium">BANQUE:</span>
                        <span>{group.bank_name}</span>
                      </div>
                    </div>

                    <table className="text-center w-full">
                      <thead>
                        <tr className="font-semibold bg-slate-100 text-center border">
                          <th className="py-1 border  text-center ">Nom</th>
                          <th className="py-1 border  text-center ">
                            Numéro de compte
                          </th>
                          <th className="py-1 border  text-center ">MONTANT</th>
                        </tr>
                      </thead>
                      <tbody className=" text-start ">
                        {group.details.map((detail, i) => (
                          <tr className="" key={i}>
                            <td className="border ">{detail.name}</td>

                            <td className="border  text-center">
                              {detail.banq_number}
                            </td>
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
                    <div className="pt-4">
                      Arrêté le présent ordre à la somme de{" : "}{" "}
                      {numberToFrench(
                        group.details.reduce(
                          (acc, curr) => acc + curr.montant,
                          0
                        )
                      ) + " ouguiyas"}
                    </div>
                    <div className="mt-4 self-end text-centerr flex flex-col font-semibold items-end">
                      <span className="text-center mr-5">Le Directeur</span>
                      <span className="text-center">Mohamed ZEIDANE</span>
                      {showSignature && isAdmin && (
                        <img src={signature} className="w-24 h-24 mr-4 mt-2" />
                      )}
                    </div>
                  </PrintPage>
                ))}
            {selectedOption === "all" && (
              <PrintPage>
                {selectedOption === "all" && (
                  <div className="mt-2 mb-5 w-full text-center flex-col gap-y-2 items-center text-sm">
                    <h3 className=" text-2xl font-semibold text-center">
                      Ordre
                      {" de décaissement "}
                      N° {data.ref}
                    </h3>
                    <h6 className="text-center">
                      Compte trésor N°: {data.account_data.number}
                      {"  "}
                      {data.account_name}
                    </h6>
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
                        {" de décaissement "}
                        N° {data.ref}
                      </h3>
                      <div className="flex gap-x-1">
                        <span className="font-semibold">BANQUE:</span>
                        <span>{selectedOption}</span>
                      </div>
                    </>
                  )}
                </div>
                <table className="text-center w-full">
                  <thead>
                    <tr className="font-bold bg-slate-100 text-center border-t border-r border-l">
                      {tableHeaders.map((header, i) => (
                        <th className="py-1 border-r  text-center">{header}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className=" text-start ">
                    {groupedDetails.map((detail, i) => (
                      <tr className="last:border-b" key={i}>
                        {
                          <>
                            <td className="border-r border-l text-left">
                              {detail.bank_name}
                            </td>
                            <td className="border-r border-l text-right">
                              {formatAmount(detail.total)}
                            </td>
                          </>
                        }
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
                  {showSignature && isAdmin && (
                    <img src={signature} className="w-24 h-24 mr-4 mt-2" />
                  )}
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
