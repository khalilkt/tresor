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
import LoginProtectedLayout from "./components/login_protedcted_layout";

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
