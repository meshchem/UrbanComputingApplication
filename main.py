import os
from fastapi import FastAPI
from pydantic import BaseModel, Field
from typing import List, Dict
from library_metadata import LIBRARIES
import firebase_admin
from firebase_admin import credentials, db
from dotenv import load_dotenv
from noise_processor import process_payload, classify_noise_level
from fastapi.middleware.cors import CORSMiddleware

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
@app.get("/libraries")
def get_libraries():
    return LIBRARIES

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # or ["http://localhost:3000"] for stricter
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ----------------- Library Validation -----------------
VALID_LIBRARIES = {lib: info["floors"] for lib, info in LIBRARIES.items()}

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

@app.get("/libraries")
def get_libraries():
    return LIBRARIES

@app.post("/sensor/{library}")
def library_no_floor(library: str, data: SensorLoggerData):

    if library not in VALID_LIBRARIES:
        raise HTTPException(400, f"Unknown library '{library}'.")

    # This library must NOT have floors
    if VALID_LIBRARIES[library]:
        raise HTTPException(400, f"Library '{library}' requires a floor.")

    processed = process_payload(data)
    noise_label = classify_noise_level(processed["avg_noise_db"])

    processed.update({
        "library": library,
        "floor": None,
        "device_id": data.deviceId,
        "session_id": data.session_id,
        "message_id": data.messageId,
        "noise_level": noise_label
    })

    ref = db.reference(f"/libraries/{library}/readings")
    ref.push(processed)

    return processed

@app.post("/sensor/{library}/{floor}")
def library_with_floor(library: str, floor: str, data: SensorLoggerData):

    if library not in VALID_LIBRARIES:
        raise HTTPException(400, f"Unknown library '{library}'.")

    # Check floor exists
    if floor not in VALID_LIBRARIES[library]:
        raise HTTPException(400, f"Unknown floor '{floor}' for library '{library}'.")

    processed = process_payload(data)
    noise_label = classify_noise_level(processed["avg_noise_db"])

    processed.update({
        "library": library,
        "floor": floor,
        "device_id": data.deviceId,
        "session_id": data.session_id,
        "message_id": data.messageId,
        "noise_level": noise_label
    })

    ref = db.reference(f"/libraries/{library}/{floor}/readings")
    ref.push(processed)

    return processed
