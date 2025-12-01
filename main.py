import os
import time
from datetime import datetime
from collections import defaultdict
from typing import List, Dict, Optional

from dotenv import load_dotenv
import firebase_admin
from firebase_admin import credentials, db
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware

from library_metadata import LIBRARIES
from noise_processor import process_payload, classify_noise_level

# ------------------ In-memory aggregation state ------------------

floor_buffers: Dict[str, list[float]] = defaultdict(list)
last_flush: Dict[str, float] = {}

FLUSH_INTERVAL = 5  # seconds


# ------------------ Helpers ------------------

def make_key(library: str, floor: Optional[str]) -> str:
    """Create stable key: 'library-floor' or 'library-none'."""
    return f"{library}-{floor or 'none'}"


def flush_if_needed(library: str, floor: Optional[str]) -> Optional[Dict]:
    """
    If ≥ 5 seconds passed, merge all device averages into one reading, push to Firebase,
    clear buffer, and return merged record.
    """
    key = make_key(library, floor)
    now = time.time()

    if key not in last_flush:
        print(f"[INIT] First time seeing '{key}'. Starting flush timer.")
        last_flush[key] = now
        return None

    elapsed = now - last_flush[key]
    if elapsed < FLUSH_INTERVAL:
        print(f"[WAIT] {key}: Only {elapsed:.2f}s elapsed (< {FLUSH_INTERVAL}s). No flush yet.")
        return None

    samples = floor_buffers.get(key, [])
    if not samples:
        print(f"[EMPTY] {key}: Flush triggered but buffer empty. Resetting timer.")
        last_flush[key] = now
        return None

    merged_avg = sum(samples) / len(samples)
    merged_record = {
        "library": library,
        "floor": floor,
        "avg_noise_db": round(merged_avg, 2),
        "noise_level": classify_noise_level(merged_avg),
        "created_at": datetime.utcnow().isoformat(),
    }

    # Firebase path
    if floor is None:
        path = f"/libraries/{library}/readings"
    else:
        path = f"/libraries/{library}/{floor}/readings"

    print(f"[FLUSH] Writing merged 5s average for '{key}': {merged_record['avg_noise_db']} dBFS")
    print(f"        Buffer samples = {samples}")
    print(f"        Firebase path  = {path}")

    ref = db.reference(path)
    ref.push(merged_record)

    # Clear buffer + reset timer
    floor_buffers[key].clear()
    last_flush[key] = now

    print(f"[RESET] Cleared buffer for '{key}'. Next flush window starts now.\n")
    return merged_record


# ------------------ Load .env ------------------
load_dotenv()

# ------------------ Firebase init ------------------
cred_path = os.getenv("FIREBASE_CRED_PATH")
db_url = os.getenv("FIREBASE_DB_URL")

cred = credentials.Certificate(cred_path)
firebase_admin.initialize_app(cred, {"databaseURL": db_url})

print("\n--- Firebase Initialised ---")
print("FIREBASE_CRED_PATH:", cred_path)
print("FIREBASE_DB_URL:", db_url)
print("------------------------------\n")

# ------------------ FastAPI setup ------------------
app = FastAPI(title="T.C.Lib API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ------------------ Library Validation ------------------
VALID_LIBRARIES = {lib: info["floors"] for lib, info in LIBRARIES.items()}

# ------------------ Models ------------------
from pydantic import BaseModel, Field


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
    print(f"\n=== Incoming payload (NO FLOOR): {library} ===")

    if library not in VALID_LIBRARIES:
        raise HTTPException(400, f"Unknown library '{library}'.")

    if VALID_LIBRARIES[library]:
        raise HTTPException(400, f"Library '{library}' requires a floor.")

    # Process per-device average
    processed = process_payload(data)
    device_avg = processed["avg_noise_db"]

    print(f"[DEVICE AVG] Library={library}, Device={data.deviceId}, Avg={device_avg}")

    processed.update({
        "library": library,
        "floor": None,
        "device_id": data.deviceId,
        "session_id": data.session_id,
        "message_id": data.messageId,
        "noise_level": classify_noise_level(device_avg)
    })

    # Add to buffer
    key = make_key(library, None)
    floor_buffers[key].append(device_avg)
    print(f"[BUFFER] {key} now has: {floor_buffers[key]}")

    # Flush if needed
    flush_if_needed(library, None)

    return processed


@app.post("/sensor/{library}/{floor}")
def library_with_floor(library: str, floor: str, data: SensorLoggerData):
    print(f"\n=== Incoming payload: {library}/{floor} ===")

    if library not in VALID_LIBRARIES:
        raise HTTPException(400, f"Unknown library '{library}'.")

    if floor not in VALID_LIBRARIES[library]:
        raise HTTPException(400, f"Unknown floor '{floor}' for '{library}'.")

    processed = process_payload(data)
    device_avg = processed["avg_noise_db"]

    print(f"[DEVICE AVG] Library={library}, Floor={floor}, Device={data.deviceId}, Avg={device_avg}")

    processed.update({
        "library": library,
        "floor": floor,
        "device_id": data.deviceId,
        "session_id": data.session_id,
        "message_id": data.messageId,
        "noise_level": classify_noise_level(device_avg)
    })

    # Add to buffer
    key = make_key(library, floor)
    floor_buffers[key].append(device_avg)
    print(f"[BUFFER] {key} now has: {floor_buffers[key]}")

    # Flush if needed
    flush_if_needed(library, floor)

    return processed
