from fastapi import FastAPI, Request
from pydantic import BaseModel
from typing import List, Dict, Any
from datetime import datetime


app = FastAPI(title="T.C.Lib API")

class SensorData(BaseModel):
    name: str
    time: int
    values: Dict[str, float]

@app.get("/")
def root():
    return {"message": "FastAPI is working"}

@app.post("/sensor")
async def receive_sensor_data(data: SensorData):
    # data = await request.json()
    print("Incoming data:", data.dict)
    return {"status": "received", "data": data}
