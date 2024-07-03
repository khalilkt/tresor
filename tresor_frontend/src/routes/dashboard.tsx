import { useContext, useEffect, useState } from "react";
import { Input, Select, Title } from "../components/comps";
import { useSearchParams } from "react-router-dom";
import axios from "axios";
import { AuthContext } from "../App";
import { rootUrl } from "../constants";
import { numberToFrench } from "../logiC/utils";

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
        <Select
          onChange={(e) => {
            const value = e.target.value;
            setSearchParams((params) => {
              if (value === "days") {
                params.set("date", new Date().toISOString().split("T")[0]);
              } else if (value === "months") {
                params.set(
                  "date",
                  new Date().toISOString().split("-").slice(0, 2).join("-")
                );
              } else if (value === "years") {
                params.set("date", new Date().toISOString().split("-")[0]);
              } else {
                params.delete("date");
              }
              return params;
            });
          }}
          value={selectedDateRange ?? ""}
          className="w-max py-3"
        >
          <option value={""}>Tous</option>
          <option value={"days"}>Par Jour</option>
          <option value={"months"}>Par Mois</option>
          <option value={"years"}>Par Année</option>
        </Select>
        {selectedDateRange === "days" && (
          <Input
            value={searchParams.get("date") ?? ""}
            onChange={(e) => {
              setSearchParams((params) => {
                params.set("date", e.target.value);
                return params;
              });
            }}
            className=" hidden lg:block"
            type="date"
          />
        )}
        {selectedDateRange === "months" && (
          <Select
            value={
              searchParams.get("date")?.split("-")[1].padStart(2, "0") ?? ""
            }
            onChange={(e) => {
              const v = e.target.value;
              setSearchParams((params) => {
                const date = params.get("date")?.split("-");
                params.set("date", date?.[0] + "-" + v);
                return params;
              });
            }}
            className="hidden w-max py-3 lg:block"
          >
            <option value="" disabled>
              Mois
            </option>
            {Array.from({ length: 12 }).map((_, i) => (
              <option value={(i + 1).toString().padStart(2, "0")}>
                {i + 1}
              </option>
            ))}
          </Select>
        )}
        {(selectedDateRange === "months" || selectedDateRange === "years") && (
          <Select
            value={searchParams.get("date")?.split("-")[0] ?? ""}
            onChange={(e) => {
              const v = e.target.value;
              setSearchParams((params) => {
                if (selectedDateRange === "months") {
                  const date = params.get("date")?.split("-");
                  params.set("date", v + "-" + date?.[1]);
                } else {
                  params.set("date", v);
                }
                return params;
              });
            }}
            className="hidden w-max py-3 lg:block"
          >
            <option value="" disabled>
              Annee
            </option>
            <option value="2023">2023</option>
            <option value="2024">2024</option>
          </Select>
        )}
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
      </div>
    </div>
  );
}
