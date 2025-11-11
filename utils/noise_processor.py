def classify_noise_level(db_value: float) -> str:
    """Convert raw dB value into a readable noise category."""
    if db_value < 40:
        return "Quiet"
    elif db_value < 60:
        return "Moderate Noise"
    elif db_value < 75:
        return "Busy Buzz"
    else:
        return "Loud"


def process_sensor_data(data: dict) -> dict:
    """Preprocess incoming data (add category, ensure correct types)."""
    db_value = float(data.get("noise_db", 0))
    library = data.get("library", "unknown")
    noise_category = classify_noise_level(db_value)

    processed = {
        "library": library,
        "noise_db": db_value,
        "noise_category": noise_category,
        "timestamp": data.get("timestamp")
    }
    return processed
