import pandas as pd

# Read the original CSV
df = pd.read_csv("Welcome to UGC, New Delhi, India.csv")  # replace with your actual file name

# Select only required columns
result = df[["Name of the college", "District", "State"]]

# Write to new CSV
result.to_csv("colleges.csv", index=False)
