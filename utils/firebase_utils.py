import firebase_admin
from firebase_admin import credentials, db

cred = credentials.Certificate("firebase_config.json")
firebase_admin.initialize_app(cred, {
    'databaseURL': 'https://t-c-lib-default-rtdb.europe-west1.firebasedatabase.app'
})

def upload_to_firebase(library: str, processed_data: dict):
    """
    Upload processed noise data to Firebase under the corresponding library node.
    Example path: /libraries/upper_lecky/
    """
    ref = db.reference(f"/libraries/{library}")
    ref.push(processed_data)