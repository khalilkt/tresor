import { Input, Select } from "./comps";

export function DateFilter({
  date,
  onChange,
}: {
  date: string | null;
  onChange: (date: string | null) => void;
}) {
  let selectedDateRange: "days" | "months" | "years" | null = null;
  if (date !== null) {
    if (date?.split("-").length === 3) {
      selectedDateRange = "days";
    } else if (date?.split("-").length === 2) {
      selectedDateRange = "months";
    } else if (date?.split("-").length === 1) {
      selectedDateRange = "years";
    }
  }

  return (
    <div className="flex gap-x-4">
      <Select
        onChange={(e) => {
          const value = e.target.value;
          if (value === "days") {
            onChange(new Date().toISOString().split("T")[0]);
          } else if (value === "months") {
            onChange(new Date().toISOString().split("-").slice(0, 2).join("-"));
          } else if (value === "years") {
            onChange(new Date().toISOString().split("-")[0]);
          } else {
            onChange(null);
          }
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
          value={date ?? ""}
          onChange={(e) => {
            onChange(e.target.value);
          }}
          className=" hidden lg:block"
          type="date"
        />
      )}
      {selectedDateRange === "months" && (
        <Select
          value={date?.split("-")[1].padStart(2, "0") ?? ""}
          onChange={(e) => {
            const v = e.target.value;
            onChange(date?.split("-")[0] + "-" + v);
          }}
          className="hidden w-max py-3 lg:block"
        >
          <option value="" disabled>
            Mois
          </option>
          {Array.from({ length: 12 }).map((_, i) => (
            <option value={(i + 1).toString().padStart(2, "0")}>{i + 1}</option>
          ))}
        </Select>
      )}
      {(selectedDateRange === "months" || selectedDateRange === "years") && (
        <Select
          value={date?.split("-")[0] ?? ""}
          onChange={(e) => {
            const v = e.target.value;

            if (selectedDateRange === "months") {
              onChange(v + "-" + date?.split("-")[1]);
            } else {
              onChange(v);
            }
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
  );
}
