import { useContext, useEffect, useRef, useState } from "react";
import { MDialog } from "../components/dialog";
import { PaginatedData, UserInterface } from "../logiC/interfaces";
import { Pagination, TableBodySquelette, Td, Tr } from "../components/table";
import { Input, SearchBar, Select, Textarea, Title } from "../components/comps";
import { FilledButton } from "../components/buttons";
import axios, { AxiosError } from "axios";
import { rootUrl } from "../constants";
import { AuthContext } from "../App";
import { useSearchParams } from "react-router-dom";
import * as XLSX from "xlsx";
import {
  LoadingIcon,
  MdpIcon,
  MoreIcon,
  PrintIcon,
  ViewIcon,
} from "../components/icons";
import DisbursementOperationDetailDialog from "../components/disbusement_operation_dialog";
import { VAULT_GROUPS } from "./vaults_deposit";

// user form is userinterface without id and with password
type UserForm = Omit<
  UserInterface,
  "id" | "total_collection_operations" | "total_disbursement_operations"
> & { password: string };

const NAME_INPUT_ID = "agent_name_dialog";
const USERNAME_INPUT_ID = "agent_username_dialog";
const PASSWORD_INPUT_ID = "agent_password_dialog";

const PASSWORDCHANGE_INPUT_ID = "agent_passwordchange_dialog";
const PASSWORDCHANGE_CONFIRM_INPUT_ID = "agent_passwordchange_confirm_dialog";

function PasswordChangeDialog({
  userId,
  onDone,
}: {
  onDone: () => void;
  userId: number;
}) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const token = useContext(AuthContext).authData!.token;

  async function updatePassword(userId: number) {
    try {
      const passwordInput = document.getElementById(
        PASSWORDCHANGE_INPUT_ID
      ) as HTMLInputElement;
      const confirmPassordInput = document.getElementById(
        PASSWORDCHANGE_CONFIRM_INPUT_ID
      ) as HTMLInputElement;

      if (!passwordInput || !confirmPassordInput) {
        return;
      }
      if (
        passwordInput.value.length === 0 ||
        confirmPassordInput.value.length === 0
      ) {
        alert("Veuillez remplir tous les champs");
        return;
      }
      if (passwordInput.value !== confirmPassordInput.value) {
        alert("Les mots de passe ne correspondent pas");
        return;
      }
      setIsSubmitting(true);

      await axios.post(
        rootUrl + `users/${userId}/update_password/`,
        {
          password: passwordInput.value,
        },
        {
          headers: {
            Authorization: `Token ${token}`,
          },
        }
      );
      onDone();
    } catch (e) {
      alert("Erreur lors de la mise à jour du mot de passe");
    }
    setIsSubmitting(false);
  }

  return (
    <div className="grid w-[400px] grid-cols-2 gap-x-4 gap-y-6">
      <Input
        className="col-span-2"
        type="password"
        id={PASSWORDCHANGE_INPUT_ID}
        placeholder="Mot de passe"
      />
      <Input
        className="col-span-2"
        type="password"
        id={PASSWORDCHANGE_CONFIRM_INPUT_ID}
        placeholder="Confirmer le mot de passe"
      />
      <FilledButton
        onClick={() => {
          onDone();
        }}
        isLight={true}
        className="col-span-1"
      >
        Annuler
      </FilledButton>
      <FilledButton
        onClick={() => {
          updatePassword(userId);
        }}
        className="col-span-1"
      >
        Changer
      </FilledButton>
    </div>
  );
}

export default function AgentsPage() {
  const [dialogState, setDialogState] = useState<{
    state: "add" | "edit_pass" | "delete" | "none";
    payload: any;
  }>({
    state: "none",
    payload: null,
  });

  const [usersData, setUsersData] =
    useState<PaginatedData<UserInterface> | null>(null);

  const [searchParams, setSearchParams] = useSearchParams();

  const token = useContext(AuthContext).authData!.token;
  const searchTimer = useRef<NodeJS.Timeout>();

  useEffect(() => {
    load();
  }, [searchParams]);

  useEffect(() => {
    const searchBar = document.getElementById("search-bar");

    const searchParam = searchParams.get("search");
    if (searchBar) {
      (searchBar as HTMLInputElement).value = searchParam ?? "";
    }
  }, []);

  function onSearchChange(e: React.ChangeEvent<HTMLInputElement>) {
    const search = e.target.value;

    clearTimeout(searchTimer.current!);
    searchTimer.current = setTimeout(() => {
      setSearchParams((params) => {
        params.set("page", "1");
        if (search.length === 0) {
          params.delete("search");
        } else {
          params.set("search", search);
        }
        return params;
      });
    }, 500);
  }

  async function load() {
    // dummy data
    let params = new URLSearchParams(searchParams);
    try {
      const response = await axios.get(rootUrl + "users", {
        headers: {
          Authorization: "Token " + token,
        },
        params,
      });
      const users = response.data;

      setUsersData(users);
    } catch (e) {
      console.log(e);
    }
  }

  async function deleteUser(id: number) {
    try {
      // pass the data and the token
      const response = await axios.delete(rootUrl + "users/" + id + "/", {
        headers: {
          Authorization: "Token " + token,
        },
      });
      load();
      console.log(response.data);
    } catch (e) {
      console.log(e);
    }
  }

  async function createUser(data: UserForm) {
    try {
      // pass the data and the token
      const response = await axios.post(
        rootUrl + "users/",
        {
          ...data,
        },
        {
          headers: {
            Authorization: "Token " + token,
          },
        }
      );

      load();
      setDialogState({ state: "none", payload: null });

      console.log(response.data);
    } catch (e) {
      console.log(e);
      alert("Une erreur s'est produite. Veuillez réessayer.");
    }
  }
  const user = useContext(AuthContext).authData?.user;
  return (
    <div className="flex flex-col items-start gap-y-10 px-8 pb-12 pt-12 lg:px-10 lg:pb-0 lg:pt-20l">
      <MDialog
        isOpen={dialogState.state === "add"}
        title="Ajouter un agent"
        onClose={function (): void {
          setDialogState({ state: "none", payload: null });
        }}
      >
        {
          <div className="grid grid-cols-2 gap-x-4 gap-y-6">
            <Input id={NAME_INPUT_ID} placeholder="Nom" />
            <Input id={USERNAME_INPUT_ID} placeholder="Nom d'utilisateur" />
            {dialogState.state === "add" && (
              <Input
                id={PASSWORD_INPUT_ID}
                className=" col-span-2"
                placeholder="Mot de passe"
                type="password"
              />
            )}
            <div className="flex flex-col justify-between col-span-2 px-2">
              <div className="flex flex-col">
                {VAULT_GROUPS.map((group) => (
                  <div className="flex items-center gap-x-3 ">
                    <input
                      id={`GROUP_ACCESS_${group.id}`}
                      type="checkbox"
                      className=""
                    />
                    <label className="text-medium text-gray">
                      {group.name}
                    </label>
                  </div>
                ))}
              </div>
              <div className="flex items-center gap-x-3 ">
                <input id="has_accounts_access" type="checkbox" className="" />
                <label className="text-medium text-gray">Accès Comptes</label>
              </div>
            </div>
            <FilledButton
              onClick={() => {
                setDialogState({ state: "none", payload: null });
              }}
              isLight={true}
              className="col-span-1"
            >
              Annuler
            </FilledButton>
            <FilledButton
              disabled={false}
              onClick={() => {
                const name = (
                  document.getElementById(NAME_INPUT_ID) as HTMLInputElement
                ).value;
                const username = (
                  document.getElementById(USERNAME_INPUT_ID) as HTMLInputElement
                ).value;
                const password = (
                  document.getElementById(PASSWORD_INPUT_ID) as HTMLInputElement
                ).value;

                const hasAccountsAccess = (
                  document.getElementById(
                    "has_accounts_access"
                  ) as HTMLInputElement
                ).checked;

                const vaultsAccess = VAULT_GROUPS.map((group) => {
                  return {
                    group: group.id,
                    access: (
                      document.getElementById(
                        `GROUP_ACCESS_${group.id}`
                      ) as HTMLInputElement
                    ).checked,
                  };
                });
                const assigned_groups = vaultsAccess
                  .filter((group) => group.access)
                  .map((group) => group.group);
                createUser({
                  name,
                  username,
                  password,
                  is_admin: false,
                  is_superuser: false,
                  has_accounts_access: hasAccountsAccess,
                  assigned_vault_groups: assigned_groups,
                });
              }}
              className="col-span-1"
            >
              {false ? <LoadingIcon /> : "Ajouter"}
            </FilledButton>
          </div>
        }
      </MDialog>
      <MDialog
        isOpen={dialogState.state === "edit_pass"}
        title="Changer le mot de passe"
        onClose={function (): void {
          setDialogState({ state: "none", payload: null });
        }}
      >
        <PasswordChangeDialog
          userId={dialogState.payload}
          onDone={() => {
            setDialogState({ state: "none", payload: null });
          }}
        />
      </MDialog>

      <Title>Agents</Title>
      <div className="flex justify-between w-full">
        <SearchBar
          id="search-bar"
          onChange={onSearchChange}
          placeholder="Chercher"
          className="w-full flex-1 lg:w-[300px]"
        />
        <FilledButton
          className="rounded-lg bg-primary p-2 text-white"
          onClick={() => {
            setDialogState({ state: "add", payload: null });
          }}
        >
          Ajouter
        </FilledButton>
      </div>
      <table className="hidden w-full text-center text-lg lg:table">
        <thead className="">
          <tr className="font-bold text-gray">
            <th className="text-medium w-[30%] py-3 text-start text-base">
              Nom
            </th>
            <th className="text-medium py-3 text-start text-base">
              Nom d'utilisateur
            </th>

            <th className="text-medium py-3 text-center text-base">
              Nombre d'opérations d'encaissement
            </th>
            <th className="text-medium py-3 text-center text-base">
              Nombre d'opérations de décaissement
            </th>
            <th className="text-medium py-3 text-center text-base">Actions</th>
          </tr>
        </thead>
        {!usersData ? (
          <TableBodySquelette columnCount={5} />
        ) : (
          <tbody>
            {usersData.data?.map((user, i) => (
              <Tr>
                <Td className="p-0 px-0 pl-0 text-start">{user.name}</Td>
                <Td className="p-0 px-0 pl-0 text-start">{user.username}</Td>
                <Td className="p-0 px-0 pl-0 font-medium text-center">
                  {user.total_collection_operations}
                </Td>
                <Td className="p-0 px-0 pl-0 font-medium text-center">
                  {user.total_disbursement_operations}
                </Td>
                <Td className="align-center">
                  <button
                    onClick={() => {
                      setDialogState({ state: "edit_pass", payload: user.id });
                    }}
                  >
                    <MdpIcon />
                  </button>
                </Td>
              </Tr>
            ))}
          </tbody>
        )}
      </table>
      <Pagination
        className="mb-10 mt-6 lg:mt-10"
        onItemClick={(page) => {
          setSearchParams((params) => {
            params.set("page", page.toString());
            return params;
          });
          // if mobile scroll to the top
          window.scrollTo(0, 0);
        }}
        current={
          searchParams.get("page") ? parseInt(searchParams.get("page")!) : 1
        }
        total={usersData?.total_pages ?? 1}
      />
    </div>
  );
}
