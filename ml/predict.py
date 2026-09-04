import sys
import pandas as pd
import joblib


# ==========================================
# LOAD TRAINED ML MODEL
# ==========================================

model = joblib.load("traffic_delay_model.pkl")


# ==========================================
# GET INPUT FROM NODE.JS
# ==========================================

vehicle_count = float(sys.argv[1])
average_speed = float(sys.argv[2])
distance_km = float(sys.argv[3])
time_of_day = float(sys.argv[4])


# ==========================================
# CREATE INPUT DATA
# ==========================================

traffic_data = pd.DataFrame([
    {
        "vehicle_count": vehicle_count,
        "average_speed": average_speed,
        "distance_km": distance_km,
        "time_of_day": time_of_day
    }
])


# ==========================================
# MAKE PREDICTION
# ==========================================

predicted_delay = model.predict(
    traffic_data
)[0]


# ==========================================
# SEND RESULT TO NODE.JS
# ==========================================

print(
    '{"predicted_delay": %.2f}' % predicted_delay
)