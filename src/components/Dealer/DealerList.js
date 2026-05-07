import React, { useEffect, useState } from "react";
import { supabase } from "../../supabaseClient";

const DealerList = () => {
    const [dealers, setDealers] = useState([]);
    const [search, setSearch] = useState("");
    const [currentPage, setCurrentPage] = useState(1);

    const rowsPerPage = 20;

    // 🔥 Fetch data
    useEffect(() => {
        fetchDealers();
    }, []);

    const fetchDealers = async () => {
        const { data, error } = await supabase
            .from("dealer_master")
            .select("*")
            .order("dealer_id", { ascending: true });

        if (error) {
            console.error(error);
        } else {
            setDealers(data);
        }
    };

    // 🔍 Filter
    const filteredData = dealers.filter((d) => {
        const query = search.toLowerCase();

        return (
            (d.dealer_id || "").toLowerCase().includes(query) ||
            (d.dealer_name || "").toLowerCase().includes(query) ||
            (d.city || "").toLowerCase().includes(query) ||
            (d.pincode || "").toLowerCase().includes(query)
        );
    });

    // 🔢 Pagination
    const indexOfLast = currentPage * rowsPerPage;
    const indexOfFirst = indexOfLast - rowsPerPage;
    const currentData = filteredData.slice(indexOfFirst, indexOfLast);

    const totalPages = Math.ceil(filteredData.length / rowsPerPage);

    return (
        <div style={styles.container}>

            <h3 style={styles.title}>Dealer List</h3>

            {/* 🔍 Search */}
            <input
                type="text"
                placeholder="Search by ID / Name / City / Pincode"
                value={search}
                onChange={(e) => {
                    setSearch(e.target.value);
                    setCurrentPage(1);
                }}
                style={styles.search}
            />

            {/* 📊 Table */}
            <div style={{ overflowX: "auto" }}>
                <table style={styles.table}>
                    <thead>
                        <tr>
                            <th style={styles.th}>ID</th>
                            <th style={styles.th}>Name</th>
                            <th style={styles.th}>City</th>
                            <th style={styles.th}>Mobile</th>
                        </tr>
                    </thead>

                    <tbody>
                        {currentData.length > 0 ? (
                            currentData.map((d) => (
                                <tr key={d.dealer_id}>
                                    <td style={styles.td}>{d.dealer_id}</td>
                                    <td style={styles.td}>{d.dealer_name}</td>
                                    <td style={styles.td}>{d.city}</td>
                                    <td style={styles.td}>{d.mobile}</td>
                                </tr>
                            ))
                        ) : (
                            <tr>
                                <td colSpan="4" style={{ textAlign: "center", padding: "10px" }}>
                                    No dealer records found
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            {/* 🔢 Pagination */}
            {totalPages > 1 && (
                <div style={styles.pagination}>
                    <button
                        onClick={() => setCurrentPage(currentPage - 1)}
                        disabled={currentPage === 1}
                        style={styles.pageBtn}
                    >
                        Prev
                    </button>

                    <span>
                        Page {currentPage} of {totalPages}
                    </span>

                    <button
                        onClick={() => setCurrentPage(currentPage + 1)}
                        disabled={currentPage === totalPages}
                        style={styles.pageBtn}
                    >
                        Next
                    </button>
                </div>
            )}
        </div>
    );
};

export default DealerList;
const styles = {
    container: {
        padding: "20px",
    },

    title: {
        marginBottom: "10px",
        fontSize: "18px",
        fontWeight: "600",
    },

    search: {
        width: "100%",
        padding: "10px",
        marginBottom: "15px",
        border: "1px solid #ccc",
        borderRadius: "6px",
    },

    table: {
        width: "100%",
        borderCollapse: "collapse",
    },

    th: {
        textAlign: "left",
        padding: "10px",
        borderBottom: "2px solid #ccc",
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

    pageBtn: {
        padding: "8px 15px",
        cursor: "pointer",
        border: "none",
        background: "#1976d2",
        color: "#fff",
        borderRadius: "5px",
    },
};