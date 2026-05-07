import React, { useEffect, useState } from "react";
import { supabase } from "./supabaseClient";

import Login from "./components/Login";
import Navbar from "./components/Navbar";

// Pages
import DepotPage from "./components/Depot/DepotPage";
import DealerPage from "./components/Dealer/DealerPage";
import MonitorPage from "./components/Monitor/MonitorPage";
import DashboardPage from "./components/Dashboard/DashboardPage";

function App() {
  const [user, setUser] = useState(null);
  const [selected, setSelected] = useState("DASHBOARD");
  const handleLogout = async () => {
    await supabase.auth.signOut();
    setUser(null);
  };
  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setUser(data.session?.user || null);
    });

    const { data: listener } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setUser(session?.user || null);
      }
    );

    return () => {
      listener.subscription.unsubscribe();
    };
  }, []);

  if (!user) {
    return <Login setUser={setUser} />;
  }

  return (
    <div>
      <Navbar
        selected={selected}
        setSelected={setSelected}
        onLogout={handleLogout}
      />

      {selected === "DEPO" && <DepotPage />}
      {selected === "DEALER" && <DealerPage />}
      {selected === "MONITOR" && <MonitorPage />}
      {selected === "DASHBOARD" && <DashboardPage />}
    </div>
  );
}

export default App;