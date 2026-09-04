import pandas as pd
import joblib

from sklearn.model_selection import train_test_split
from sklearn.ensemble import RandomForestRegressor
from sklearn.metrics import mean_absolute_error


# ==========================================
# 1. LOAD TRAFFIC DATASET
# ==========================================

data = pd.read_csv("traffic_data.csv")

print("Dataset loaded successfully!")
print("Number of rows:", len(data))


# ==========================================
# 2. SELECT INPUT FEATURES
# ==========================================

X = data[
    [
        "vehicle_count",
        "average_speed",
        "distance_km",
        "time_of_day"
    ]
]


# ==========================================
# 3. SELECT TARGET
# ==========================================

y = data["delay_minutes"]


# ==========================================
# 4. SPLIT DATA
# ==========================================

X_train, X_test, y_train, y_test = train_test_split(
    X,
    y,
    test_size=0.2,
    random_state=42
)


# ==========================================
# 5. CREATE ML MODEL
# ==========================================

model = RandomForestRegressor(
    n_estimators=100,
    random_state=42
)


# ==========================================
# 6. TRAIN MODEL
# ==========================================

model.fit(X_train, y_train)

print("ML model trained successfully!")


# ==========================================
# 7. TEST MODEL
# ==========================================

predictions = model.predict(X_test)

error = mean_absolute_error(
    y_test,
    predictions
)

print(
    "Mean Absolute Error:",
    round(error, 2),
    "minutes"
)


# ==========================================
# 8. SAVE TRAINED MODEL
# ==========================================

joblib.dump(model, "traffic_delay_model.pkl")

print("ML model saved successfully!")
print("File created: traffic_delay_model.pkl")


# ==========================================
# 9. TEST WITH NEW TRAFFIC DATA
# ==========================================

new_traffic = pd.DataFrame(
    [
        {
            "vehicle_count": 100,
            "average_speed": 20,
            "distance_km": 5,
            "time_of_day": 16
        }
    ]
)


predicted_delay = model.predict(
    new_traffic
)[0]


# ==========================================
# 10. DISPLAY PREDICTION
# ==========================================

print("\n================================")
print("🚨 EMERGENCY TRAFFIC PREDICTION")
print("================================")

print("Vehicle Count:", 100)
print("Average Speed:", 20, "km/h")
print("Distance:", 5, "km")
print("Time:", "4 PM")

print(
    "🤖 Predicted Traffic Delay:",
    round(predicted_delay, 2),
    "minutes"
)