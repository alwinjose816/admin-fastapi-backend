import React, { useEffect, useState } from "react";
import { supabase } from "../../supabaseClient";
import "./Monitor.css";

function DamageTab() {
    const [requests, setRequests] = useState([]);
    const [tab, setTab] = useState("pending"); // pending | approved
    const [selectedDepot, setSelectedDepot] = useState("All");
    const [depots, setDepots] = useState([]);
    
    useEffect(() => {
        fetchRequests();
        fetchDepots();
        // eslint-disable-next-line
    }, [tab, selectedDepot]);
    const fetchDepots = async () => {
        const { data } = await supabase
            .from("depot_master")
            .select("depot_code");

        setDepots(data || []);
    };

    // 🔹 FETCH DATA BASED ON TAB
    const fetchRequests = React.useCallback(async () => {
        let query = supabase
            .from("damage_requests")
            .select("*")
            .eq("status", tab);

        if (selectedDepot !== "All") {
            query = query.eq("depot_id", selectedDepot);
        }

        const { data, error } = await query.order("id", {
            ascending: false
        });

        if (error) {
            console.error(error);
            return;
        }

        setRequests(data || []);
    }, [tab, selectedDepot]);

    // 🔹 APPROVE
    async function approve(req) {
        const { data: stock } = await supabase
            .from("depot_stock")
            .select("*")
            .eq("product_code", req.product_id)
            .eq("depot_code", req.depot_id)
            .eq("row_no", req.row_no)
            .eq("column_no", req.column_no)
            .single();

        if (!stock) {
            alert("❌ Stock not found");
            return;
        }

        if (req.quantity > stock.number_of_bags) {
            alert("❌ Not enough stock");
            return;
        }

        await supabase.from("depot_stock").update({
            number_of_bags: stock.number_of_bags - req.quantity,
            damaged_bags: (stock.damaged_bags || 0) + req.quantity
        })
            .eq("product_code", req.product_id)
            .eq("depot_code", req.depot_id)
            .eq("row_no", req.row_no)
            .eq("column_no", req.column_no);

        await supabase
            .from("damage_requests")
            .update({
                status: "approved"
            })
            .eq("id", req.id);

        alert("✅ Approved");
        setTab("approved");
    }

    // 🔹 DISPOSE
    async function dispose(req) {
        const { data: stock } = await supabase
            .from("depot_stock")
            .select("*")
            .eq("product_code", req.product_id)
            .eq("depot_code", req.depot_id)
            .eq("row_no", req.row_no)
            .eq("column_no", req.column_no)
            .single();

        if (!stock) {
            alert("❌ Stock not found");
            return;
        }

        if (req.quantity > (stock.damaged_bags || 0)) {
            alert("❌ Not enough damaged stock");
            return;
        }

        await supabase.from("depot_stock").update({
            damaged_bags: stock.damaged_bags - req.quantity
        })
            .eq("product_code", req.product_id)
            .eq("depot_code", req.depot_id)
            .eq("row_no", req.row_no)
            .eq("column_no", req.column_no);

        await supabase
            .from("damage_requests")
            .update({
                status: "disposed",
                disposed_at: new Date().toISOString()
            })
            .eq("id", req.id);
        setTab("disposed");
    }

    // 🔹 REJECT
    async function reject(id) {
        await supabase
            .from("damage_requests")
            .update({ status: "rejected" })
            .eq("id", id);

        alert("🚫 Rejected");
        fetchRequests();
    }

    return (
        <div className="damage-wrapper">

            <h2 className="page-title">🚨 Damage Approval</h2>
            <select
                value={selectedDepot}
                onChange={(e) => setSelectedDepot(e.target.value)}
                className="depot-filter"
            >
                <option value="All">All Depots</option>

                {depots.map((d) => (
                    <option key={d.depot_code} value={d.depot_code}>
                        {d.depot_code}
                    </option>
                ))}
            </select>

            {/* Tabs */}
            <div className="top-tabs">
                <span
                    className={tab === "pending" ? "active-tab" : ""}
                    onClick={() => setTab("pending")}
                >
                    Pending
                </span>

                <span
                    className={tab === "approved" ? "active-tab" : ""}
                    onClick={() => setTab("approved")}
                >
                    Dispose
                </span>
                <span
                    className={tab === "disposed" ? "active-tab" : ""}
                    onClick={() => setTab("disposed")}
                >
                    History
                </span>
            </div>

            {/* SECTION TITLE */}
            <h3 className="section-title-red">
                {tab === "pending"
                    ? "Pending Requests"
                    : tab === "approved"
                        ? "Approved for Disposal"
                        : "Disposed History"}
            </h3>

            {/* EMPTY */}
            {requests.length === 0 ? (
                <p className="empty-text">
                    {tab === "pending"
                        ? "No pending requests"
                        : tab === "approved"
                            ? "No items to dispose"
                            : "No disposed history"}
                </p>
            ) : (
                requests.map((req) => (
                    <div key={req.id} className="row-box">

                        <div className="row-item">
                            <label>Product</label>
                            <span>{req.product_name}</span>
                        </div>

                        <div className="row-item">
                            <label>Depot</label>
                            <span>{req.depot_id}</span>
                        </div>

                        <div className="row-item">
                            <label>Location</label>
                            <span>Row {req.row_no} | Col {req.column_no}</span>
                        </div>

                        <div className="row-item">
                            <label>Quantity</label>
                            <span>{req.quantity}</span>
                        </div>

                        <div className="row-item">
                            <label>Damage Type</label>
                            <span>{req.damage_type}</span>
                        </div>
                        {tab === "disposed" && (
                            <div className="row-item">
                                <label>Disposed Date</label>
                                <span>
                                    {req.disposed_at
                                        ? new Date(req.disposed_at).toLocaleString()
                                        : "-"}
                                </span>
                            </div>
                        )}

                        <div className="action-buttons">
                            {req.status === "pending" && (
                                <>
                                    <button
                                        className="btn approve"
                                        onClick={() => approve(req)}
                                    >
                                        Approve
                                    </button>

                                    <button
                                        className="btn reject"
                                        onClick={() => reject(req.id)}
                                    >
                                        Reject
                                    </button>
                                </>
                            )}

                            {req.status === "approved" && (
                                <button
                                    className="btn dispose"
                                    onClick={() => dispose(req)}
                                >
                                    Dispose
                                </button>
                            )}
                        </div>

                    </div>
                ))
            )}
        </div>
    );
}

export default DamageTab;