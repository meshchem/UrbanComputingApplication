# library_metadata.py

LIBRARIES = {
    "ussher": {
        "name": "Ussher Library",
        "coords": {
            "lat": 53.34297764349861,
            "lng": -6.256005764007568
        },
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
                "resources": {}
            },
            "5": {
                "name": "Floor 5",
                "resources": {}
            },
        },
        "opening_hours": {
            "Mon-Fri": "09:00-22:00",
            "Sat": "09:30-17:00",
            "Sun": "11:00-17:00"
        }
    },

    "lecky": {
        "name": "Lecky Library",
        "coords": {
            "lat": 53.343320329307545,
            "lng": -6.25670313835144
        },
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
        "coords": {
            "lat": 53.34379432009283,
            "lng": -6.257668733596803
        },
        "floors": {},
        "resources": {
            "printer": 1,
            "computers": 2
        },
        "opening_hours": {
            "Mon-Sun": "24 hours"
        }
    }
}
