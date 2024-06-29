import { useContext, useEffect, useState } from "react";
import { AccountInterface } from "../logiC/interfaces";
import { Input } from "./comps";
import axios from "axios";
import { rootUrl } from "../constants";
import { AuthContext } from "../App";
import { TableBodySquelette, Td, Tr } from "./table";
import { FilledButton } from "./buttons";
import { PrintPage } from "./print_page";
import { useReactToPrint } from "react-to-print";
import React from "react";
import { formatAmount, formatDate } from "../logiC/utils";

interface ReleveInterface {
  end_date_balance: number;
  start_date_balance: number;
  data: {
    date: string;
    amount: number;
    operation_name: string;
    type: "disbursement" | "collection";
    meta_data: {
      [key: string]: string;
    };
  }[];
}

export function BankStatementDialog({
  account,
}: {
  account: AccountInterface;
}) {
  const [data, setData] = useState<ReleveInterface | null>(null);
  const [startDate, setStartDate] = useState<string>("");
  const [endDate, setEndDate] = useState<string>("");
  const token = useContext(AuthContext).authData?.token;

  const printRef = React.createRef<HTMLDivElement>();

  const handlePrint = useReactToPrint({
    onBeforeGetContent() {},
    content: () => {
      return printRef.current;
    },
    onAfterPrint: () => {},
  });

  async function fetch() {
    if (!startDate || !endDate) return;
    setData(null);
    try {
      const ret = await axios.get(`${rootUrl}/accounts/${account.id}/releve`, {
        params: { start_date: startDate, end_date: endDate },
        headers: {
          Authorization: "Token " + token,
        },
      });
      setData(ret.data);
    } catch (e) {
      console.log(e);
    }
  }

  useEffect(() => {
    fetch();
  }, [account, startDate, endDate]);

  return (
    <div className="flex flex-col w-[600px]">
      <div className="flex justify-between">
        <Input
          type="date"
          id="start_date"
          placeholder="Date de début"
          className="border-gray-300 border p-2"
          value={startDate}
          onChange={(e) => setStartDate(e.target.value)}
        />
        <Input
          type="date"
          id="end_date"
          placeholder="Date de fin"
          className="border-gray-300 border p-2"
          value={endDate}
          onChange={(e) => setEndDate(e.target.value)}
        />
      </div>
      <div className="mt-10 text-center h-[600px] ">
        {!startDate || !endDate ? (
          <div className="text-center text-slate-700">
            Veuillez choisir une date de début et une date de fin
          </div>
        ) : !data ? (
          <span className="text-center text-slate-700">Chargement...</span>
        ) : (
          <div className="px-3 flex flex-col">
            <FilledButton
              className="text-primary font-semibold self-end my-5"
              onClick={() => {
                handlePrint();
              }}
            >
              Imprimer
            </FilledButton>
            <table className="hidden w-full text-center text-lg lg:table">
              <thead className="">
                <tr className="font-bold text-gray">
                  <th className="text-medium w-[30%] py-3 text-left text-base">
                    DATE
                  </th>
                  <th className="text-medium py-3 text-base w-1/2">LIBELLE</th>
                  <th className="text-medium py-3 text-base">CREDIT</th>
                  <th className="text-medium py-3 text-base">DEBIT</th>
                </tr>
              </thead>
              {!data ? (
                <TableBodySquelette columnCount={4} />
              ) : (
                <tbody>
                  {data.data?.map((releve, i) => (
                    <Tr>
                      <Td className="p-0 px-0 pl-0 text-left">{releve.date}</Td>
                      <Td className="font-medium">{releve.operation_name}</Td>
                      <Td className="font-medium">
                        {releve.type === "collection" ? releve.amount : ""}
                      </Td>
                      <Td className="font-medium">
                        {releve.type === "disbursement" ? releve.amount : ""}
                      </Td>
                    </Tr>
                  ))}
                </tbody>
              )}
            </table>
          </div>
        )}
      </div>
      <div
        className=" absolute -z-50 opacity-0 print:opacity-100"
        ref={printRef}
      >
        <PrintPage>
          <div className="flex justify-between mb-4">
            <span>
              Report de solde au {formatDate(startDate)} :{"   "}{" "}
              {formatAmount(data?.start_date_balance || 0)}
            </span>
            <span>
              Relevé du {formatDate(startDate)} au {formatDate(endDate)}
            </span>
          </div>
          <table className="text-center w-full">
            <thead>
              <tr className="font-bold bg-slate-100 text-center border-l">
                <th className="py-1 border text-center">Date</th>
                <th className="py-1 border text-center w-1/2">Libelle</th>
                <th className="py-1 border text-center w-1/4">Credit</th>
                <th className="py-1 border text-center w-1/4">Debit</th>
              </tr>
            </thead>
            <tbody className=" text-start ">
              {data?.data.map((detail, i) => (
                <tr className="last:border-b" key={i}>
                  <td className=" border pr-4 text-start w-min">
                    {formatDate(detail.date)}
                  </td>
                  <td className=" border px-1 text-start">
                    {detail.operation_name}
                  </td>
                  <td className=" border px-1 text-end">
                    {detail.type === "collection"
                      ? formatAmount(detail.amount)
                      : ""}
                  </td>
                  <td className=" border px-1 text-end">
                    {detail.type === "disbursement"
                      ? formatAmount(detail.amount)
                      : ""}
                  </td>
                </tr>
              ))}
              <tr>
                <td colSpan={2} className="  border px-1 text-end span">
                  Total Débit/Total Crédit
                </td>
                <td className=" border px-1 text-end">
                  {formatAmount(
                    data?.data.reduce((acc, cur) => {
                      return cur.type === "collection" ? acc + cur.amount : acc;
                    }, 0) || 0
                  )}
                </td>
                <td className=" border px-1 text-end">
                  {formatAmount(
                    data?.data.reduce((acc, cur) => {
                      return cur.type === "disbursement"
                        ? acc + cur.amount
                        : acc;
                    }, 0) || 0
                  )}
                </td>
              </tr>
              <tr className="bg-slate-100">
                <td colSpan={2} className="px-1 py-4 text-end span">
                  Solde du compte
                </td>
                <td colSpan={2} className="text-center py-4">
                  {formatAmount(data?.end_date_balance || 0)}
                </td>
              </tr>
            </tbody>
          </table>
        </PrintPage>
      </div>
    </div>
  );
}
