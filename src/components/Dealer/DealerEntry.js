import React, { useState, useEffect, useRef } from "react";
import { supabase } from "../../supabaseClient";

function DealerEntry() {
    const [dealerId, setDealerId] = useState("");
    const [dealerName, setDealerName] = useState("");
    const [contactPerson, setContactPerson] = useState("");
    const [mobile, setMobile] = useState("");
    const [email, setEmail] = useState("");
    const [address, setAddress] = useState("");

    const [suggestions, setSuggestions] = useState([]);
    const [location, setLocation] = useState({});
    const [mapReady, setMapReady] = useState(false);

    const mapRef = useRef(null);
    const markerRef = useRef(null);
    const searchRef = useRef(null);
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (searchRef.current && !searchRef.current.contains(event.target)) {
                setSuggestions([]);   // 🔥 CLOSE DROPDOWN
            }
        };

        document.addEventListener("mousedown", handleClickOutside);

        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, []);

    // 🔥 LOAD MAP
    useEffect(() => {
        const loadMap = () => {
            if (!window.google) {
                setTimeout(loadMap, 500);
                return;
            }

            mapRef.current = new window.google.maps.Map(
                document.getElementById("dealer-map"),
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

    // 🔥 AUTOCOMPLETE
    const handleSearch = (value) => {
        setAddress(value);

        if (!value) {
            setSuggestions([]);   // 🔥 CLOSE if empty
            return;
        }

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
            `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(place.description)}&key=AIzaSyD6kKoeqpSS76MSIg9kREgPsw2j_v1LmDo`
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

            setLocation({
                latitude: loc.lat,
                longitude: loc.lng,
            });
        }
    };
    const searchManualAddress = async () => {
        if (!address) {
            alert("Enter address");
            return;
        }

        if (!mapRef.current) {
            alert("Map not ready");
            return;
        }

        const res = await fetch(
            `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(address)}&key=AIzaSyD6kKoeqpSS76MSIg9kREgPsw2j_v1LmDo`
        );

        const data = await res.json();

        if (data.status === "OK") {
            const loc = data.results[0].geometry.location;

            mapRef.current.setCenter(loc);
            mapRef.current.setZoom(17);

            if (!markerRef.current) {
                markerRef.current = new window.google.maps.Marker({
                    map: mapRef.current,
                });
            }

            markerRef.current.setPosition(loc);

            setLocation((prev) => ({
                ...prev,
                latitude: loc.lat,
                longitude: loc.lng,
            }));
        } else {
            alert("Address not found ❌");
        }
    };

    // 🔥 FETCH CITY/DISTRICT
    const getLocationDetails = async () => {
        if (!location.latitude) {
            alert("Select location first");
            return;
        }

        const res = await fetch(
            `https://maps.googleapis.com/maps/api/geocode/json?latlng=${location.latitude},${location.longitude}&key=AIzaSyD6kKoeqpSS76MSIg9kREgPsw2j_v1LmDo`
        );

        const data = await res.json();

        if (data.status === "OK") {
            let result = data.results[0];

            let temp = { ...location };

            result.address_components.forEach((comp) => {
                if (comp.types.includes("locality")) temp.city = comp.long_name;
                if (comp.types.includes("administrative_area_level_2"))
                    temp.district = comp.long_name;
                if (comp.types.includes("administrative_area_level_1"))
                    temp.state = comp.long_name;
                if (comp.types.includes("postal_code"))
                    temp.pincode = comp.long_name;
            });

            setLocation(temp);
        }
    };

    // 🔥 SAVE
    const saveDealer = async () => {
        if (!dealerId || !dealerName || !address) {
            alert("Fill required fields");
            return;
        }

        try {
            // 🔍 STEP 1: CHECK DUPLICATE
            const { data: existing, error: checkError } = await supabase
                .from("dealer_master")
                .select("dealer_id")
                .eq("dealer_id", dealerId);

            if (checkError) {
                console.error(checkError);
                alert("Error checking dealer ❌");
                return;
            }

            if (existing.length > 0) {
                alert("Dealer already exists ❌");   // 🔥 YOUR REQUIRED MESSAGE
                return;
            }

            // 💾 STEP 2: INSERT
            const { error } = await supabase.from("dealer_master").insert([
                {
                    dealer_id: dealerId,
                    dealer_name: dealerName,
                    contact_person: contactPerson,
                    mobile,
                    email,
                    address,
                    city: location.city,
                    district: location.district,
                    state: location.state,
                    pincode: location.pincode,
                    latitude: location.latitude,
                    longitude: location.longitude,
                },
            ]);

            if (error) {
                console.error(error);
                alert(error.message);
            } else {
                alert("Dealer saved successfully ✅");

                // 🔥 RESET FORM
                setDealerId("");
                setDealerName("");
                setContactPerson("");
                setMobile("");
                setEmail("");
                setAddress("");

                // 🔥 RESET LOCATION
                setLocation({});

                // 🔥 CLEAR DROPDOWN
                setSuggestions([]);

                // 🔥 REMOVE MARKER
                if (markerRef.current) {
                    markerRef.current.setMap(null);
                    markerRef.current = null;
                }

                // 🔥 RESET MAP CENTER (optional)
                if (mapRef.current) {
                    mapRef.current.setCenter({ lat: 13.0827, lng: 80.2707 }); // Chennai default
                    mapRef.current.setZoom(12);
                }
            }

        } catch (err) {
            console.error(err);
            alert("Unexpected error ❌");
        }
    };
    const isValid =
        dealerId &&
        dealerName &&
        contactPerson &&
        mobile &&
        email &&
        address &&
        location.latitude &&
        location.longitude &&
        location.city &&
        location.state &&
        location.pincode;
    return (
        <div style={styles.page}>
            <h1 style={styles.heading}>🏢 Dealer Entry</h1>

            <div style={styles.mainContainer}>

                {/* LEFT */}
                <div style={styles.leftSection}>

                    <h3 style={styles.section}>Basic Details</h3>

                    <input
                        value={dealerId}
                        onChange={(e) => setDealerId(e.target.value)}
                        placeholder="Dealer ID"
                        style={styles.input}
                    />

                    <input
                        value={dealerName}
                        onChange={(e) => setDealerName(e.target.value)}
                        placeholder="Dealer Name"
                        style={styles.input}
                    />

                    <h3 style={styles.section}>Contact</h3>

                    <input
                        value={contactPerson}
                        onChange={(e) => setContactPerson(e.target.value)}
                        placeholder="Contact Person"
                        style={styles.input}
                    />

                    <input
                        value={mobile}
                        onChange={(e) => setMobile(e.target.value)}
                        placeholder="Mobile"
                        style={styles.input}
                    />

                    <input
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="Email"
                        style={styles.input}
                    />

                    <h3 style={styles.section}>Location</h3>

                    <div ref={searchRef} style={{ position: "relative" }}>

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

                    {/* INFO BOX */}
                    <div style={styles.infoBox}>
                        <div>City: {location.city || "-"}</div>
                        <div>District: {location.district || "-"}</div>
                        <div>State: {location.state || "-"}</div>
                        <div>Lat: {location.latitude || "-"}</div>
                        <div>Lng: {location.longitude || "-"}</div>
                    </div>

                    {/* BUTTONS */}
                    <div style={styles.buttonRow}>

                        <button style={styles.secondaryBtn} onClick={getLocationDetails}>
                            📍 Get Location
                        </button>

                        <button
                            disabled={!isValid}
                            onClick={isValid ? saveDealer : null}
                            style={{
                                ...styles.primaryBtn,
                                opacity: isValid ? 1 : 0.5,
                                cursor: isValid ? "pointer" : "not-allowed",
                                boxShadow: isValid ? "0 0 10px red" : "none",
                            }}
                        >
                            💾 Save Dealer
                        </button>

                    </div>
                </div>

                {/* RIGHT MAP */}
                <div style={styles.rightSection}>
                    {!mapReady && <div>Loading Map...</div>}
                    <div id="dealer-map" style={styles.map}></div>
                </div>

            </div>
        </div>
    );
}

export default DealerEntry;
const styles = {
    page: { padding: "20px" },
    heading: { color: "#e53935" },

    mainContainer: { display: "flex", gap: "20px" },

    leftSection: { width: "40%", display: "flex", flexDirection: "column", gap: "10px" },
    rightSection: { width: "60%", height: "700px" },

    map: { width: "100%", height: "100%" },

    section: { color: "#e53935" },

    input: { padding: "10px", border: "1px solid #ccc", borderRadius: "6px" },

    dropdown: {
        position: "absolute",
        width: "100%",
        background: "#fff",
        border: "1px solid #ccc",
        zIndex: 1000,
    },

    dropdownItem: {
        padding: "10px",
        cursor: "pointer",
    },

    infoBox: {
        background: "#f1f3f6",
        padding: "10px",
        borderRadius: "6px",
    },

    buttonRow: {
        display: "flex",
        justifyContent: "space-between",
    },

    primaryBtn: {
        background: "red",
        color: "#fff",
        padding: "10px",
        border: "none",
        borderRadius: "6px",
    },

    secondaryBtn: {
        background: "#1976d2",
        color: "#fff",
        padding: "10px",
        border: "none",
        borderRadius: "6px",
    },
};