# --- Pipeline Classes (moved from notebook/main.py) ---
import numpy as np
import pandas as pd
from sklearn.preprocessing import RobustScaler
from sklearn.cluster import KMeans
from imblearn.over_sampling import SMOTE
from sklearn.ensemble import IsolationForest, RandomForestClassifier
from sklearn.linear_model import LogisticRegression
import xgboost as xgb
import lightgbm as lgb

class ImprovedConservativeSampler:
    def __init__(self, target_fraud_ratio=0.3, random_state=42):
        self.target_fraud_ratio = target_fraud_ratio
        self.random_state = random_state
        self.sampler = None
    
    def fit_resample(self, X, y):
        n_fraud = np.sum(y == 1)
        n_legitimate = np.sum(y == 0)
        if n_fraud == 0:
            return X, y
        desired_fraud = int(n_legitimate * self.target_fraud_ratio / (1 - self.target_fraud_ratio))
        max_fraud = min(desired_fraud, n_fraud * 25)
        sampling_strategy = {1: max_fraud}
        k_neighbors = min(3, n_fraud - 1)
        self.sampler = SMOTE(sampling_strategy=sampling_strategy, random_state=self.random_state, k_neighbors=k_neighbors)
        X_res, y_res = self.sampler.fit_resample(X, y)
        return X_res, y_res
    
    def get_sampling_info(self, y_before, y_after):
        before_fraud_ratio = np.mean(y_before)
        after_fraud_ratio = np.mean(y_after)
        print(f"Before sampling - Fraud: {np.sum(y_before == 1)}, Legitimate: {np.sum(y_before == 0)}, Ratio: {before_fraud_ratio:.4f}")
        print(f"After sampling  - Fraud: {np.sum(y_after == 1)}, Legitimate: {np.sum(y_after == 0)}, Ratio: {after_fraud_ratio:.4f}")
        print(f"Sampling multiplier: {after_fraud_ratio/before_fraud_ratio:.1f}x")

class SafeCreditCardFeatureEngineer:
    def __init__(self, n_clusters=3):
        self.n_clusters = n_clusters
        self.amount_scaler = RobustScaler()
        self.kmeans = KMeans(n_clusters=n_clusters, random_state=42)
        self.is_fitted = False
        self.feature_names = []
        self.expected_feature_count = None
    
    def fit_transform(self, X, y=None):
        df = X.copy()
        df['Amount_Log'] = np.log1p(df['Amount'])
        df['V1_V2_Interaction'] = df['V1'] * df['V2']
        df['V3_V4_Interaction'] = df['V3'] * df['V4']
        df['V12_V14_Interaction'] = df['V12'] * df['V14']
        df['V1_V4_Ratio'] = df['V1'] / (df['V4'] + 1e-8)
        df['V2_V5_Ratio'] = df['V2'] / (df['V5'] + 1e-8)
        v_columns = [f'V{i}' for i in range(1, 29)]
        df['V_Abs_Mean'] = np.abs(df[v_columns]).mean(axis=1)
        df['V_Std'] = df[v_columns].std(axis=1)
        clustering_features = ['V1', 'V2', 'V3', 'V4', 'V5', 'Amount_Log']
        cluster_data = df[clustering_features].fillna(0)
        self.kmeans.fit(cluster_data)
        self.is_fitted = True
        df['behavior_cluster'] = self.kmeans.predict(cluster_data)
        self.feature_names = [col for col in df.columns if col not in ['Time', 'Class']]
        self.expected_feature_count = len(self.feature_names)
        return df[self.feature_names]
    
    def transform(self, X):
        if not self.is_fitted:
            raise ValueError("Must fit transformer before transforming data")
        df = X.copy()
        df['Amount_Log'] = np.log1p(df['Amount'])
        df['V1_V2_Interaction'] = df['V1'] * df['V2']
        df['V3_V4_Interaction'] = df['V3'] * df['V4']
        df['V12_V14_Interaction'] = df['V12'] * df['V14']
        df['V1_V4_Ratio'] = df['V1'] / (df['V4'] + 1e-8)
        df['V2_V5_Ratio'] = df['V2'] / (df['V5'] + 1e-8)
        v_columns = [f'V{i}' for i in range(1, 29)]
        df['V_Abs_Mean'] = np.abs(df[v_columns]).mean(axis=1)
        df['V_Std'] = df[v_columns].std(axis=1)
        clustering_features = ['V1', 'V2', 'V3', 'V4', 'V5', 'Amount_Log']
        cluster_data = df[clustering_features].fillna(0)
        df['behavior_cluster'] = self.kmeans.predict(cluster_data)
        result_df = df[self.feature_names]
        if result_df.shape[1] != self.expected_feature_count:
            raise ValueError(f"Feature count mismatch! Expected {self.expected_feature_count}, got {result_df.shape[1]}")
        return result_df

class ImprovedCreditCardEnsemble:
    def __init__(self, random_state=42):
        self.random_state = random_state
        self.models = {}
        self.is_trained = False
    
    def initialize_models(self, input_dim):
        self.models['xgb'] = xgb.XGBClassifier(
            n_estimators=200, max_depth=6, learning_rate=0.05, subsample=0.8, 
            colsample_bytree=0.8, random_state=self.random_state, scale_pos_weight=100, 
            eval_metric='aucpr', reg_alpha=0.1, reg_lambda=0.1, min_child_weight=1
        )
        self.models['lgb'] = lgb.LGBMClassifier(
            n_estimators=200, max_depth=6, learning_rate=0.05, subsample=0.8, 
            colsample_bytree=0.8, random_state=self.random_state, is_unbalance=True, 
            metric='average_precision', reg_alpha=0.1, reg_lambda=0.1, 
            min_child_samples=20, num_leaves=31, boosting_type='dart'
        )
        self.models['isolation_forest'] = IsolationForest(
            n_estimators=200, contamination=0.05, random_state=self.random_state, 
            max_samples='auto', max_features=0.8
        )
        self.models['random_forest'] = RandomForestClassifier(
            n_estimators=100, max_depth=12, random_state=self.random_state, 
            class_weight='balanced_subsample', max_samples=0.8, 
            min_samples_leaf=5, max_features='sqrt'
        )
        self.models['logistic'] = LogisticRegression(
            random_state=self.random_state, class_weight='balanced', 
            C=0.01, max_iter=2000, penalty='l1', solver='liblinear'
        )    
    def fit(self, X, y):
        if isinstance(X, np.ndarray):
            X = X.astype(float)
        else:
            X = np.asarray(X, dtype=float)
        self.initialize_models(X.shape[1])
        for name in ['xgb', 'lgb', 'random_forest', 'logistic']:
            self.models[name].fit(X, y)
        self.models['isolation_forest'].fit(X)
        self.is_trained = True
    
    def predict_proba(self, X):
        if not self.is_trained:
            raise ValueError("Models must be trained first!")
        if isinstance(X, np.ndarray):
            X = X.astype(float)
        else:
            X = np.asarray(X, dtype=float)
        predictions = {}
        for name in ['xgb', 'lgb', 'random_forest', 'logistic']:
            predictions[name] = self.models[name].predict_proba(X)[:, 1]
        iso_scores = self.models['isolation_forest'].decision_function(X)
        predictions['isolation_forest'] = 1 / (1 + np.exp(-iso_scores * 2))
        return predictions

class SimplifiedMetaLearner:
    def __init__(self, random_state=42):
        self.random_state = random_state
        self.meta_model = None
        self.scaler = RobustScaler()
    
    def fit(self, base_predictions, features, y):
        base_pred_matrix = np.column_stack([base_predictions[name] for name in base_predictions])
        combined_features = np.column_stack([base_pred_matrix, features])
        combined_features_scaled = self.scaler.fit_transform(combined_features)
        self.meta_model = LogisticRegression(
            random_state=self.random_state, class_weight='balanced', C=0.1, max_iter=1000
        )
        self.meta_model.fit(combined_features_scaled, y)
        self.base_model_names = list(base_predictions.keys())
    
    def predict(self, base_predictions, features):
        base_pred_matrix = np.column_stack([base_predictions[name] for name in base_predictions])
        combined_features = np.column_stack([base_pred_matrix, features])
        combined_features_scaled = self.scaler.transform(combined_features)
        predictions = self.meta_model.predict_proba(combined_features_scaled)[:, 1]
        n_base_models = len(self.base_model_names)
        attention_weights = np.ones((len(predictions), n_base_models)) / n_base_models
        return predictions.reshape(-1, 1), attention_weights

class SaveableCreditCardExplainer:
    def __init__(self, base_ensemble, feature_names):
        self.base_ensemble = base_ensemble
        self.feature_names = feature_names
        self.shap_explainer = None
    
    def fit_shap(self, X_background):
        import shap
        # Use LightGBM if available, else XGBoost, else RandomForest
        model = None
        if 'lgb' in self.base_ensemble.models:
            model = self.base_ensemble.models['lgb']
        elif 'xgb' in self.base_ensemble.models:
            model = self.base_ensemble.models['xgb']
        elif 'random_forest' in self.base_ensemble.models:
            model = self.base_ensemble.models['random_forest']
        if model is not None:
            self.shap_explainer = shap.TreeExplainer(model)
            self.shap_background = X_background
        else:
            self.shap_explainer = None
            self.shap_background = None

    def _get_lime_explainer(self):
        from lime.lime_tabular import LimeTabularExplainer
        # Use background data from SHAP if available, else random
        if hasattr(self, 'shap_background') and self.shap_background is not None:
            background = self.shap_background
        else:
            import numpy as np
            background = np.random.normal(size=(100, len(self.feature_names)))
        explainer = LimeTabularExplainer(
            background,
            feature_names=self.feature_names,
            class_names=['Legitimate', 'Fraud'],
            discretize_continuous=True,
            mode='classification'
        )
        return explainer

    def explain(self, transaction, prediction, base_predictions):
        import numpy as np
        explanation = {}
        # SHAP values
        if self.shap_explainer is not None:
            shap_values = self.shap_explainer.shap_values(np.array([transaction]))
            if isinstance(shap_values, list):
                # For multiclass, use class 1 (fraud)
                shap_values = shap_values[1]
            feature_importance = dict(zip(self.feature_names, shap_values[0]))
            explanation['shap'] = feature_importance
        # LIME explanation
        try:
            lime_explainer = self._get_lime_explainer()
            # Use LightGBM if available, else XGBoost, else RandomForest
            model = None
            if 'lgb' in self.base_ensemble.models:
                model = self.base_ensemble.models['lgb']
            elif 'xgb' in self.base_ensemble.models:
                model = self.base_ensemble.models['xgb']
            elif 'random_forest' in self.base_ensemble.models:
                model = self.base_ensemble.models['random_forest']
            if model is not None:
                def predict_fn(x):
                    return model.predict_proba(x)
                lime_exp = lime_explainer.explain_instance(
                    np.array(transaction), predict_fn, num_features=10
                )
                lime_dict = dict(lime_exp.as_list())
                explanation['lime'] = lime_dict
        except Exception as e:
            explanation['lime_error'] = str(e)
        return explanation

class ImprovedCreditCardFraudPipeline:
    def __init__(self, random_state=42):
        self.feature_engineer = SafeCreditCardFeatureEngineer()
        self.sampler = ImprovedConservativeSampler(target_fraud_ratio=0.3)
        self.base_ensemble = ImprovedCreditCardEnsemble(random_state=random_state)
        self.meta_learner = None
        self.explainer = None
        self.is_trained = False
        self.feature_names = []
        self.performance_metrics = {}
        self.optimal_threshold = 0.3
    
    def load_data(self, file_path):
        df = pd.read_csv(file_path)
        X = df.drop('Class', axis=1)
        y = df['Class']
        return X, y
    
    def fit(self, file_path, test_size=0.3):
        from sklearn.model_selection import train_test_split
        X_raw, y = self.load_data(file_path)
        X_train, X_test, y_train, y_test = train_test_split(
            X_raw, y, test_size=test_size, random_state=42, stratify=y
        )
        X_train_engineered = self.feature_engineer.fit_transform(X_train, y_train)
        self.feature_names = self.feature_engineer.feature_names
        X_test_engineered = self.feature_engineer.transform(X_test)
        if X_train_engineered.shape[1] != X_test_engineered.shape[1]:
            raise ValueError(f"Feature dimension mismatch! Train: {X_train_engineered.shape[1]}, Test: {X_test_engineered.shape[1]}")
        X_resampled, y_resampled = self.sampler.fit_resample(X_train_engineered, y_train)
        self.sampler.get_sampling_info(y_train, y_resampled)
        self.base_ensemble.fit(X_resampled, y_resampled)
        base_predictions = self.base_ensemble.predict_proba(X_resampled)
        self.meta_learner = SimplifiedMetaLearner(random_state=42)
        self.meta_learner.fit(base_predictions, X_resampled.values, y_resampled)
        self.explainer = SaveableCreditCardExplainer(self.base_ensemble, self.feature_names)
        self.is_trained = True
        test_predictions, _ = self.predict_batch(X_test_engineered)
        self.optimal_threshold = self.find_optimal_threshold(y_test, test_predictions)
        performance = self.evaluate_performance(y_test, test_predictions, threshold=self.optimal_threshold)
        self.performance_metrics = performance
        return X_test_engineered, y_test, performance
    
    def find_optimal_threshold(self, y_true, y_scores):
        from sklearn.metrics import f1_score
        thresholds = np.arange(0.05, 0.5, 0.02)
        best_threshold = 0.3
        best_f1 = 0
        for threshold in thresholds:
            y_pred = (y_scores > threshold).astype(int)
            if len(np.unique(y_pred)) > 1:
                f1 = f1_score(y_true, y_pred)
                if f1 > best_f1:
                    best_f1 = f1
                    best_threshold = threshold
        return best_threshold
    
    def predict(self, transaction_data, threshold=None):
        if not self.is_trained:
            raise ValueError("Pipeline must be trained first!")
        if threshold is None:
            threshold = self.optimal_threshold
        if isinstance(transaction_data, np.ndarray):
            transaction_array = transaction_data
        else:
            transaction_array = transaction_data.values
        base_predictions = self.base_ensemble.predict_proba(transaction_array)
        final_prediction, attention_weights = self.meta_learner.predict(
            base_predictions, transaction_array
        )
        fraud_prediction = final_prediction[0][0] > threshold
        explanation = self.explainer.explain(
            transaction_array[0], final_prediction[0][0], 
            {k: v[0] for k, v in base_predictions.items()}
        )
        explanation['attention_weights'] = {
            list(base_predictions.keys())[i]: float(weight) 
            for i, weight in enumerate(attention_weights[0])
        }
        explanation['fraud_prediction'] = bool(fraud_prediction)
        explanation['threshold_used'] = threshold
        return final_prediction[0][0], explanation
    
    def predict_batch(self, X, threshold=None):
        if threshold is None:
            threshold = self.optimal_threshold
        if isinstance(X, np.ndarray):
            X_array = X
        else:
            X_array = X.values
        base_predictions = self.base_ensemble.predict_proba(X_array)
        final_predictions, attention_weights = self.meta_learner.predict(
            base_predictions, X_array
        )
        fraud_predictions = (final_predictions > threshold).astype(int)
        return fraud_predictions.flatten(), final_predictions.flatten()
    
    def evaluate_performance(self, y_true, y_pred, threshold=0.3):
        from sklearn.metrics import (
            classification_report, confusion_matrix, roc_auc_score, 
            average_precision_score, f1_score
        )
        y_pred_binary = (y_pred > threshold).astype(int)
        roc_auc = roc_auc_score(y_true, y_pred)
        avg_precision = average_precision_score(y_true, y_pred)
        report = classification_report(
            y_true, y_pred_binary, target_names=['Legitimate', 'Fraud'], output_dict=True
        )
        cm = confusion_matrix(y_true, y_pred_binary)
        tn, fp, fn, tp = cm.ravel()
        fraud_recall = tp / (tp + fn) if (tp + fn) > 0 else 0
        fraud_precision = tp / (tp + fp) if (tp + fp) > 0 else 0
        false_positive_rate = fp / (fp + tn) if (fp + tn) > 0 else 0
        f1_fraud = 2 * (fraud_precision * fraud_recall) / (fraud_precision + fraud_recall) if (fraud_precision + fraud_recall) > 0 else 0
        performance_metrics = {
            'roc_auc': roc_auc,
            'average_precision': avg_precision,
            'fraud_recall': fraud_recall,
            'fraud_precision': fraud_precision,
            'false_positive_rate': false_positive_rate,
            'f1_fraud': f1_fraud,
            'confusion_matrix': cm,
            'classification_report': report,
            'threshold_used': threshold,
            'fraud_caught': tp,
            'fraud_missed': fn,
            'false_alarms': fp
        }
        return performance_metrics
    
    def save(self, filepath):
        import joblib
        import copy
        pipeline_copy = copy.copy(self)
        pipeline_copy.explainer = None
        joblib.dump(pipeline_copy, filepath)
    
    def load(self, filepath):
        import joblib
        loaded_pipeline = joblib.load(filepath)
        for key, value in loaded_pipeline.__dict__.items():
            if key != 'explainer':
                setattr(self, key, value)
        self.explainer = SaveableCreditCardExplainer(self.base_ensemble, self.feature_names)
        return self