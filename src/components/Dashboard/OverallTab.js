import React, { useEffect, useState } from "react";
import { supabase } from "../../supabaseClient";
import dayjs from "dayjs";
import Select from "react-select";

import {
    BarChart, Bar, XAxis, YAxis, Tooltip,
    ResponsiveContainer, LineChart, Line,
    PieChart, Pie, CartesianGrid, Legend, Cell
} from "recharts";

import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import MarkerClusterGroup from "react-leaflet-cluster";
import { useMap } from "react-leaflet";  


import L from "leaflet";
import "leaflet/dist/leaflet.css";
const isValidCoord = (lat, lng) =>
    lat !== null &&
    lng !== null &&
    !isNaN(lat) &&
    !isNaN(lng);
const dealerIcon = new L.Icon({
    iconUrl: "https://maps.google.com/mapfiles/ms/icons/blue-dot.png",
    iconSize: [30, 30],
});

const depotIcon = new L.Icon({
    iconUrl: "https://maps.google.com/mapfiles/ms/icons/red-dot.png",
    iconSize: [35, 35],
});
const highlightedDepotIcon = new L.Icon({
    iconUrl: "https://maps.google.com/mapfiles/ms/icons/yellow-dot.png",
    iconSize: [45, 45],
});

function FixMap({ selectedDealer, selectedDepot, dealerLocations, depotLocations, viewMode }) {
    const map = useMap();

    useEffect(() => {
       

        if (viewMode === "dealer" && selectedDealer) {
            const d = dealerLocations.find(x => x.dealer_id === selectedDealer);

            if (!d) return;

            const lat = Number(d.latitude);
            const lng = Number(d.longitude);

            if (!isValidCoord(lat, lng)) return;

            map.setView([lat, lng], 12);
        }

        if (viewMode === "depot" && selectedDepot) {
            const d = depotLocations.find(x => x.depot_code === selectedDepot);

            if (!d) return;

            const lat = Number(d.latitude);
            const lng = Number(d.longitude);

            if (!isValidCoord(lat, lng)) return;

            map.setView([lat, lng], 12);
        }

    }, [selectedDealer, selectedDepot, viewMode, dealerLocations, depotLocations, map]);

    return null;
}
function ZoomOnClick({ position }) {
    const map = useMap();

    useEffect(() => {
        if (!map) return;

        if (
            position &&
            Array.isArray(position) &&
            !isNaN(position[0]) &&
            !isNaN(position[1])
        ) {
            try {
                map.setView(position, 12);
            } catch (e) {
                console.log("Safe error prevented");
            }
        }
    }, [position, map]);   // ✅ FIXED

    return null;
}
function OverallTab() {

    // ---------------- STATE ----------------
    const [orders, setOrders] = useState([]);
    const [filtered, setFiltered] = useState([]);

    const [startDate, setStartDate] = useState("");
    const [endDate, setEndDate] = useState("");
    const [cities, setCities] = useState([]);
    const [sortOrder, setSortOrder] = useState("desc");
    const [dealerMaster, setDealerMaster] = useState([]);
    const [depotMaster, setDepotMaster] = useState([]);
    const [selectedDealer, setSelectedDealer] = useState("");
    const [selectedDepot, setSelectedDepot] = useState("");
   
    const [clickedPosition, setClickedPosition] = useState(null);
  
    const [viewMode, setViewMode] = useState("dealer"); // 🔥 IMPORTANT
  

    // ---------------- FETCH + MERGE ----------------
    const fetchData = async () => {

        const { data: ordersData } = await supabase
            .from("dealer_orders")
            .select("*");

        const { data: dealerData } = await supabase
            .from("dealer_master")
            .select("*");
        const { data: depots } = await supabase
            .from("depot_master")
            .select("*");

        setDepotMaster(depots);

        // 🔥 MERGE (same as pandas merge)
        const merged = (ordersData || []).map(order => {
            const dealer = (dealerData || []).find(
                d => d.dealer_id === order.dealer_id
            );

            return {
                ...order,
                city: dealer?.city || null
            };
        });
        

        setOrders(merged);
        setFiltered(merged);
        const { data: dealers } = await supabase.from("dealer_master").select("*");
        

        setDealerMaster(dealers);
       
    };

    useEffect(() => {
        fetchData();
    }, []);
    useEffect(() => {
        setClickedPosition(null); // 🔥 prevents crash on toggle/filter
    }, [viewMode, selectedDealer, selectedDepot]);

    // ---------------- FILTER ----------------
    useEffect(() => {
        let df = [...orders];

        // DATE FILTER
        if (startDate && endDate) {
            df = df.filter(o => {
                if (!o.order_date) return false;

                const d = dayjs(o.order_date);
                return d.isAfter(dayjs(startDate).subtract(1, "day")) &&
                    d.isBefore(dayjs(endDate).add(1, "day"));
            });
        }

        // CITY FILTER
        if (cities.length > 0) {
            df = df.filter(o => cities.includes(o.city));
        }
      

        setFiltered(df);
    }, [orders, startDate, endDate, cities]);

    // ---------------- METRICS ----------------
    const totalOrders = filtered.length;

    const dispatched = filtered.filter(x => x.status === "dispatched").length;
    const pending = filtered.filter(x => x.status === "pending").length;

    const totalBags = filtered.reduce(
        (a, b) => a + (Number(b.bags) || 0), 0
    );
    const totalStockMT = filtered.reduce(
        (sum, o) => sum + (Number(o.total_weight_mt) || 0),
        0
    );

    const efficiency = totalOrders
        ? (dispatched / totalOrders) * 100
        : 0;

    // ---------------- GROUP ----------------
    const groupDepot = {};
    const groupProduct = {};

    filtered.forEach(o => {
        const bags = Number(o.bags) || 0;

        const depot = o.assigned_depot || "Unknown";
        const product = o.product_name || "Unknown";

        groupDepot[depot] = (groupDepot[depot] || 0) + bags;
        groupProduct[product] = (groupProduct[product] || 0) + bags;
    });

    let depotData = Object.keys(groupDepot).map(k => ({
        depot: k,
        bags: groupDepot[k]
    }));

    // 🔽 Sorting
    depotData.sort((a, b) => {
        return sortOrder === "asc"
            ? a.bags - b.bags
            : b.bags - a.bags;
    });

    const productData = Object.keys(groupProduct).map(k => ({
        product: k,
        bags: groupProduct[k]
    }));

    // ---------------- FIXES ----------------
    const allCities = [
        ...new Set(orders.map(x => x.city).filter(Boolean))
    ].sort();
    const sortedDepot = [...depotData].sort((a, b) => b.bags - a.bags);
    const sortedProduct = [...productData].sort((a, b) => b.bags - a.bags);
    const trendMap = {};

    filtered.forEach(o => {
        if (!o.order_date) return;

        const day = dayjs(o.order_date).format("YYYY-MM-DD");
        const bags = Number(o.bags) || 0;

        trendMap[day] = (trendMap[day] || 0) + bags;
    });
    const filteredDealerOptions = dealerMaster.filter(d => {
        // Filter by city
        if (cities.length && !cities.includes(d.city)) return false;

        // Filter by date (based on orders)
        if (startDate || endDate) {
            const dealerOrders = orders.filter(o => o.dealer_id === d.dealer_id);

            const hasValidDate = dealerOrders.some(o => {
                const orderDate = new Date(o.order_date);
                if (startDate && orderDate < new Date(startDate)) return false;
                if (endDate && orderDate > new Date(endDate)) return false;
                return true;
            });

            if (!hasValidDate) return false;
        }

        return true;
    });
    const filteredDepotOptions = [
        ...new Set(
            orders
                .filter(o => {
                    // 📅 Date filter
                    if (startDate && new Date(o.order_date) < new Date(startDate)) return false;
                    if (endDate && new Date(o.order_date) > new Date(endDate)) return false;

                    // 🌆 City filter (via dealer)
                    if (cities.length > 0) {
                        const dealer = dealerMaster.find(d => d.dealer_id === o.dealer_id);
                        if (!dealer || !cities.includes(dealer.city)) return false;
                    }

                    return true;
                })
                .map(o => o.assigned_depot)
                .filter(Boolean)
        )
    ];

    const trendData = Object.keys(trendMap)
        .sort()
        .map(d => ({
            date: d,
            bags: trendMap[d]
        }));
    const statusData = [
        { name: "Dispatched", value: dispatched },
        { name: "Pending", value: pending }
    ];

    
    // ✅ UNIQUE LOCATION MAP (FIXED)
    const locationMap = {};

    filtered.forEach(o => {
        const dealer = dealerMaster.find(d => d.dealer_id === o.dealer_id);

        if (!dealer || !dealer.latitude || !dealer.longitude) return;

        const key = dealer.dealer_id;

        if (!locationMap[key]) {
            locationMap[key] = {
                name: dealer.dealer_id,
                city: dealer.city || "Unknown",
                latitude: Number(dealer.latitude),
                longitude: Number(dealer.longitude),
                orders: 0
            };
        }

        locationMap[key].orders += 1;
    });

    const locationData = [];

    // 🔵 Dealers
    dealerMaster.forEach(d => {
        if (d.latitude && d.longitude) {
            locationData.push({
                lat: Number(d.latitude),
                lng: Number(d.longitude),
                type: "dealer",
                name: d.dealer_id,
                city: d.city
            });
        }
    });

    // 🔴 Depots
    depotMaster.forEach(d => {
        if (d.latitude && d.longitude) {
            locationData.push({
                lat: Number(d.latitude),
                lng: Number(d.longitude),
                type: "depot",
                name: d.depot_code
            });
        }
    });
    
    // 📍 City-wise grouping
    const cityMap = {};

    filtered.forEach(o => {
        const city = o.city || "Unknown";
        const bags = Number(o.bags) || 0;

        // 🔥 aggregate properly
        cityMap[city] = (cityMap[city] || 0) + bags;
    });

    // ✅ convert to array (ONLY UNIQUE)
    const cityData = Object.entries(cityMap).map(([name, value]) => ({
        name,
        value
    }));
    
   
    const topCities = [...cityData]
        .sort((a, b) => b.value - a.value)
        .slice(0, 10);
    const COLORS = ["#28a745", "#dc3545"]; // green = dispatched, red = pending
    
    
    const dealerLocations = dealerMaster.filter(
        d => d.latitude && d.longitude
    );

    const depotLocations = depotMaster
        .filter(d =>
            d.latitude &&
            d.longitude &&
            !isNaN(Number(d.latitude)) &&
            !isNaN(Number(d.longitude))
        )
        .map(d => ({
            ...d,
            latitude: Number(d.latitude),
            longitude: Number(d.longitude),
            depot_code: d.depot_code?.trim()
        }));
    
    
    const filteredDealers = dealerLocations.filter(loc => {

        if (!selectedDealer && !selectedDepot) return true;

        if (selectedDealer &&
            loc.dealer_id?.trim().toLowerCase() !== selectedDealer.trim().toLowerCase()
        ) return false;

        if (selectedDepot) {
            const dealer = dealerMaster.find(d => d.dealer_id === loc.dealer_id);

            // ✅ DON'T REMOVE if missing
            if (!dealer || !dealer.nearest_depot_id) return true;

            return dealer.nearest_depot_id.trim().toLowerCase() ===
                selectedDepot.trim().toLowerCase();
        }

        return true;
    });
    const filteredDepots = depotLocations.filter(loc => {
        if (!selectedDepot) return true;

        return String(loc.depot_code).trim().toLowerCase() ===
            String(selectedDepot).trim().toLowerCase();
    });
    const filteredOrders = filtered.filter(o => {
        if (viewMode === "depot") {
            if (selectedDepot && o.assigned_depot !== selectedDepot) return false;
        }

        if (viewMode === "dealer") {
            if (selectedDealer && o.dealer_id !== selectedDealer) return false;
        }

        return true;
    });
    
        
  
    const depotMetrics = {};

    filtered.forEach(o => {
        const depot = o.assigned_depot?.trim();
        

        if (!depot) return;

        if (!depotMetrics[depot]) {
            depotMetrics[depot] = {
                orders: 0,
                weight: 0
            };
        }

        depotMetrics[depot].orders += 1;
        depotMetrics[depot].weight += Number(o.total_weight_mt || 0);
    });
 
    const getProductBreakdown = (depotCode, dealerId) => {

        const data = filteredOrders.filter(o => {
            if (viewMode === "depot") {
                return o.assigned_depot === depotCode;
            } else {
                return o.dealer_id === dealerId;
            }
        });

        const result = {};

        data.forEach(o => {

            const unit = o.unit || o.uom || "MT";

            if (!result[o.product_name]) {
                result[o.product_name] = {
                    value: 0,
                    unit
                };
            }

            result[o.product_name].value += Number(o.total_weight_mt || 0);
        });

        const finalData = Object.entries(result).map(([name, item]) => ({
            name: `${name} (${item.unit})`,
            value: item.value
        }));

        return finalData.length
            ? finalData
            : [{ name: "No Data", value: 1 }];
    };
    const safeDealers = filteredDealers;
    const safeDepots = filteredDepots;
    
    // ---------------- UI ----------------
    return (
        <div className="overall-container">

            {/* -------- FILTERS -------- */}
            <div className="section">
                <h3>📅 Filter by Date</h3>

                <div className="filter-row">
                    <div className="input-group">
                        <label>From Date</label>
                        <input type="date" onChange={e => setStartDate(e.target.value)} />
                    </div>

                    <div className="input-group">
                        <label>To Date</label>
                        <input type="date" onChange={e => setEndDate(e.target.value)} />
                    </div>
                </div>
            </div>

            <div className="section">
                <h3>🏙 Filter by City</h3>

                <div className="input-group full">
                    <label>Select City</label>

                    <Select
                        options={allCities.map(c => ({ label: c, value: c }))}
                        isMulti
                        placeholder="Select City"
                        onChange={(selected) => {
                            setCities(selected ? selected.map(s => s.value) : []);
                        }}
                    />

                </div>

                <button className="btn" onClick={fetchData}>
                    🔄 Refresh Data
                </button>
            </div>

            {/* -------- METRICS -------- */}
            <div className="section">
                <h3>📊 Overall Metrics</h3>

                <div className="metrics-grid">

                    <div className="metric-card">
                        <span>Total Orders</span>
                        <h2>{totalOrders}</h2>
                    </div>

                    <div className="metric-card">
                        <span>Total Orders Weight (MT)</span>
                        <h2>{totalStockMT.toFixed(2)}</h2>
                    </div>

                    <div className="metric-card">
                        <span>Active Dealers</span>
                        <h2>{new Set(filtered.map(x => x.dealer_id)).size}</h2>
                    </div>

                    <div className="metric-card">
                        <span>Dispatched</span>
                        <h2>{dispatched}</h2>
                    </div>

                    <div className="metric-card">
                        <span>Pending</span>
                        <h2>{pending}</h2>
                    </div>

                    <div className="metric-card">
                        <span>Efficiency</span>
                        <h2>{efficiency.toFixed(1)}%</h2>
                    </div>

                    <div className="metric-card">
                        <span>Bags</span>
                        <h2>{totalBags}</h2>
                    </div>

                    <div className="metric-card">
                        <span>Depots</span>
                        <h2>{new Set(filtered.map(x => x.assigned_depot)).size}</h2>
                    </div>

                </div>
            </div>

            {/* -------- TOP PERFORMERS -------- */}
            <div className="section">
                <h3>🏆 Top Performers</h3>

                <div className="top-grid">

                    <div className="top-card">
                        <span>Top Selling Depot</span>
                        <h2>{sortedDepot[0]?.depot || "N/A"}</h2>
                        <p className="green">↑ {sortedDepot[0]?.bags || 0} bags</p>
                    </div>

                    <div className="top-card">
                        <span>Top Selling Product</span>
                        <h2>{sortedProduct[0]?.product || "N/A"}</h2>
                        <p className="green">↑ {sortedProduct[0]?.bags || 0} bags</p>
                    </div>

                </div>

            </div>
            {/* -------- CHARTS -------- */}

            <div className="section">
                <h3>📊 Orders by Depot</h3>

                <div style={{ marginBottom: "10px" }}>
                    <label>Sort: </label>
                    <select
                        value={sortOrder}
                        onChange={(e) => setSortOrder(e.target.value)}
                    >
                        <option value="desc">Descending</option>
                        <option value="asc">Ascending</option>
                    </select>
                </div>

                <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={depotData}>
                        <XAxis dataKey="depot" />
                        <YAxis />
                        <Tooltip />
                        <Bar dataKey="bags" fill="#1e6bb8" />
                    </BarChart>
                </ResponsiveContainer>
            </div>

            <div className="section">
                <h3>📦 Product Demand</h3>

                <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={productData}>
                        <defs>
                            <linearGradient id="blueGradient" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="0%" stopColor="#1e6bb8" stopOpacity={1} />
                                <stop offset="100%" stopColor="#1e6bb8" stopOpacity={0.4} />
                            </linearGradient>
                        </defs>

                        <XAxis dataKey="product" />
                        <YAxis />
                        <Tooltip />

                        <Bar dataKey="bags" fill="url(#blueGradient)" />
                    </BarChart>
                </ResponsiveContainer>
            </div>
            <div className="section">
                <h3>📈 Orders Trend</h3>

                <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={trendData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="date" />
                        <YAxis />
                        <Tooltip />
                        <Line type="monotone" dataKey="bags" />
                    </LineChart>
                </ResponsiveContainer>
            </div>
            <div className="section">
                <h3>📊 Order Insights</h3>

                <div style={{ display: "flex", gap: "40px" }}>

                    {/* LEFT - Status Pie */}
                    <div style={{ flex: 1 }}>
                        <h4 style={{ textAlign: "center", marginBottom: "10px" }}>
                            Order Status Distribution
                        </h4>
                        <ResponsiveContainer width="100%" height={300}>
                            <PieChart>
                                <Pie
                                    data={statusData}
                                    dataKey="value"
                                    nameKey="name"
                                    innerRadius={60}   // 🔥 makes donut
                                    outerRadius={100}
                                    paddingAngle={3}
                                >
                                    {statusData.map((entry, index) => (
                                        <Cell key={index} fill={COLORS[index % COLORS.length]} />
                                    ))}
                                </Pie>

                                <Tooltip />
                                <Legend />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>

                    {/* RIGHT - City Bar Chart */}
                    <div style={{ flex: 1 }}>
                        <h4 style={{ textAlign: "center" }}>Top Cities Orders</h4>

                        <ResponsiveContainer width="100%" height={300}>
                            <BarChart
                                data={topCities}
                                layout="vertical"
                                margin={{ top: 20, right: 30, left: 60, bottom: 10 }}
                            >
                                <XAxis type="number" />
                                <YAxis
                                    dataKey="name"
                                    type="category"
                                    interval={0}
                                    width={250}
                                    // 🔥 give space for long names
                                />
                                <Tooltip />
                                <Legend />

                                <Bar
                                    dataKey="value"
                                    fill="#1e6bb8"
                                    barSize={20}   // makes bars thinner → more space
                                />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>

                </div>
            </div>
            <div className="section">
                <h3>🗺 Dealer & Depot Locations</h3>
                <div className="toggle-wrapper">
                    <div className="toggle-switch">
                        <div
                            className={`toggle-slider ${viewMode === "depot" ? "right" : "left"}`}
                        />

                        <button
                            className={`toggle-btn ${viewMode === "dealer" ? "active" : ""}`}
                            onClick={() => setViewMode("dealer")}
                        >
                            Dealers
                        </button>

                        <button
                            className={`toggle-btn ${viewMode === "depot" ? "active" : ""}`}
                            onClick={() => setViewMode("depot")}
                        >
                            Depots
                        </button>
                    </div>
                </div>

                {/* 🔥 SINGLE DYNAMIC DROPDOWN */}
                <div style={{ marginBottom: "15px" }}>
                    <label>
                        {viewMode === "dealer" ? "Dealer:" : "Depot:"}
                    </label>
                    <br />

                    <select
                        value={viewMode === "dealer" ? selectedDealer : selectedDepot}
                        onChange={(e) => {
                            if (viewMode === "dealer") {
                                setSelectedDealer(e.target.value);
                            } else {
                                setSelectedDepot(e.target.value);
                            }
                        }}
                    >
                        <option value="">
                            {viewMode === "dealer" ? "All Dealers" : "All Depots"}
                        </option>

                        {viewMode === "dealer"
                            ? filteredDealerOptions.map(d => (
                                <option key={d.dealer_id} value={d.dealer_id}>
                                    {d.dealer_id}
                                </option>
                            ))
                            : filteredDepotOptions.map(d => (
                                <option key={d} value={d}>
                                    {d}
                                </option>
                            ))}
                    </select>
                </div>

                <MapContainer
                    key={viewMode}   // ✅ ADD THIS
                    center={[13.0, 80.0]}
                    zoom={6}
                    style={{ height: "450px", width: "100%" }}
                >
                    <ZoomOnClick position={clickedPosition} />

                    <FixMap
                        viewMode={viewMode}
                        selectedDealer={selectedDealer}
                        selectedDepot={selectedDepot}
                        dealerLocations={dealerLocations}
                        depotLocations={depotLocations}
                    />

                    <TileLayer
                        url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
                    />
                    {(safeDealers.length > 0 || safeDepots.length > 0) && (

                    <MarkerClusterGroup>

                        {/* 🔵 DEALERS */}
                        {viewMode === "dealer" &&
                            safeDealers.map((loc, index) => {
                                const lat = Number(loc.latitude);
                                const lng = Number(loc.longitude);

                                if (
                                    lat === null ||
                                    lng === null ||
                                    isNaN(lat) ||
                                    isNaN(lng)
                                ) return null;

                                return (
                                    <Marker
                                        key={`dealer-${index}`}
                                        position={[lat, lng]}
                                        icon={dealerIcon}
                                        eventHandlers={{
                                            click: () => {
                                                if (!isNaN(lat) && !isNaN(lng)) {
                                                    if (
                                                        !clickedPosition ||
                                                        clickedPosition[0] !== lat ||
                                                        clickedPosition[1] !== lng
                                                    ) {
                                                        setClickedPosition([lat, lng]);
                                                    }
                                                }
                                            }
                                        }}
                                    >
                                        <Popup>
                                            <b>Dealer</b><br />
                                            {loc.dealer_id}<br />
                                            {loc.city}

                                            {(() => {
                                                const data = getProductBreakdown(null, loc.dealer_id);

                                                return (
                                                    <PieChart width={250} height={200}>
                                                        <Pie
                                                            data={data}
                                                            dataKey="value"
                                                            nameKey="name"
                                                            outerRadius={70}
                                                        >
                                                            {data.map((entry, i) => (
                                                                <Cell key={i} fill={`hsl(${i * 60}, 70%, 50%)`} />
                                                            ))}
                                                        </Pie>
                                                        <Tooltip />
                                                        <Legend />
                                                    </PieChart>
                                                );
                                            })()}
                                        </Popup>
                                    </Marker>
                                );
                            })
                        }

                        {/* 🔴 DEPOTS */}
                        {viewMode === "depot" &&
                            safeDepots.map((loc, index) => {
                                const lat = Number(loc.latitude);
                                const lng = Number(loc.longitude);

                                if (
                                    lat === null ||
                                    lng === null ||
                                    isNaN(lat) ||
                                    isNaN(lng)
                                ) return null;

                                return (
                                    <Marker
                                        key={`depot-${index}`}
                                        position={[lat, lng]}
                                        icon={
                                            selectedDepot?.trim().toLowerCase() ===
                                                loc.depot_code?.trim().toLowerCase()
                                                ? highlightedDepotIcon
                                                : depotIcon
                                        }
                                        eventHandlers={{
                                            click: () => {
                                                if (!isNaN(lat) && !isNaN(lng)) {
                                                    if (
                                                        !clickedPosition ||
                                                        clickedPosition[0] !== lat ||
                                                        clickedPosition[1] !== lng
                                                    ) {
                                                        setClickedPosition([lat, lng]);
                                                    }
                                                }
                                            }
                                        }}
                                    >
                                        <Popup>
                                            <b>Depot</b><br />
                                            {loc.depot_code}<br />
                                            Orders: {depotMetrics[loc.depot_code]?.orders || 0}<br />
                                            Weight: {(depotMetrics[loc.depot_code]?.weight || 0).toFixed(2)} MT

                                            {(() => {
                                                const data = getProductBreakdown(loc.depot_code, null);

                                                return (
                                                    <PieChart width={250} height={200}>
                                                        <Pie
                                                            data={data}
                                                            dataKey="value"
                                                            nameKey="name"
                                                            outerRadius={70}
                                                        >
                                                            {data.map((entry, i) => (
                                                                <Cell key={i} fill={`hsl(${i * 60}, 70%, 50%)`} />
                                                            ))}
                                                        </Pie>
                                                        <Tooltip />
                                                        <Legend />
                                                    </PieChart>
                                                );
                                            })()}
                                        </Popup>
                                    </Marker>
                                );
                            })
                        }

                    </MarkerClusterGroup>
                    )}
                </MapContainer>
                
            </div>


        </div>
    );
}

export default OverallTab;