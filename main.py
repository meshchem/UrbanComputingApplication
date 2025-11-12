import os
from fastapi import FastAPI
from pydantic import BaseModel, Field
from typing import List, Dict
from datetime import datetime
import firebase_admin
from firebase_admin import credentials, db
from dotenv import load_dotenv

# ------------------ Load .env ------------------
load_dotenv()

cred_path = os.getenv("FIREBASE_CRED_PATH")
db_url = os.getenv("FIREBASE_DB_URL")

print("FIREBASE_CRED_PATH:", cred_path)
print("FIREBASE_DB_URL:", db_url)

# ------------------ Firebase init ------------------
try:
    cred = credentials.Certificate(cred_path)
    firebase_admin.initialize_app(cred, {"databaseURL": db_url})
    print("Firebase initialized successfully!")
except Exception as e:
    print("Firebase init failed:", e)

# Quick test write
try:
    test_ref = db.reference("/connection_test")
    test_ref.push({"status": "connected"})
    print("✅ Successfully wrote test data to Firebase!")
except Exception as e:
    print("❌ Firebase write failed:", e)


# ------------------ FastAPI setup ------------------
app = FastAPI(title="T.C.Lib API")

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
@app.post("/sensor")
def receive_sensor_data(data: SensorLoggerData):
    readings = []
    ref = db.reference("/readings")  # base Firebase path

    for p in data.payload:
        dbfs = p.values.get("dBFS")
        timestamp = datetime.fromtimestamp(p.time / 1e9).isoformat()

        reading = {
            "device_id": data.deviceId,
            "session_id": data.session_id,
            "name": p.name,
            "noise_db": dbfs,
            "timestamp": timestamp
        }

        readings.append(reading)
        ref.push(reading)  # 🔥 upload to Firebase

    print("Uploaded readings:", readings)
    return {"status": "uploaded", "count": len(readings), "readings": readings}