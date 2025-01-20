import IP2Location
# Create an IP2Location object
db = IP2Location.IP2Location()

# Open the BIN database
db.open("IP2LOCATION-LITE-DB5.IPV6.BIN")


def IpToGeographicalData(ip):
    try:
        rec = db.get_all(ip)
        return {
            'city': rec.city,
            'latitude': rec.latitude,
            'longitude': rec.longitude,
            'ip' : ip
        }
    except Exception as e:
        print(f"Error: {e}")
        return "Unknown"


