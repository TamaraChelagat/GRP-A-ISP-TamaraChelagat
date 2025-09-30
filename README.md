# FraudDetectPro – Explainable Machine Learning for Transactional Anomaly Detection  

FraudDetectPro is a hybrid machine learning system for **real-time credit card fraud detection**, developed as part of a final year Informatics and Computer Science project at Strathmore University. The system integrates **ensemble learning**, **anomaly detection**, and **explainable AI (XAI)** to enhance accuracy, transparency, and trust in fraud detection.  

---

## 🚀 Project Overview
Traditional fraud detection systems struggle with:
- **Extreme class imbalance** (fraud <0.5% of transactions).
- **High false positives**, leading to poor customer experience.
- **Black-box ML models**, which lack interpretability for analysts and regulators.

FraudDetectPro addresses these challenges by combining:
- **Supervised ensemble models** (Logistic Regression, Random Forest, XGBoost, Neural Networks).  
- **Unsupervised anomaly detection** (Isolation Forest, Autoencoders).  
- **Explainability modules** using **SHAP** and **LIME** for model transparency.  

The result is a **robust, scalable, and explainable fraud detection framework** for financial institutions.  

---

## 🧩 System Architecture
1. **Data Source Layer** – Kaggle Credit Card Fraud dataset & simulated real-time streams.  
2. **Data Processing Layer** – Cleaning, normalization, SMOTE/ADASYN balancing, and feature engineering (temporal + behavioral).  
3. **Machine Learning Layer** – Ensemble classifiers + anomaly detectors.  
4. **Explainability Layer** – SHAP and LIME provide feature-level reasoning.  
5. **Application Layer (API)** – REST API for predictions and retraining.  
6. **User Interface Layer** – Web dashboard for fraud analysts and system admins.  
7. **Feedback Loop** – Analyst feedback informs model retraining.  

---

## 📊 CRISP-DM Methodology
FraudDetectPro development follows the **CRISP-DM** process:
- **Business Understanding** – Improve fraud detection accuracy and interpretability.  
- **Data Preparation** – Preprocessing, feature selection, balancing.  
- **Modeling** – Ensemble + hybrid ML models.  
- **Evaluation** – Precision, recall, F1-score, AUC-ROC.  
- **Deployment** – Interactive dashboard with explainability tools.  

---

## 🔧 Tools & Technologies
- **Programming:** Python  
- **Libraries:** Scikit-learn, Pandas, NumPy, imbalanced-learn  
- **Explainability:** SHAP, LIME  
- **Development:** Jupyter Notebooks, Google Colab  
- **Version Control:** Git, GitHub  
- **Visualization & Dashboard:** Plotly, Dash/Streamlit (planned)  

---

## 📂 Repository Structure
```bash
FraudDetectPro/
│── data/                # Raw & processed datasets
│── notebooks/           # Jupyter notebooks for EDA, modeling, evaluation
│── models/              # Saved trained models
│── src/                 # Source code (data pipeline, training, API)
│── dashboard/           # Web interface code (Streamlit/Dash)
│── reports/             # Performance evaluation reports
│── docs/                # Proposal, diagrams, documentation
│── README.md            # Project overview

[![Review Assignment Due Date](https://classroom.github.com/assets/deadline-readme-button-22041afd0340ce965d47ae6ef1cefeee28c7c493a6346c4f15d667ab976d596c.svg)](https://classroom.github.com/a/F63P1L7A)
[![Open in Visual Studio Code](https://classroom.github.com/assets/open-in-vscode-2e0aaae1b6195c2367325f4f02e2d04e9abb55f0b24a779b69b11b9e10269abc.svg)](https://classroom.github.com/online_ide?assignment_repo_id=20100696&assignment_repo_type=AssignmentRepo)

[Git version control cheat code](https://philomatics.com/git-cheatsheet-release)
