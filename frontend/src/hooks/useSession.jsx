import { createContext, useContext, useEffect, useState } from "react";

import { getToken, onAuthChange } from "@/lib/api/client";

const SessionContext = createContext({ session: null, loading: true });

export function SessionProvider({ children }) {
  const [state, setState] = useState({ session: null, loading: true });

  useEffect(() => {
    const sync = () => {
      const token = getToken();
      setState({ session: token ? { token } : null, loading: false });
    };
    sync();
    return onAuthChange(sync);
  }, []);

  return <SessionContext.Provider value={state}>{children}</SessionContext.Provider>;
}

export function useSession() {
  return useContext(SessionContext);
}
