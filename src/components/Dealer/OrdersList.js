import React, { useEffect, useState } from "react";
import { supabase } from "../../supabaseClient";

const OrdersList = () => {
    const [orders, setOrders] = useState([]);
    const [selectedDealer, setSelectedDealer] = useState("");
    const [selectedOrderId, setSelectedOrderId] = useState("");
    const [fromDate, setFromDate] = useState("");
    const [toDate, setToDate] = useState("");
    const [currentPage, setCurrentPage] = useState(1);

    const rowsPerPage = 10;

    // 🔥 Fetch Orders
    useEffect(() => {
        fetchOrders();
    }, []);

    const fetchOrders = async () => {
        const { data, error } = await supabase
            .from("dealer_orders")
            .select("*")
            .order("order_date", { ascending: false });

        if (error) console.error(error);
        else setOrders(data);
    };

    // 🔽 Unique Dealer IDs
    const dealerIds = [...new Set(orders.map((o) => o.dealer_id))].sort();

    // 🔍 FILTER LOGIC
    let filteredData = orders;

    if (selectedDealer) {
        filteredData = filteredData.filter(
            (o) => o.dealer_id === selectedDealer
        );
    }

    if (selectedOrderId && selectedOrderId.trim() !== "") {
        filteredData = filteredData.filter((o) =>
            String(o.id).includes(selectedOrderId.trim())
        );
    }

    if (fromDate) {
        filteredData = filteredData.filter(
            (o) => new Date(o.order_date) >= new Date(fromDate)
        );
    }

    if (toDate) {
        filteredData = filteredData.filter(
            (o) => new Date(o.order_date) <= new Date(toDate)
        );
    }

    // 🔢 Pagination
    const indexOfLast = currentPage * rowsPerPage;
    const indexOfFirst = indexOfLast - rowsPerPage;
    const currentData = filteredData.slice(indexOfFirst, indexOfLast);

    const totalPages = Math.ceil(filteredData.length / rowsPerPage);

    return (
        <div style={styles.container}>
            <h2 style={styles.title}>Orders List</h2>

            {/* 🔽 FILTERS */}
            <div style={styles.filterRow}>

                {/* Dealer Filter */}
                <select
                    value={selectedDealer}
                    onChange={(e) => {
                        setSelectedDealer(e.target.value);
                        setSelectedOrderId(""); // reset order filter
                        setCurrentPage(1);
                    }}
                    style={styles.input}
                >
                    <option value="">All Dealers</option>
                    {dealerIds.map((id) => (
                        <option key={id} value={id}>
                            {id}
                        </option>
                    ))}
                </select>

                {/* 🔥 Dynamic Order ID Filter */}
                {selectedDealer ? (
                    // Dropdown when dealer selected
                    <select
                        value={selectedOrderId}
                        onChange={(e) => {
                            setSelectedOrderId(e.target.value);
                            setCurrentPage(1);
                        }}
                        style={styles.input}
                    >
                        <option value="">All Orders</option>

                        {[...new Set(
                            orders
                                .filter((o) => o.dealer_id === selectedDealer)
                                .map((o) => o.id)
                        )]
                            .sort((a, b) => b - a)
                            .map((id) => (
                                <option key={id} value={id}>
                                    {id}
                                </option>
                            ))}
                    </select>
                ) : (
                    // Input when no dealer selected
                    <input
                        type="text"
                        placeholder="Search Order ID"
                        value={selectedOrderId}
                        onChange={(e) => {
                            setSelectedOrderId(e.target.value);
                            setCurrentPage(1);
                        }}
                        style={styles.input}
                    />
                )}

                {/* Date Filters */}
                <input
                    type="date"
                    value={fromDate}
                    onChange={(e) => {
                        setFromDate(e.target.value);
                        setCurrentPage(1);
                    }}
                    style={styles.input}
                />

                <input
                    type="date"
                    value={toDate}
                    onChange={(e) => {
                        setToDate(e.target.value);
                        setCurrentPage(1);
                    }}
                    style={styles.input}
                />
            </div>

            {/* 📊 TABLE */}
            <div style={{ overflowX: "auto" }}>
                <table style={styles.table}>
                    <thead>
                        <tr>
                            <th style={styles.th}>Order ID</th>
                            <th style={styles.th}>Dealer ID</th>
                            <th style={styles.th}>Product</th>
                            <th style={styles.th}>Bags</th>
                            <th style={styles.th}>Date</th>
                        </tr>
                    </thead>

                    <tbody>
                        {currentData.length > 0 ? (
                            currentData.map((o) => (
                                <tr key={o.id}>
                                    <td style={styles.td}>{o.id}</td>
                                    <td style={styles.td}>{o.dealer_id}</td>
                                    <td style={styles.td}>{o.product_name}</td>
                                    <td style={styles.td}>{o.bags}</td>
                                    <td style={styles.td}>
                                        {new Date(o.order_date).toLocaleDateString()}
                                    </td>
                                </tr>
                            ))
                        ) : (
                            <tr>
                                <td colSpan="5" style={{ textAlign: "center", padding: "10px" }}>
                                    No orders found
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            {/* 🔢 PAGINATION */}
            {totalPages > 1 && (
                <div style={styles.pagination}>
                    <button
                        onClick={() => setCurrentPage(currentPage - 1)}
                        disabled={currentPage === 1}
                        style={styles.btn}
                    >
                        ⬅ Previous
                    </button>

                    <span>
                        Page {currentPage} of {totalPages}
                    </span>

                    <button
                        onClick={() => setCurrentPage(currentPage + 1)}
                        disabled={currentPage === totalPages}
                        style={styles.btn}
                    >
                        Next ➡
                    </button>
                </div>
            )}
        </div>
    );
};

export default OrdersList;
const styles = {
    container: {
        padding: "20px",
    },

    title: {
        marginBottom: "15px",
    },

    filterRow: {
        display: "flex",
        gap: "10px",
        marginBottom: "15px",
    },

    input: {
        padding: "10px",
        border: "1px solid #ccc",
        borderRadius: "5px",
    },

    table: {
        width: "100%",
        borderCollapse: "collapse",
    },

    th: {
        padding: "10px",
        borderBottom: "2px solid #ccc",
        textAlign: "left",
        background: "#f5f5f5",
    },

    td: {
        padding: "10px",
        borderBottom: "1px solid #eee",
    },

    pagination: {
        marginTop: "15px",
        display: "flex",
        justifyContent: "center",
        gap: "20px",
        alignItems: "center",
    },

    btn: {
        padding: "8px 15px",
        background: "#1976d2",
        color: "#fff",
        border: "none",
        borderRadius: "5px",
        cursor: "pointer",
    },
};