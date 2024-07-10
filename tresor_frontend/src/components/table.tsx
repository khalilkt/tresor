import { Link } from "react-router-dom";
import { LeftArrow } from "./icons";

export function Tr({ children }: { children: React.ReactNode }) {
  return <tr className="">{children}</tr>;
}

export function Td({
  children,
  isSmall = false,
  ...tdProps
}: {
  children: React.ReactNode;
  isSmall?: boolean;
} & React.HTMLProps<HTMLTableDataCellElement>) {
  return (
    <td
      {...tdProps}
      className={`border-b print:border border-b-primaryBorder print:border-black ${tdProps.className ?? ""} ${isSmall ? "px-4 py-1 print:p-0" : "print-p px-7 py-3"}`}
    >
      {children}
    </td>
  );
}

export function Pagination({
  onItemClick,
  current,
  total,
  className = "",
}: {
  current: number;
  total: number;
  onItemClick: (page: number) => void;
  className?: string;
}) {
  function Item({ page }: { page: number | null }) {
    return (
      <li
        onClick={() => {
          if (page) onItemClick(page);
        }}
        className={`text-gray-500 flex h-10 cursor-pointer items-center justify-center border border-primaryBorder px-4 leading-tight ${page === current ? "bg-primaryLight2" : "hover:bg-primaryLight"}`}
      >
        {page ?? "..."}
      </li>
    );
  }

  const firstPage = Math.max(1, current - 2);
  const lastPage = Math.min(total, firstPage + 4);

  return (
    <ul
      className={`inline-flex h-10 w-min -space-x-px self-center text-base font-medium ${className}`}
    >
      {current !== 1 && (
        <li
          onClick={() => {
            onItemClick(current - 1);
          }}
          className="text-gray-500 ms-0 flex h-10 items-center justify-center rounded-s-lg border border-e-0 border-primaryBorder px-4 leading-tight hover:bg-primaryBorder"
        >
          <LeftArrow />
        </li>
      )}
      {Array.from({ length: lastPage - firstPage + 1 }).map((_, i) => (
        <Item key={i} page={firstPage + i} />
      ))}
      {current !== total && (
        <li
          onClick={() => {
            onItemClick(current + 1);
          }}
          className="text-gray-500 ms-0 flex h-10 rotate-180 transform cursor-pointer items-center justify-center rounded-s-lg border border-e-0 border-primaryBorder px-4 leading-tight hover:bg-primaryBorder"
        >
          <LeftArrow />
        </li>
      )}
    </ul>
  );
}

export function TableBodySquelette({ columnCount }: { columnCount: number }) {
  return (
    <tbody>
      {Array.from({ length: 10 }).map((_, i) => (
        <Tr>
          {Array.from({ length: columnCount }).map((_, i) => (
            <Td className="" key={i}>
              <div className="h-6 animate-pulse rounded odd:bg-[#D9D9D9] even:opacity-80"></div>
            </Td>
          ))}
        </Tr>
      ))}
    </tbody>
  );
}
