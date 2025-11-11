from fastapi import FastAPI
from pydantic import BaseModel, Field
from typing import List, Dict
from datetime import datetime

app = FastAPI()

# 🧩 Define a model for each payload item
class PayloadItem(BaseModel):
    name: str
    time: int
    values: Dict[str, float]

# 🧩 Define the structure of the incoming SensorLogger data
class SensorLoggerData(BaseModel):
    deviceId: str
    messageId: int
    session_id: str = Field(alias="sessionId")  # 👈 map "sessionId" → Python attribute session_id
    payload: List[PayloadItem]


@app.post("/sensor")
def receive_sensor_data(data: SensorLoggerData):
    readings = []
    for p in data.payload:
        dbfs = p.values.get("dBFS")
        timestamp = datetime.fromtimestamp(p.time / 1e9).isoformat()
        readings.append({
            "device_id": data.deviceId,
            "session_id": data.session_id,
            "name": p.name,
            "noise_db": dbfs,
            "timestamp": timestamp
        })

    print("Processed readings:", readings)
    return {"status": "received", "count": len(readings), "readings": readings}
