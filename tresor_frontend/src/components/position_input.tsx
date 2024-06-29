export interface PositionInterface {
  x: string;
  y: string;
  z: string;
  orientation: "N" | "S" | "E" | "W";
}

export function PositionInput({
  value,
  className,
  disabled = false,
  onChange,
}: {
  value: PositionInterface;
  disabled?: boolean;
  onChange: (value: PositionInterface) => void;
  className?: string;
}) {
  return (
    <div
      className={`flex flex-row rounded-md border border-primaryBorder py-2 text-sm text-black lg:text-base ${className}`}
    >
      <input
        disabled={disabled}
        value={value.x}
        onChange={(e) => onChange({ ...value, x: e.target.value })}
        type="number"
        className="w-[20%] border-0 pl-2 text-center  focus:outline-0 "
        placeholder="00"
      />
      <span className="text-xl text-gray">°</span>
      <input
        disabled={disabled}
        onChange={(e) => onChange({ ...value, y: e.target.value })}
        value={value.y}
        type="number"
        className="w-[20%] border-0 pl-2 text-center focus:outline-0  active:outline-0"
        placeholder="00"
      />
      <span className="text-xl text-gray">´</span>

      <input
        disabled={disabled}
        value={value.z}
        onChange={(e) => onChange({ ...value, z: e.target.value })}
        type="number"
        className="w-[20%] border-0 pl-2 text-center focus:outline-0  active:outline-0"
        placeholder="00"
      />
      <span className="text-xl text-gray">´´</span>

      <select disabled={disabled} className="focus:ouline-0 w-[20%] border-0 ">
        <option value="N">N</option>
        <option value="S">S</option>
        <option value="E">E</option>
        <option value="W">W</option>
      </select>
    </div>
  );
}
