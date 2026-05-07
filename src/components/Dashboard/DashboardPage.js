import React, { useState } from "react";
import OverallTab from "./OverallTab";
import DepotTab from "./DepotTab";
import ProductTab from "./ProductTab";
import AnalyticsTab from "./AnalyticsTab"; // ✅ NEW
import "./dashboard.css";

function DashboardPage() {
    const [tab, setTab] = useState("overall");

    return (
        <div>
            <h2>📊 Dashboard</h2>

            <div className="dashboard-tabs">
                <span
                    className={tab === "overall" ? "active" : ""}
                    onClick={() => setTab("overall")}
                >
                    Overall
                </span>

                <span
                    className={tab === "depot" ? "active" : ""}
                    onClick={() => setTab("depot")}
                >
                    Depot
                </span>

                <span
                    className={tab === "product" ? "active" : ""}
                    onClick={() => setTab("product")}
                >
                    Product
                </span>

                {/* ✅ NEW TAB */}
                <span
                    className={tab === "analytics" ? "active" : ""}
                    onClick={() => setTab("analytics")}
                >
                    Analytics
                </span>
            </div>

            {tab === "overall" && <OverallTab />}
            {tab === "depot" && <DepotTab />}
            {tab === "product" && <ProductTab />}
            {tab === "analytics" && <AnalyticsTab />} {/* ✅ NEW */}
        </div>
    );
}

export default DashboardPage;