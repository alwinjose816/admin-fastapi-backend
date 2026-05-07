import React, { useEffect, useState } from "react";
import { supabase } from "../../supabaseClient";

import {
    MapContainer,
    TileLayer,
    Marker,
    Popup
} from "react-leaflet";

import "leaflet/dist/leaflet.css";
import "./Monitor.css";
import L from "leaflet";

import markerIcon2x from "leaflet/dist/images/marker-icon-2x.png";
import markerIcon from "leaflet/dist/images/marker-icon.png";
import markerShadow from "leaflet/dist/images/marker-shadow.png";
delete L.Icon.Default.prototype._getIconUrl;

L.Icon.Default.mergeOptions({
    iconRetinaUrl: markerIcon2x,
    iconUrl: markerIcon,
    shadowUrl: markerShadow,
});

const employeeIcon = new L.Icon({
    iconUrl:
        "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-red.png",

    shadowUrl:
        "https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png",

    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41]
});


function AttendanceTab() {

    const [depots, setDepots] = useState([]);
    const [selectedDepot, setSelectedDepot] = useState("");
    const [employees, setEmployees] = useState([]);

    useEffect(() => {
        loadDepots();
    }, []);

    async function loadDepots() {

        const { data } = await supabase
            .from("depot_master")
            .select("*");

        setDepots(data || []);
    }

    async function loadEmployees(depot) {

        const { data } = await supabase
            .from("employee_location")
            .select("*")
            .eq("depot_code", depot)
            .order("updated_at", { ascending: false });
        const latestEmployees = [];

        const seen = new Set();

        (data || []).forEach((emp) => {

            if (!seen.has(emp.emp_id)) {

                seen.add(emp.emp_id);
                latestEmployees.push(emp);

            }

        });

        setEmployees(latestEmployees);
    }

    function calculateDistance(lat1, lon1, lat2, lon2) {

        const R = 6371;

        const dLat = (lat2 - lat1) * Math.PI / 180;
        const dLon = (lon2 - lon1) * Math.PI / 180;

        const a =
            Math.sin(dLat / 2) ** 2 +
            Math.cos(lat1 * Math.PI / 180) *
            Math.cos(lat2 * Math.PI / 180) *
            Math.sin(dLon / 2) ** 2;

        return R * (
            2 * Math.atan2(
                Math.sqrt(a),
                Math.sqrt(1 - a)
            )
        );
    }

    const selectedDepotData = depots.find(
        d => d.depot_code === selectedDepot
    );

    const presentCount = employees.filter(emp => {

        if (!selectedDepotData) return false;

        const dist = calculateDistance(
            selectedDepotData.latitude,
            selectedDepotData.longitude,
            emp.latitude,
            emp.longitude
        );

        return dist <= 0.5;

    }).length;

    return (

        <div className="attendance-wrapper">

            <h2 className="attendance-title">
                📍 Live Employee Tracking + Attendance
            </h2>

            <label className="attendance-label">
                🏭 Select Depot
            </label>

            <select
                className="attendance-select"
                value={selectedDepot}
                onChange={(e) => {

                    setSelectedDepot(e.target.value);
                    loadEmployees(e.target.value);

                }}
            >

                <option value="">
                    Select Depot
                </option>

                {depots.map((d) => (

                    <option
                        key={d.depot_code}
                        value={d.depot_code}
                    >
                        {d.depot_code}
                    </option>

                ))}

            </select>

            {selectedDepotData && (

                <div className="depot-location-box">

                    📌 Depot Location:
                    {" "}
                    {selectedDepotData.latitude},
                    {" "}
                    {selectedDepotData.longitude}

                </div>

            )}

            {selectedDepotData && (

                <MapContainer
                    center={[
                        selectedDepotData.latitude,
                        selectedDepotData.longitude
                    ]}
                    zoom={12}
                    style={{
                        height: "420px",
                        width: "100%",
                        borderRadius: "12px",
                        marginBottom: "20px"
                    }}
                >

                    <TileLayer
                        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    />

                    {/* Depot Marker */}

                    <Marker
                        position={[
                            selectedDepotData.latitude,
                            selectedDepotData.longitude
                        ]}
                    >
                        <Popup>
                            Depot Location
                        </Popup>
                    </Marker>

                    {/* Employee Markers */}

                    {employees.map((emp) => (

                        <Marker
                            key={emp.emp_id}
                            position={[
                                emp.latitude,
                                emp.longitude
                            ]}
                            icon={employeeIcon}
                        
                        >
                            <Popup>
                                Employee ID:
                                {" "}
                                {emp.emp_id}
                            </Popup>
                        </Marker>

                    ))}

                </MapContainer>

            )}

            <h3 className="attendance-subtitle">
                👨‍🏭 Attendance Status
            </h3>

            <div className="employee-grid">

                {employees.map((emp) => {

                    if (!selectedDepotData) return null;

                    const dist = calculateDistance(
                        selectedDepotData.latitude,
                        selectedDepotData.longitude,
                        emp.latitude,
                        emp.longitude
                    );

                    const isPresent = dist <= 0.5;

                    return (

                        <div
                            key={emp.emp_id}
                            className="employee-card"
                        >

                            <div className="employee-top">

                                <div className="employee-avatar">
                                    👨‍🏭
                                </div>

                                <div>

                                    <h3>
                                        Employee #{emp.emp_id}
                                    </h3>

                                    <p className="employee-time">
                                        {new Date(
                                            emp.updated_at
                                        ).toLocaleString()}
                                    </p>

                                </div>

                            </div>

                            <div className="employee-details">

                                <div className="detail-box">
                                    <span>Latitude</span>
                                    <strong>{emp.latitude}</strong>
                                </div>

                                <div className="detail-box">
                                    <span>Longitude</span>
                                    <strong>{emp.longitude}</strong>
                                </div>

                                <div className="detail-box">
                                    <span>Distance</span>
                                    <strong>
                                        {dist.toFixed(2)} km
                                    </strong>
                                </div>

                            </div>

                            <div
                                className={
                                    isPresent
                                        ? "status-green"
                                        : "status-red"
                                }
                            >

                                {isPresent
                                    ? "🟢 Present"
                                    : "🔴 Not Present"}

                            </div>

                        </div>

                    );

                })}

            </div>

            <div className="attendance-summary">

                Present:
                {" "}
                {presentCount}
                {" / "}
                {employees.length}

            </div>

        </div>

    );
}

export default AttendanceTab;