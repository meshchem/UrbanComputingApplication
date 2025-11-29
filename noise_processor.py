# noise_processor.py
from datetime import datetime
import statistics
from typing import Dict
from fastapi import HTTPException

def process_payload(data) -> Dict:
    """
    Takes a SensorLoggerData object and returns processed results:
    - Average dBFS
    - Raw values
    - Human-readable timestamps
    """
    dbfs_values = [p.values.get("dBFS") for p in data.payload if "dBFS" in p.values]
    if not dbfs_values:
        raise HTTPException(status_code=400, detail="No dBFS values found in payload")

    avg_dbfs = round(statistics.mean(dbfs_values), 2)
    timestamps = [
        datetime.fromtimestamp(p.time / 1e9).strftime("%Y-%m-%d %H:%M:%S")
        for p in data.payload
    ]

    return {
        "avg_noise_db": avg_dbfs,
        "samples": len(dbfs_values),
        "raw_values": dbfs_values,
        "timestamps": timestamps,
        "created_at": datetime.utcnow().isoformat()
    }


def classify_noise_level(avg_dbfs: float) -> str:
    """
    Converts an average dBFS reading to a fun descriptive label.
    (Remember: closer to 0 = louder)
    """
    if avg_dbfs < -40:
        return "Quiet"
    elif avg_dbfs < -30:
        return "Medium"
    elif avg_dbfs < -20:
        return "Loud"
    else:
        return "Very Loud"
