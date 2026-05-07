import React, { useEffect, useState } from "react";
import { supabase } from "../../supabaseClient";

const StockList = () => {
    const [depotCodes, setDepotCodes] = useState([]);
    const [selectedDepot, setSelectedDepot] = useState("");
    const [stockData, setStockData] = useState([]);
    const [totalStock, setTotalStock] = useState(0);

    // 🔹 Load depot list
    useEffect(() => {
        fetchDepots();
    }, []);

    const fetchDepots = async () => {
        const { data, error } = await supabase
            .from("depot_master")
            .select("depot_code");

        if (error) {
            console.error(error);
            return;
        }

        setDepotCodes(data.map(d => d.depot_code));
    };

    // 🔹 Handle depot selection
    const handleDepotChange = async (e) => {
        const depot = e.target.value;
        setSelectedDepot(depot);

        if (!depot) return;

        const { data, error } = await supabase
            .from("stock_summary_view")
            .select("*")
            .eq("depot_code", depot);

        if (error) {
            console.error(error);
            return;
        }

        if (!data || data.length === 0) {
            setStockData([]);
            setTotalStock(0);
            return;
        }

        let grandTotal = 0;

        const formattedData = data.map(row => {
            const totalStock = row.total_stock_mt;
            const bagWeight = row.bag_weight || 50;
            const totalBags = Math.floor((totalStock * 1000) / bagWeight);

            grandTotal += totalStock;

            return {
                product_name: row.product_name,
                bag_weight: bagWeight,
                total_bags: totalBags,
                total_stock: totalStock
            };
        });

        setStockData(formattedData);
        setTotalStock(grandTotal);
    };
    const thStyle = {
        border: "1px solid #ddd",
        padding: "10px",
        fontWeight: "bold"
    };

    const tdStyle = {
        border: "1px solid #ddd",
        padding: "10px"
    };
    return (
        <div>
            <h1 style={{ color: "#ED1C24" }}>Stock List</h1>

            {/* 🔹 Depot Dropdown */}
            <select value={selectedDepot} onChange={handleDepotChange}>
                <option value="">Select Depot</option>
                {depotCodes.map((code, index) => (
                    <option key={index} value={code}>
                        {code}
                    </option>
                ))}
            </select>

            {/* 🔹 Table */}
            {stockData.length > 0 ? (
                <>
                    <table style={{
                        width: "100%",
                        marginTop: "20px",
                        borderCollapse: "collapse",
                        textAlign: "center"
                    }}>
                        <thead style={{ background: "#f5f5f5" }}>
                            <tr>
                                <th style={thStyle}>Product Name</th>
                                <th style={thStyle}>Bag Weight (kg)</th>
                                <th style={thStyle}>Total Bags</th>
                                <th style={thStyle}>Total Stock (MT)</th>
                            </tr>
                        </thead>

                        <tbody>
                            {stockData.map((row, index) => (
                                <tr key={index}>
                                    <td style={tdStyle}>{row.product_name}</td>
                                    <td style={tdStyle}>{row.bag_weight}</td>
                                    <td style={tdStyle}>{row.total_bags}</td>
                                    <td style={tdStyle}>{row.total_stock}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>

                    <h3 style={{ color: "green", marginTop: "15px" }}>
                        Total Available Stock: {totalStock.toFixed(2)} MT
                    </h3>
                </>
            ) : (
                selectedDepot && <p>No stock available</p>
            )}
        </div>
    );
};

export default StockList;