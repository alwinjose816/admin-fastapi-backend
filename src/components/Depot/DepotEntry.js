import React, { useState, useEffect, useRef } from "react";
import { supabase } from "../../supabaseClient";

const STACK_HEIGHT = 15;

function DepotEntry() {
    const [depotName, setDepotName] = useState("");
    const [depotCode, setDepotCode] = useState("");
    const [rows, setRows] = useState("");
    const [columns, setColumns] = useState("");
    const [area, setArea] = useState("");
    const [address, setAddress] = useState("");

    const [suggestions, setSuggestions] = useState([]);
    const [location, setLocation] = useState({});
    const [mapReady, setMapReady] = useState(false);

    const mapRef = useRef(null);
    const markerRef = useRef(null);
    const searchRef = useRef(null);
    
        
    
    
    // 🔥 LOAD MAP
    useEffect(() => {
        const loadMap = () => {
            if (!window.google) {
                setTimeout(loadMap, 500);
                return;
            }

            mapRef.current = new window.google.maps.Map(
                document.getElementById("map"),
                {
                    center: { lat: 13.0827, lng: 80.2707 },
                    zoom: 12,
                }
            );

            mapRef.current.addListener("click", handleMapClick);
            setMapReady(true);
        };

        loadMap();
    }, []);
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (searchRef.current && !searchRef.current.contains(event.target)) {
                setSuggestions([]); // 🔥 hide dropdown
            }
        };

        document.addEventListener("mousedown", handleClickOutside);

        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, []);
    
    // 🔥 MAP CLICK
    const handleMapClick = (event) => {
        const lat = event.latLng.lat();
        const lng = event.latLng.lng();

        if (markerRef.current) {
            markerRef.current.setPosition({ lat, lng });
        } else {
            markerRef.current = new window.google.maps.Marker({
                position: { lat, lng },
                map: mapRef.current,
            });
        }

        setLocation((prev) => ({
            ...prev,
            latitude: lat,
            longitude: lng,
        }));
    };

    // 🔥 AUTOCOMPLETE SEARCH
    const handleSearch = (value) => {
        setAddress(value);

        if (!window.google) return;

        const service = new window.google.maps.places.AutocompleteService();

        service.getPlacePredictions(
            {
                input: value,
                componentRestrictions: { country: "in" },
            },
            (predictions) => {
                setSuggestions(predictions || []);
            }
        );
    };

    // 🔥 SELECT PLACE
    const selectPlace = async (place) => {
        setAddress(place.description);
        setSuggestions([]);

        const res = await fetch(
            `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(
                place.description
            )}&key=AIzaSyD6kKoeqpSS76MSIg9kREgPsw2j_v1LmDo`
        );

        const data = await res.json();

        if (data.status === "OK") {
            const loc = data.results[0].geometry.location;

            mapRef.current.setCenter(loc);
            mapRef.current.setZoom(17);

            if (markerRef.current) {
                markerRef.current.setPosition(loc);
            } else {
                markerRef.current = new window.google.maps.Marker({
                    position: loc,
                    map: mapRef.current,
                });
            }

            setLocation((prev) => ({
                ...prev,
                latitude: loc.lat,
                longitude: loc.lng,
            }));
        }
    };
    const searchManualAddress = async () => {
        if (!address) {
            alert("Enter address");
            return;
        }

        if (!mapRef.current) {
            alert("Map not ready yet");
            return;
        }

        try {
            console.log("Searching:", address);

            const res = await fetch(
                `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(address)}&key=AIzaSyD6kKoeqpSS76MSIg9kREgPsw2j_v1LmDo`
            );

            const data = await res.json();

            console.log("API RESPONSE:", data);

            if (data.status === "OK") {
                const loc = data.results[0].geometry.location;

                // 🔥 MOVE MAP
                mapRef.current.setCenter(loc);
                mapRef.current.setZoom(17);

                // 🔥 FIX MARKER
                if (!markerRef.current) {
                    markerRef.current = new window.google.maps.Marker({
                        map: mapRef.current,
                    });
                }

                markerRef.current.setPosition(loc);

                // 🔥 SAVE LOCATION
                setLocation((prev) => ({
                    ...prev,
                    latitude: loc.lat,
                    longitude: loc.lng,
                }));

            } else {
                alert("Address not found ❌");
            }

        } catch (err) {
            console.error("ERROR:", err);
            alert("Something went wrong");
        }
    };

    // 🔥 REVERSE GEOCODE
    const getCoordinates = async () => {
        if (!location.latitude) {
            alert("Select location first");
            return;
        }

        const res = await fetch(
            `https://maps.googleapis.com/maps/api/geocode/json?latlng=${location.latitude},${location.longitude}&key=AIzaSyD6kKoeqpSS76MSIg9kREgPsw2j_v1LmDo`
        );

        const data = await res.json();

        if (data.status === "OK") {
            const result = data.results[0];

            let temp = {
                latitude: location.latitude,
                longitude: location.longitude,
                city: "",
                district: "",
                state: "",
                pincode: "",
            };

            result.address_components.forEach((comp) => {
                const types = comp.types;

                if (types.includes("locality")) temp.city = comp.long_name;
                if (types.includes("administrative_area_level_2"))
                    temp.district = comp.long_name;
                if (types.includes("administrative_area_level_1"))
                    temp.state = comp.long_name;
                if (types.includes("postal_code"))
                    temp.pincode = comp.long_name;
            });

            setLocation(temp);
            setIsLocationFetched(true);
        }
    };

    // 🔥 CALCULATIONS
    const totalStacks = rows * columns;
    const capacityBags = totalStacks * STACK_HEIGHT;
    const capacityMT = (capacityBags * 50) / 1000;

    // 🔥 SAVE
    const [loading, setLoading] = useState(false);
    const [isLocationFetched, setIsLocationFetched] = useState(false);
    const isValid =
        depotName &&
        depotCode &&
        rows &&
        columns &&
        area &&
        isLocationFetched;
    

    const handleSave = async () => {
        if (loading) return; // 🚫 prevent double click

        // 🔴 VALIDATION
        if (
            !depotName ||
            !depotCode ||
            !rows ||
            !columns ||
            !area ||
            !location.latitude ||
            !location.longitude ||
            !location.city
        ) {
            alert("Please complete location details ❌");
            return;
       
        }

        setLoading(true);

        const code = depotCode.toUpperCase();

        try {
            // 🔍 STEP 1: CHECK DUPLICATE (CASE SAFE)
            const { data: existing, error: checkError } = await supabase
                .from("depot_master")
                .select("id")
                .ilike("depot_code", code); // 🔥 case-insensitive

            if (checkError) {
                console.error(checkError);
                alert("Error checking depot code ❌");
                setLoading(false);
                return;
            }

            if (existing.length > 0) {
                alert("Depot code already exists ❌");
                setLoading(false);
                return;
            }

            // 💾 STEP 2: INSERT DATA
            const { error } = await supabase.from("depot_master").insert([
                {
                    depot_name: depotName,
                    depot_code: code,
                    area_sqft: Number(area) || 0,
                    total_stacks: Number(rows) * Number(columns),
                    capacity_bags: (Number(rows) * Number(columns)) * STACK_HEIGHT,
                    capacity_mt:
                        ((Number(rows) * Number(columns)) * STACK_HEIGHT * 50) / 1000,
                    address,
                    city: location.city || "",
                    district: location.district || "",
                    state: location.state || "",
                    pincode: location.pincode,
                    latitude: location.latitude,
                    longitude: location.longitude,
                    max_rows: Number(rows) || 0,
                    max_columns: Number(columns) || 0,
                },
            ]);

            if (error) {
                console.error(error);
                alert("Error saving depot ❌");
            } else {
                alert("Depot saved successfully ✅");

                // 🔄 OPTIONAL: RESET FORM
                setDepotName("");
                setDepotCode("");
                setArea("");
                setRows("");
                setColumns("");
                setAddress("");
                setLocation({
                    latitude: "",
                    longitude: "",
                    city: "",
                    district: "",
                    state: "",
                    pincode: "",
                });
            }
        } catch (err) {
            console.error(err);
            alert("Unexpected error ❌");
        }

        setLoading(false);
    };
    return (
        <div style={styles.page}>
            <h1 style={styles.heading}>🏭 Depot Entry</h1>

            <div style={styles.mainContainer}>

                {/* LEFT SIDE */}
                <div style={styles.leftSection}>

                    {/* BASIC DETAILS */}
                    <h3 style={styles.sectionTitle}>Basic Details</h3>
                    <input
                        placeholder="Depot Name"
                        value={depotName}
                        onChange={(e) => setDepotName(e.target.value)}
                        style={styles.input}
                    />
                    <input
                        placeholder="Depot Code"
                        value={depotCode}
                        onChange={(e) => setDepotCode(e.target.value)}
                        style={styles.input}
                    />

                    {/* STORAGE */}
                    <h3 style={styles.sectionTitle}>Storage Layout</h3>
                    <div style={styles.grid2}>
                        <input
                            type="number"
                            placeholder="Rows"
                            value={rows}
                            onChange={(e) => setRows(e.target.value)}
                            style={styles.input}
                        />
                        <input
                            type="number"
                            placeholder="Columns"
                            value={columns}
                            onChange={(e) => setColumns(e.target.value)}
                            style={styles.input}
                        />
                    </div>

                    <input
                        placeholder="Area"
                        value={area}
                        onChange={(e) => setArea(e.target.value)}
                        style={styles.inputFull}
                    />

                    {/* LOCATION */}
                    <h3 style={styles.sectionTitle}>Location</h3>

                    <div ref={searchRef} style={styles.searchWrapper}>
                        <input
                            value={address}
                            onChange={(e) => handleSearch(e.target.value)}
                            onKeyDown={(e) => {
                                if (e.key === "Enter") {
                                    e.preventDefault();
                                    searchManualAddress();
                                }
                            }}
                            placeholder="Search location..."
                            style={styles.input}
                        />

                        {suggestions.length > 0 && (
                            <div style={styles.dropdown}>
                                {suggestions.map((item) => (
                                    <div
                                        key={item.place_id}
                                        style={styles.dropdownItem}
                                        onClick={() => selectPlace(item)}
                                    >
                                        {item.description}
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* INFO */}
                    <div style={styles.infoBox}>
                        <div>Total Blocks: {totalStacks}</div>
                        <div>Capacity (bags): {capacityBags}</div>
                        <div>Capacity (MT): {capacityMT.toFixed(2)}</div>
                        <div>City: {location.city || "-"}</div>
                        <div>District: {location.district || "-"}</div>
                        <div>State: {location.state || "-"}</div>
                        <div>Lat: {location.latitude}</div>
                        <div>Lng: {location.longitude}</div>
                    </div>

                    {/* BUTTONS */}
                    <div style={styles.buttonRow}>
                        <button style={styles.secondaryBtn} onClick={getCoordinates}>
                            📍 Get Location Details
                        </button>

                        <button
                            disabled={!isValid || loading}
                            onClick={isValid && !loading ? handleSave : null}
                            style={{
                                ...styles.primaryBtn,
                                opacity: !isValid || loading ? 0.5 : 1,
                                cursor: !isValid || loading ? "not-allowed" : "pointer",
                                boxShadow: isValid && !loading ? "0 0 12px red" : "none",
                            }}
                        >
                            {loading ? "Saving..." : "💾 Save Depot"}
                        </button>
                    </div>

                </div>

                {/* RIGHT SIDE (MAP) */}
                <div style={styles.rightSection}>
                    {!mapReady && (
                        <div style={styles.mapOverlay}>Loading Map...</div>
                    )}
                    <div id="map" style={styles.mapFull}></div>
                </div>

            </div>
        </div>
    );
}

export default DepotEntry;

const styles = {
    page: { padding: "20px", background: "#fff" },
    heading: { color: "#e53935" },

    mainContainer: {
        display: "flex",
        gap: "20px",
    },

    leftSection: {
        width: "40%",
        display: "flex",
        flexDirection: "column",
        gap: "10px",
        background: "#fff",
        padding: "20px",
        borderRadius: "10px",
    },

    rightSection: {
        width: "60%",
        height: "700px",
        position: "relative",
    },

    mapFull: {
        width: "100%",
        height: "100%",
        borderRadius: "10px",
    },

    sectionTitle: { marginTop: "15px", color: "#e53935" },

    grid2: {
        display: "grid",
        gridTemplateColumns: "1fr 1fr",
        gap: "10px",
        width: "100%",
    },

    input: {
        width: "100%",
        padding: "10px",
        border: "2px solid #ccc",
        borderRadius: "6px",
    },

    inputFull: {
        width: "100%",
        padding: "10px",
        border: "2px solid #ccc",
        borderRadius: "6px",
    },

    searchWrapper: {
        position: "relative",
        width: "100%",
    },

    

    dropdown: {
        position: "absolute",
        top: "100%",
        left: 0,
        width: "100%",
        background: "#fff",
        border: "1px solid #ccc",
        zIndex: 9999,
        maxHeight: "150px",
        overflowY: "auto",
    },

    dropdownItem: {
        padding: "10px",
        cursor: "pointer",
        borderBottom: "1px solid #eee",
    },

    infoBox: {
        marginTop: "10px",
        background: "#f1f3f6",
        padding: "12px",
        borderRadius: "8px",
        display: "grid",
        gridTemplateColumns: "1fr 1fr",
        gap: "8px",
        fontSize: "14px",
    },

    buttonRow: {
        display: "flex",
        justifyContent: "space-between",
        marginTop: "10px",
    },

    primaryBtn: {
        background: "red",
        color: "#fff",
        padding: "10px 16px",
        border: "none",
        borderRadius: "6px",
    },

    secondaryBtn: {
        background: "#1976d2",
        color: "#fff",
        padding: "10px 16px",
        border: "none",
        borderRadius: "6px",
    },
};