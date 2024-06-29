import rim from "../assets/rim.png";
import qrcode from "../assets/qr_code.jpg";
import joumhouria from "../assets/joumhouria_image.png";
import { useEffect, useState } from "react";

export function PrintPage({
  children,
  ...divProps
}: {
  children: React.ReactNode;
} & React.HTMLProps<HTMLDivElement> & {
    divProps?: React.HTMLProps<HTMLDivElement>;
  }) {
  // const [height, setHeight] = useState<number | null>(null);

  const handleResize = () => {
    const PAGE_HEIGHT = 29.7 * 37.7952755906;
    const printElement = document.getElementById("print-component");

    if (printElement) {
      printElement.style.height = `auto`;
      let height = printElement.clientHeight;
      const numberOfPage = Math.ceil(height / PAGE_HEIGHT);
      const heightWithSingleHeader = numberOfPage * PAGE_HEIGHT;
      let requiredHeight = heightWithSingleHeader;
      if (numberOfPage > 1) {
        let headerHeight =
          printElement.getElementsByTagName("thead")?.[0]?.clientHeight;
        // headerHeight = 0;
        const footerHeight =
          printElement.getElementsByTagName("tfoot")?.[0]?.clientHeight;
        requiredHeight -= (numberOfPage - 1) * (headerHeight + footerHeight);
        // requiredHeight = PAGE_HEIGHT * 2 - (headerHeight + footerHeight);
      }
      const headerHeight =
        printElement.getElementsByTagName("thead")?.[0]?.clientHeight;
      const footerHeight =
        printElement.getElementsByTagName("tfoot")?.[0]?.clientHeight;
      printElement.style.height = `${requiredHeight}px`;
    }
  };

  useEffect(() => {
    handleResize();
  }, [children, divProps]);

  return (
    <table
      id="print-component"
      className={` table w-[21cm] 
         flex-col overflow-x-clip ${divProps.className}}`}
    >
      <thead className="">
        <div className="px-6 pt-10">
          <div dir="ltr" className="flex flex-col">
            <img src={joumhouria} className="w-96 self-end pr-36" />

            <div className="relative my-2 flex w-full flex-col self-center">
              <hr className="-mx-6 w-full self-center border-[1.5px]  border-[#006400]" />
              <hr className="-mx-6 w-full self-center border-[1.5px] border-[#FFD700]" />

              <hr className="-mx-6 w-full self-center border-[1.5px] border-[#FF0000] " />
              <img
                src={rim}
                className="absolute inset-y-0 right-4 h-24 w-24 -translate-y-12 "
              />
            </div>
            <div className="mb-6 flex w-full flex-row justify-between pl-4 text-xs">
              <div className="flex w-fit flex-col items-center  font-semibold leading-4">
                <h1>وزارة المالية </h1>
                <h1>Ministère des Finances</h1>
                <h1>المديرية العامة للخزينة و المحاسبة العمومية </h1>
                <h1>
                  Direction Générale du Trésor et de la Comptabilité Publique
                </h1>
                <h1>إدارة الخزينة بنواذيبو</h1>
                <h1>Direction du Trésor à Nouadhibou</h1>
              </div>
              <div className="flex flex-col">
                <div className="ml-2 mt-1 flex w-fit flex-col  items-center pr-36 text-xs font-medium leading-4">
                  <h1 className=" font-semibold">
                    RÉPUBLIQUE ISLAMIQUE DE MAURITANIE
                  </h1>
                  <h1 className="text-xs">Honeur - Fraternité - Justice</h1>
                </div>
                <div className="mt-10 flex flex-col self-end text-xs">
                  <span>
                    {" "}
                    Nouadhibou le :
                    ............................................. نواذيبو في{" "}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </thead>
      <tbody className="">
        <tr className="">
          <td className="">
            <div className=" px-6 w-full">{children}</div>
          </td>
        </tr>
      </tbody>
      <tfoot className=" text-center">
        <tr>
          <td>
            <div className="px-6">
              <hr className="border-1 mt-10 w-full" />
              <div className="flex justify-between py-2 items-center">
                <div className="flex flex-col gap-y-px text-xs items-start text-start">
                  <div className="flex gap-x-1 items-center">
                    <svg
                      viewBox="0 0 24 24"
                      className="w-4 h-4"
                      fill="none"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <g id="SVGRepo_bgCarrier" stroke-width="0"></g>
                      <g
                        id="SVGRepo_tracerCarrier"
                        stroke-linecap="round"
                        stroke-linejoin="round"
                      ></g>
                      <g id="SVGRepo_iconCarrier">
                        {" "}
                        <path
                          d="M10.0376 5.31617L10.6866 6.4791C11.2723 7.52858 11.0372 8.90532 10.1147 9.8278C10.1147 9.8278 10.1147 9.8278 10.1147 9.8278C10.1146 9.82792 8.99588 10.9468 11.0245 12.9755C13.0525 15.0035 14.1714 13.8861 14.1722 13.8853C14.1722 13.8853 14.1722 13.8853 14.1722 13.8853C15.0947 12.9628 16.4714 12.7277 17.5209 13.3134L18.6838 13.9624C20.2686 14.8468 20.4557 17.0692 19.0628 18.4622C18.2258 19.2992 17.2004 19.9505 16.0669 19.9934C14.1588 20.0658 10.9183 19.5829 7.6677 16.3323C4.41713 13.0817 3.93421 9.84122 4.00655 7.93309C4.04952 6.7996 4.7008 5.77423 5.53781 4.93723C6.93076 3.54428 9.15317 3.73144 10.0376 5.31617Z"
                          fill="#1C274C"
                        ></path>{" "}
                      </g>
                    </svg>
                    <span>{"00222 45 74 90 08"}</span>
                  </div>
                  <div className="flex gap-x-1 items-center">
                    <svg
                      viewBox="0 0 24 24"
                      className="w-4 h-5"
                      fill="none"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <g id="SVGRepo_bgCarrier" stroke-width="0"></g>
                      <g
                        id="SVGRepo_tracerCarrier"
                        stroke-linecap="round"
                        stroke-linejoin="round"
                      ></g>
                      <g id="SVGRepo_iconCarrier">
                        {" "}
                        <path
                          d="M4 7.00005L10.2 11.65C11.2667 12.45 12.7333 12.45 13.8 11.65L20 7"
                          stroke="#000000"
                          stroke-width="2"
                          stroke-linecap="round"
                          stroke-linejoin="round"
                        ></path>{" "}
                        <rect
                          x="3"
                          y="5"
                          width="18"
                          height="14"
                          rx="2"
                          stroke="#000000"
                          stroke-width="2"
                          stroke-linecap="round"
                        ></rect>{" "}
                      </g>
                    </svg>
                    <span>{"contact@tresor.mr"}</span>
                  </div>
                  <div className="flex gap-x-1 items-center">
                    <svg
                      viewBox="0 0 24 24"
                      className="w-4 h-5"
                      fill="none"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <g id="SVGRepo_bgCarrier" stroke-width="0"></g>
                      <g
                        id="SVGRepo_tracerCarrier"
                        stroke-linecap="round"
                        stroke-linejoin="round"
                      ></g>
                      <g id="SVGRepo_iconCarrier">
                        {" "}
                        <path
                          d="M4 15L20 15"
                          stroke="#000000"
                          stroke-width="2"
                          stroke-linecap="round"
                          stroke-linejoin="round"
                        ></path>{" "}
                        <path
                          d="M4 9L20 9"
                          stroke="#000000"
                          stroke-width="2"
                          stroke-linecap="round"
                          stroke-linejoin="round"
                        ></path>{" "}
                        <circle
                          cx="12"
                          cy="12"
                          r="9"
                          stroke="#000000"
                          stroke-width="2"
                          stroke-linecap="round"
                          stroke-linejoin="round"
                        ></circle>{" "}
                        <path
                          d="M12.0004 20.8182L11.2862 21.5181C11.4742 21.7101 11.7317 21.8182 12.0004 21.8182C12.2691 21.8182 12.5265 21.7101 12.7146 21.5181L12.0004 20.8182ZM12.0004 3.18188L12.7146 2.48198C12.5265 2.29005 12.2691 2.18188 12.0004 2.18188C11.7317 2.18188 11.4742 2.29005 11.2861 2.48198L12.0004 3.18188ZM14.6004 12.0001C14.6004 15.1611 13.3373 18.0251 11.2862 20.1183L12.7146 21.5181C15.1173 19.0662 16.6004 15.7053 16.6004 12.0001H14.6004ZM11.2861 3.88178C13.3373 5.97501 14.6004 8.83903 14.6004 12.0001H16.6004C16.6004 8.29478 15.1173 4.93389 12.7146 2.48198L11.2861 3.88178ZM9.40039 12.0001C9.40039 8.83903 10.6634 5.97501 12.7146 3.88178L11.2861 2.48198C8.88347 4.93389 7.40039 8.29478 7.40039 12.0001H9.40039ZM12.7146 20.1183C10.6634 18.0251 9.40039 15.1611 9.40039 12.0001H7.40039C7.40039 15.7053 8.88348 19.0662 11.2862 21.5181L12.7146 20.1183Z"
                          fill="#000000"
                        ></path>{" "}
                      </g>
                    </svg>
                    <span>{"tresor.mr"}</span>
                  </div>
                </div>
                <img src={qrcode} className="w-12 h-fit" />
              </div>
            </div>
          </td>
        </tr>
      </tfoot>
    </table>
  );
}
