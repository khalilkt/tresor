import React, { useEffect } from "react";
import "./App.css";
import axios, { Axios, AxiosError } from "axios";
import {
  BrowserRouter,
  Navigate,
  Route,
  Router,
  Routes,
  Outlet,
  useLocation,
  Link,
} from "react-router-dom";
import { rootUrl } from "./constants";
import LoginPage from "./routes/login";
import DashboardPage from "./routes/dashboard";
import { DisconnectButton } from "./components/buttons";
import { StatsIcon } from "./components/icons";
import AccountsPage from "./routes/accounts";
import EncaissementPage from "./routes/encaissement";
import { AccountInterface } from "./logiC/interfaces";
import DecaissementPage from "./routes/decaissement";
import AgentsPage from "./routes/agents";
import logo from "./assets/rim.png";

interface UserInterface {
  id: number;
  username: string;
  name: string;
  is_admin: boolean;
  is_superuser: boolean;
}

export interface AuthData {
  token: string;
  user: UserInterface;
  accounts: AccountInterface[];
}
export const AuthContext = React.createContext<{
  inited: boolean;
  authData: AuthData | null;
  logIn: (username: string, password: string) => void;
  logOut: () => void;
}>({
  inited: false,
  authData: null,
  logIn: () => {},
  logOut: () => {},
});

function NavItem({
  to,
  children,
  icon,
  isOpen,
}: {
  to: string;
  icon: React.ReactNode;
  children: React.ReactNode;
  isOpen: boolean;
}) {
  const { pathname } = useLocation();
  const isActive = pathname === to;

  return (
    <li>
      <Link
        className={`flex flex-row gap-x-2 overflow-x-clip text-ellipsis rounded-md p-3 text-sm font-semibold transition-all duration-100 ${isActive ? "bg-[#E5EEFF] text-primary" : "bg-transparent text-gray"}`}
        to={to}
      >
        <span className={` ${isActive ? "fill-primary " : "fill-gray"}`}>
          {icon}
        </span>
        {isOpen && children}
      </Link>
    </li>
  );
}

function LoginProtectedLayout() {
  const authContext = React.useContext(AuthContext);
  const [isOpen, setIsOpen] = React.useState<boolean>(true);

  const user = authContext.authData?.user;

  if (!authContext.authData) {
    return <Navigate to="/login" />;
  }
  return (
    <div className="flex h-screen flex-row">
      <ul
        className={
          "relative flex flex-col gap-y-2 border-r-2 border-r-primaryBorder bg-white px-6 pt-20 transition-all duration-150 " +
          (isOpen ? "w-[15%]" : "w-[100px]")
        }
      >
        <img src={logo} alt="logo" className="mb-6 h-20 w-fit self-center" />
        <h3
          onClick={() => {
            // authContext.logOut();
          }}
          className="mb-2 font-semibold text-gray"
        >
          Menu
        </h3>
        {user?.is_admin && (
          <>
            <NavItem isOpen={isOpen} to="/" icon={<StatsIcon />}>
              Tableau de bord
            </NavItem>
            <NavItem isOpen={isOpen} to="/agents" icon={<StatsIcon />}>
              Agents
            </NavItem>
            <NavItem isOpen={isOpen} to="/accounts" icon={<StatsIcon />}>
              Comptes
            </NavItem>
          </>
        )}
        <NavItem isOpen={isOpen} to="/encaissements" icon={<StatsIcon />}>
          Opération d'encaissement
        </NavItem>
        <NavItem isOpen={isOpen} to="/decaissements" icon={<StatsIcon />}>
          Opérration de décaissement
        </NavItem>

        <div className="text-medium  font- mb-20 mt-auto flex flex-col gap-y-6 self-center text-gray">
          <DisconnectButton
            className="text-semibold "
            onClick={() => {
              authContext.logOut();
            }}
          />
        </div>
      </ul>
      <section className="h-screen flex-1 overflow-y-auto ">
        <Outlet />
      </section>
    </div>
  );
}

function App() {
  const [inited, setInited] = React.useState(false);
  const [authData, setAuthData] = React.useState<AuthData | null>(null);
  const user = authData?.user;

  async function logIn(username: string, password: string) {
    try {
      const response = await axios.post(rootUrl + "auth/login/", {
        username: username,
        password: password,
      });
      if (response.data) {
        localStorage.setItem("token", response.data.token);
        setAuthData(response.data);
      }
    } catch (e) {
      console.log(e);
      alert("Une erreur s'est produite. Veuillez réessayer.");
    }
  }

  function logOut() {
    localStorage.removeItem("token");
    setAuthData(null);
  }

  async function init() {
    const token = localStorage.getItem("token");
    if (token) {
      try {
        const response = await axios.post(rootUrl + "auth/token/", {
          token: token,
        });
        if (response.data) {
          setAuthData(response.data);
        } else {
          localStorage.removeItem("token");
        }
      } catch (e) {
        console.log(e);
      }
    }
    setInited(true);
  }

  useEffect(() => {
    init();
  }, []);

  return (
    <BrowserRouter>
      <div className="text-black">
        <AuthContext.Provider
          value={{
            inited: inited,
            authData: authData,
            logIn: logIn,
            logOut: logOut,
          }}
        >
          {!inited ? (
            <div>Chargement...</div>
          ) : (
            <Routes>
              <Route path="/login" element={<LoginPage />} />

              <Route path="/" element={<LoginProtectedLayout />}>
                {user?.is_admin ? (
                  <>
                    <Route path="/" element={<DashboardPage />} />
                    <Route path="/accounts" element={<AccountsPage />} />
                    <Route path="/agents" element={<AgentsPage />} />
                    <Route path="/*" element={<Navigate to="/" />} />
                  </>
                ) : (
                  <>
                    <Route
                      path="/*"
                      element={<Navigate to="/encaissements" />}
                    />
                    <Route
                      path="/"
                      element={<Navigate to="/encaissements" />}
                    />{" "}
                  </>
                )}

                <Route path="/encaissements" element={<EncaissementPage />} />
                <Route path="/decaissements" element={<DecaissementPage />} />
              </Route>
            </Routes>
          )}
        </AuthContext.Provider>
      </div>
    </BrowserRouter>
  );
}

export default App;
