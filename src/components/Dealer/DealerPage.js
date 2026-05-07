import React, { useState } from "react";
import DealerEntry from "./DealerEntry";
import DealerList from "./DealerList";
import OrdersList from "./OrdersList";

const DealerPage = () => {
    const [activeTab, setActiveTab] = useState("entry");

    return (
        <div style={styles.container}>

            {/* 🔴 Title */}
            <h2 style={styles.title}>Dealer Management</h2>

            {/* 🔴 Tabs */}
            <div style={styles.tabs}>
                <div
                    onClick={() => setActiveTab("entry")}
                    style={activeTab === "entry" ? styles.activeTab : styles.tab}
                >
                    Dealer Entry
                </div>

                <div
                    onClick={() => setActiveTab("list")}
                    style={activeTab === "list" ? styles.activeTab : styles.tab}
                >
                    Dealer List
                </div>

                <div
                    onClick={() => setActiveTab("orders")}
                    style={activeTab === "orders" ? styles.activeTab : styles.tab}
                >
                    Orders List
                </div>
            </div>

            {/* 🔴 Content */}
            <div style={styles.content}>
                {activeTab === "entry" && <DealerEntry />}
                {activeTab === "list" && <DealerList />}
                {activeTab === "orders" && <OrdersList />}
            </div>

        </div>
    );
};

export default DealerPage;
const styles = {
    container: {
        padding: "20px",
    },

    title: {
        fontSize: "20px",
        fontWeight: "600",
        marginBottom: "10px",
        borderBottom: "2px solid #ccc",
        paddingBottom: "10px",
    },

    tabs: {
        display: "flex",
        gap: "25px",
        borderBottom: "1px solid #ccc",
        marginBottom: "20px",
    },

    tab: {
        padding: "10px 5px",
        cursor: "pointer",
        color: "#555",
        fontWeight: "500",
    },

    activeTab: {
        padding: "10px 5px",
        cursor: "pointer",
        color: "#ED1C24",
        fontWeight: "700",
        borderBottom: "3px solid #ED1C24",
    },

    content: {
        marginTop: "10px",
    },
};
