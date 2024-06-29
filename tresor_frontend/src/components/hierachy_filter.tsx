import { useContext, useState } from "react";
import { rootUrl } from "../constants";
import { AuthContext } from "../App";
import axios from "axios";
import { FilledButton } from "./buttons";

function Tile({
  selected,
  children,
  ...buttonProps
}: {
  selected: boolean;
  children: React.ReactNode;
} & React.DetailedHTMLProps<
  React.ButtonHTMLAttributes<HTMLButtonElement>,
  HTMLButtonElement
>) {
  return (
    <button
      {...buttonProps}
      className={`border-gray-300 flex h-20 w-full cursor-pointer flex-col items-center justify-center rounded-lg border ${selected ? "border-primary text-primary" : ""}`}
    >
      <div className="text-sm font-bold">{children}</div>
    </button>
  );
}

interface FilterItem {
  id: number;
  name: string;
}
export interface FilterInterface {
  wilaya: FilterItem | null;
  moughataa: FilterItem | null;
  commune: FilterItem | null;
  centre: FilterItem | null;
  bureau: FilterItem | null;
}

export default function EntitesFilter({
  onsubmit,
}: {
  onsubmit: (data: FilterInterface) => void;
}) {
  const [selectedWilaya, setSelectedWilaya] = useState<FilterItem | null>(null);
  const [selectedMoughataa, setSelectedMoughataa] = useState<FilterItem | null>(
    null,
  );
  const [selectedCommune, setSelectedCommune] = useState<FilterItem | null>(
    null,
  );
  const [selectedCentre, setSelectedCentre] = useState<FilterItem | null>(null);
  const [selectedBureau, setSelectedBureau] = useState<FilterItem | null>(null);

  const wilayasList = [{ id: 0, name: "Dakhlet Nouadhibou" }];
  const [moughataasList, setMoughataasList] = useState<any[] | null>(null);
  const [communesList, setCommunesList] = useState<any[] | null>(null);
  const [centresList, setCentresList] = useState<any[] | null>(null);
  const [bureauxList, setBureauxList] = useState<any[] | null>(null);

  const token = useContext(AuthContext).authData!.token;

  async function selectWilaya(id: number) {
    setSelectedWilaya(wilayasList.find((wilaya) => wilaya.id === id) || null);
    setSelectedMoughataa(null);
    setSelectedCommune(null);
    setSelectedCentre(null);
    setSelectedBureau(null);

    setMoughataasList(null);
    setCommunesList(null);
    setCentresList(null);
    setBureauxList(null);

    const res = await axios.get(`${rootUrl}moughataas?wilaya=${id}`, {
      headers: {
        Authorization: `Token ${token}`,
      },
    });
    setMoughataasList(res.data);
  }

  async function selectMoughataa(id: number) {
    setSelectedMoughataa(
      moughataasList?.find((moughataa) => moughataa.id === id) || null,
    );
    setSelectedCommune(null);
    setSelectedCentre(null);
    setSelectedBureau(null);
    setCommunesList(null);
    setCentresList(null);
    setBureauxList(null);

    const res = await axios.get(`${rootUrl}communes?moughataa=${id}`, {
      headers: {
        Authorization: `Token ${token}`,
      },
    });
    setCommunesList(res.data);
  }

  async function selectCommune(id: number) {
    setSelectedCommune(
      communesList?.find((commune) => commune.id === id) || null,
    );
    setSelectedCentre(null);
    setSelectedBureau(null);

    setCentresList(null);
    setBureauxList(null);

    const res = await axios.get(`${rootUrl}centres?commune=${id}`, {
      headers: {
        Authorization: `Token ${token}`,
      },
    });
    setCentresList(res.data);
  }

  async function selectCentre(id: number) {
    setSelectedCentre(centresList?.find((centre) => centre.id === id) || null);
    setSelectedBureau(null);

    setBureauxList(null);

    const res = await axios.get(`${rootUrl}bureaus?centre=${id}`, {
      headers: {
        Authorization: `Token ${token}`,
      },
    });
    setBureauxList(res.data);
  }

  async function selectBureau(id: number) {
    setSelectedBureau(bureauxList?.find((bureau) => bureau.id === id) || null);
  }

  return (
    <div className="flex h-screen w-[90%] flex-col lg:h-auto lg:w-[800px]">
      <h4 className="mb-4 font-semibold text-slate-400">Wilayas</h4>
      <div className="grid grid-cols-3 gap-x-4 gap-y-4">
        {wilayasList?.map((wilaya) => (
          <Tile
            key={wilaya.id}
            selected={selectedWilaya?.id === wilaya.id}
            onClick={() => selectWilaya(wilaya.id)}
          >
            {wilaya.name}
          </Tile>
        ))}
      </div>
      {moughataasList && (
        <>
          <h4 className="mb-4 mt-4 font-semibold text-slate-400">Moughataas</h4>
          <div className="grid grid-cols-3 gap-x-4 gap-y-4">
            {moughataasList?.map((moughataa) => (
              <Tile
                key={moughataa.id}
                selected={selectedMoughataa?.id === moughataa.id}
                onClick={() => selectMoughataa(moughataa.id)}
              >
                {moughataa.name}
              </Tile>
            ))}
          </div>
        </>
      )}
      {communesList && (
        <>
          <h4 className="mb-4 mt-4 font-semibold text-slate-400">Communes</h4>
          <div className="grid grid-cols-3 gap-x-4 gap-y-4">
            {communesList?.map((commune) => (
              <Tile
                key={commune.id}
                selected={selectedCommune?.id === commune.id}
                onClick={() => selectCommune(commune.id)}
              >
                {commune.name}
              </Tile>
            ))}
          </div>
        </>
      )}
      {centresList && (
        <>
          <h4 className="mb-4 mt-4 font-semibold text-slate-400">Centres</h4>
          <div className="grid grid-cols-3 gap-x-4 gap-y-4">
            {centresList?.map((centre) => (
              <Tile
                key={centre.id}
                selected={selectedCentre?.id === centre.id}
                onClick={() => selectCentre(centre.id)}
              >
                {centre.name}
              </Tile>
            ))}
          </div>
        </>
      )}
      {bureauxList && (
        <>
          <h4 className="mb-4 mt-4 font-semibold text-slate-400">Bureaux</h4>
          <div className="grid grid-cols-3 gap-x-4 gap-y-4">
            {bureauxList?.map((bureau) => (
              <Tile
                key={bureau.id}
                selected={selectedBureau?.id === bureau.id}
                onClick={() => selectBureau(bureau.id)}
              >
                {bureau.name}
              </Tile>
            ))}
          </div>
        </>
      )}
      <FilledButton
        className="mt-4 self-end"
        onClick={() => {
          const ret = {
            wilaya: selectedWilaya,
            moughataa: selectedMoughataa,
            commune: selectedCommune,
            centre: selectedCentre,
            bureau: selectedBureau,
          };
          onsubmit(ret);
        }}
      >
        Filtrer
      </FilledButton>
    </div>
  );
}
