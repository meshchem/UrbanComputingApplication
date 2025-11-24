# library_metadata.py

LIBRARIES = {
    "ussher": {
        "name": "Ussher Library",
        "floors": {
            "1": {
                "name": "Floor 1",
                "resources": {
                    "computers": 20,
                    "printer": 1
                }
            },
            "2": {
                "name": "Floor 2",
                "resources": {
                    "printer": 1
                }
            },
            "3": {
                "name": "Floor 3",
                "resources": {
                    "printer": 1
                }
            },
            "4": {
                "name": "Floor 4",
                "resources": {}  # no extra specified yet
            },
            "5": {
                "name": "Floor 5",
                "resources": {}  # no extra specified yet
            },
        },
        "opening_hours": {
            "Mon-Fri": "09:00-22:00",      # based on general opening hours page :contentReference[oaicite:2]{index=2}
            "Sat": "09:30-17:00",
            "Sun": "11:00-17:00"
        }
    },
    "lecky": {
        "name": "Lecky Library",
        "floors": {
            "upper": {
                "name": "Upper Lecky",
                "resources": {}
            },
            "lower": {
                "name": "Lower Lecky",
                "resources": {}
            }
        },
        "opening_hours": {
            "Mon-Fri": "09:00-22:00",
            "Sat": "09:00-16:30",
            "Sun": "Closed"
        }
    },
    "postgraduate": {
        "name": "1937 Postgraduate Reading Room",
        "floors": {},
        "opening_hours": {
            "Mon-Sun": "24 hours"
        }
    }
}
