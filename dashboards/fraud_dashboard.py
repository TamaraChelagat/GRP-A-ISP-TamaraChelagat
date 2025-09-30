import streamlit as st
import pandas as pd
import numpy as np
import matplotlib.pyplot as plt

# Title
st.title("📊 FraudDetectPro Dashboard")

# Mock metrics
fraud_cases = 492
total_txns = 284807
fraud_ratio = fraud_cases / total_txns * 100

st.metric("Total Transactions", f"{total_txns:,}")
st.metric("Fraud Cases", f"{fraud_cases:,}")
st.metric("Fraud Ratio", f"{fraud_ratio:.3f}%")

# Class distribution chart
labels = ["Legit", "Fraud"]
sizes = [total_txns - fraud_cases, fraud_cases]

fig, ax = plt.subplots()
ax.pie(sizes, labels=labels, autopct='%1.2f%%', startangle=90, colors=["#4CAF50", "#FF4C4C"])
ax.axis("equal")
st.pyplot(fig)

# Transactions table (mock)
data = {
    "TransactionID": np.arange(1, 6),
    "Amount": [50, 120, 2500, 13, 780],
    "Flagged": ["No", "No", "Yes", "No", "Yes"]
}
df = pd.DataFrame(data)
st.write("### Recent Transactions")
st.dataframe(df)
