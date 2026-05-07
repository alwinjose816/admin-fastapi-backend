import React, { useState } from "react";
import "./Monitor.css";

function CCTVTab() {

    const [cameraUrl, setCameraUrl] = useState("");

    return (

        <div className="cctv-wrapper">

            <h2 className="cctv-title">
                🎥 CCTV Monitoring
            </h2>

            <label className="cctv-label">
                Camera URL
            </label>

            <input
                type="text"
                className="cctv-input"
                placeholder="Paste CCTV stream URL..."
                value={cameraUrl}
                onChange={(e) =>
                    setCameraUrl(e.target.value)
                }
            />

            <div className="camera-grid">

                <div className="camera-card">

                    <div className="camera-header">

                        <h3>📹 Main Gate Camera</h3>

                        <span className="camera-live">
                            ● LIVE
                        </span>

                    </div>

                    {cameraUrl ? (

                        <iframe
                            src={cameraUrl}
                            title="CCTV"
                            className="camera-frame"
                            allowFullScreen
                        />

                    ) : (

                        <div className="camera-placeholder">

                            <div className="camera-icon">
                                🎥
                            </div>

                            <p>
                                No camera stream connected
                            </p>

                        </div>

                    )}

                </div>

            </div>

        </div>

    );
}

export default CCTVTab;