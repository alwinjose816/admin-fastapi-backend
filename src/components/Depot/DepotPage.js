import React, { useState } from "react";

import DepotEntry from "./DepotEntry";
import StockEntry from "./StockEntry";
import StockList from "./StockList";

function DepotPage() {
    const [tab, setTab] = useState("ENTRY");

    return (
        <div style={{ padding: "30px" }}>

            {/* 🔴 SUB HEADING */}
            <h2 style={styles.title}>Depot Management</h2>
            <hr />

            {/* 🔴 TABS */}
            <div style={styles.tabs}>
                <span
                    style={tab === "ENTRY" ? styles.activeTab : styles.tab}
                    onClick={() => setTab("ENTRY")}
                >
                    Depot Entry
                </span>

                <span
                    style={tab === "STOCK" ? styles.activeTab : styles.tab}
                    onClick={() => setTab("STOCK")}
                >
                    Stock Entry
                </span>

                <span
                    style={tab === "LIST" ? styles.activeTab : styles.tab}
                    onClick={() => setTab("LIST")}
                >
                    Stock List
                </span>
            </div>

            {/* 🔥 SWITCH COMPONENTS */}
            {tab === "ENTRY" && <DepotEntry />}
            {tab === "STOCK" && <StockEntry />}
            {tab === "LIST" && <StockList />}
        </div>
    );
}

const styles = {
    title: {
        fontSize: "20px",
        fontWeight: "bold",
    },

    tabs: {
        display: "flex",
        gap: "20px",
        borderBottom: "2px solid #ccc",
        marginBottom: "20px",
    },

    tab: {
        padding: "10px",
        cursor: "pointer",
        color: "#666",
    },

    activeTab: {
        padding: "10px",
        color: "#ED1C24",
        borderBottom: "3px solid #ED1C24",
        fontWeight: "bold",
        cursor: "pointer",
    },
};

export default DepotPage;