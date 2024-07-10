import { ReactNode, useContext, useEffect, useState } from "react";
import { Input, Select, Title } from "../components/comps";
import { useSearchParams } from "react-router-dom";
import axios from "axios";
import { AuthContext } from "../App";
import { rootUrl } from "../constants";
import { numberToFrench } from "../logiC/utils";
import { DateFilter } from "../components/date_filter";

function Tile({ title, value }: { title: ReactNode; value: ReactNode }) {
  return (
    <div className="flex flex-col items-center gap-y-2 p-4 bg-white rounded-lg shadow border border-gray">
      <h3 className="text-3xl font-semibold text-primary">{value}</h3>
      <p className="text-gray">{title}</p>
    </div>
  );
}

export default function DashboardPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const token = useContext(AuthContext).authData?.token;

  const [data, setData] = useState<{
    total_solde: number;
    total_disbursement: number;
    total_collection: number;
    collections_count: number;
    disbursements_count: number;
    accounts_count: number;

    groups_stats: {
      [key: string]: {
        total_vault_solde: number;
        total_vault_deposit: number;
        total_vault_withdrawal: number;
        deposits_count: number;
        withdrawals_count: number;
      };
    };
  } | null>(null);

  let selectedDateRange: "days" | "months" | "years" | null = null;
  if (searchParams.has("date")) {
    const selectedDate = searchParams.get("date");
    if (selectedDate?.split("-").length === 3) {
      selectedDateRange = "days";
    } else if (selectedDate?.split("-").length === 2) {
      selectedDateRange = "months";
    } else if (selectedDate?.split("-").length === 1) {
      selectedDateRange = "years";
    }
  }

  useEffect(() => {
    load();
  }, [searchParams]);

  async function load() {
    try {
      const res = await axios.get(rootUrl + "stats/", {
        headers: {
          Authorization: `Token ${token}`,
        },
        params: Object.fromEntries(searchParams),
      });
      setData(res.data);
    } catch (e) {
      alert("Une erreur s'est produite. Veuillez réessayer.");
      console.log(e);
    }
  }

  return (
    <div className="flex flex-col items-start gap-y-10 px-8 pb-12 pt-12 lg:px-10 lg:pb-0 lg:pt-20l">
      <Title className="text-2xl">
        Tableau de bord
        {/* {numberToFrench(4382147.23)} */}
      </Title>
      <div className="flex gap-x-4">
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
      </div>
      <div className="grid grid-cols-1 gap-y-6 lg:grid-cols-3 gap-x-8 w-full">
        <div className="flex flex-col items-center gap-y-2 p-4 bg-white rounded-lg shadow border border-gray ">
          <h3 className="text-3xl font-semibold text-primary">
            {data?.total_collection}
            {" MRU"}
          </h3>
          <p className="text-gray">Total des encaissements</p>
        </div>
        <div className="flex flex-col items-center gap-y-2 p-4 bg-white rounded-lg shadow border border-gray">
          <h3 className="text-3xl font-semibold text-primary">
            {data?.total_disbursement}
            {" MRU"}
          </h3>
          <p className="text-gray">Total des décaissements</p>
        </div>
        <div className="flex flex-col items-center gap-y-2 p-4 bg-white rounded-lg shadow border border-gray">
          <h3 className="text-3xl font-semibold text-primary">
            {data?.total_solde}
            {" MRU"}
          </h3>
          <p className="text-gray">Solde</p>
        </div>
        {!searchParams.get("date") && (
          <div className="flex flex-col items-center gap-y-2 p-4 bg-white rounded-lg shadow border border-gray">
            <h3 className="text-3xl font-semibold text-primary">
              {data?.collections_count}
            </h3>
            <p className="text-gray">Nombre d'encaissements</p>
          </div>
        )}
        <div className="flex flex-col items-center gap-y-2 p-4 bg-white rounded-lg shadow border border-gray">
          <h3 className="text-3xl font-semibold text-primary">
            {data?.disbursements_count}
          </h3>
          <p className="text-gray">Nombre de décaissements</p>
        </div>
        {!searchParams.get("date") && (
          <div className="flex flex-col items-center gap-y-2 p-4 bg-white rounded-lg shadow border border-gray">
            <h3 className="text-3xl font-semibold text-primary">
              {data?.accounts_count}
            </h3>
            <p className="text-gray">Nombre de comptes</p>
          </div>
        )}

        <hr className="my-4 col-span-3 border-gray w-[80%] mx-auto" />
        <div className="col-span-3 flex flex-col gap-y-10 mb-10">
          {data?.groups_stats &&
            Object.entries(data.groups_stats).map(([key, value]) => (
              <div className="flex flex-col gap-y-4 w-full">
                <h1 className="font-semibold">{key}</h1>
                <div className="grid grid-cols-3 gap-x-10">
                  <Tile
                    key={key}
                    title={`Solde`}
                    value={value.total_vault_solde + " MRU"}
                  />
                  <Tile
                    key={key}
                    title="Total des reccettes"
                    value={value.total_vault_deposit + " MRU"}
                  />
                  <Tile
                    key={key}
                    title="Total des retraits"
                    value={value.total_vault_withdrawal + " MRU"}
                  />
                </div>
              </div>
            ))}
        </div>
      </div>
    </div>
  );
}
