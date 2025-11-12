import os
from fastapi import FastAPI
from pydantic import BaseModel, Field
from typing import List, Dict
from datetime import datetime
import firebase_admin
from firebase_admin import credentials, db
from dotenv import load_dotenv
from noise_processor import process_payload, classify_noise_level


# ------------------ Load .env ------------------
load_dotenv()

# ------------------ Firebase init ------------------

cred_path = os.getenv("FIREBASE_CRED_PATH")
db_url = os.getenv("FIREBASE_DB_URL")
cred = credentials.Certificate(cred_path)
firebase_admin.initialize_app(cred, {"databaseURL": db_url})

print("FIREBASE_CRED_PATH:", cred_path)
print("FIREBASE_DB_URL:", db_url)

# ------------------ FastAPI setup ------------------
app = FastAPI(title="T.C.Lib API")

# ----------------- Library Validation -----------------
VALID_LIBRARIES = {
    "upper_lecky", "lower_lecky",
    "ussher_1", "ussher_2",
    "hamilton_1", "hamilton_2",
    "boland_1", "boland_2",
    "postgrad_reading_room"
}

# ------------------ Models ------------------
class PayloadItem(BaseModel):
    name: str
    time: int
    values: Dict[str, float]

class SensorLoggerData(BaseModel):
    deviceId: str
    messageId: int
    session_id: str = Field(alias="sessionId")
    payload: List[PayloadItem]

# ------------------ Routes ------------------
@app.post("/sensor/{library}")
def sensor_with_path(library: str, data: SensorLoggerData):
    # Validate library name
    if library not in VALID_LIBRARIES:
        raise HTTPException(status_code=400, detail=f"Unknown library '{library}'. Must be one of {sorted(VALID_LIBRARIES)}")

    # Process noise payload
    processed = process_payload(data)
    noise_label = classify_noise_level(processed["avg_noise_db"])

    # Add metadata
    processed.update({
        "library": library,
        "device_id": data.deviceId,
        "session_id": data.session_id,
        "message_id": data.messageId,
        "noise_level": noise_label
    })

    # Upload to Firebase
    ref = db.reference(f"/libraries/{library}/readings")
    ref.push(processed)

    print(f"✅ {library}: {processed['avg_noise_db']} dBFS ({noise_label})")

    return {
        "status": "uploaded",
        "library": library,
        "avg_noise_db": processed["avg_noise_db"],
        "noise_level": noise_label
    }