import React, { useState } from "react";
import DamageTab from "./DamageTab";
import AttendanceTab from "./AttendanceTab";
import CCTVTab from "./CCTVTab";

function MonitorPage() {

    const [tab, setTab] = useState("damage");

    return (

        <div>

            <h2>Depot Monitoring</h2>

            {/* Tabs */}

            <div className="monitor-tabs">

                <span
                    className={tab === "damage" ? "active" : ""}
                    onClick={() => setTab("damage")}
                >
                    Damage
                </span>

                <span
                    className={tab === "attendance" ? "active" : ""}
                    onClick={() => setTab("attendance")}
                >
                    Attendance
                </span>

                <span
                    className={tab === "cctv" ? "active" : ""}
                    onClick={() => setTab("cctv")}
                >
                    CCTV
                </span>

            </div>

            {/* Content */}

            {tab === "damage" && <DamageTab />}

            {tab === "attendance" && <AttendanceTab />}

            {tab === "cctv" && <CCTVTab />}

        </div>

    );
}

export default MonitorPage;