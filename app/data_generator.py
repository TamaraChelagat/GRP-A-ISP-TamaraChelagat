"""
Synthetic Transaction Data Generator for FraudDetectPro
Generates realistic transaction data and sends to API every minute
"""

import numpy as np
import pandas as pd
import requests
import time
import logging
from datetime import datetime
from typing import Dict, List
import json
import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Configuration
API_URL = os.getenv('FASTAPI_URL', 'http://localhost:8000')
GENERATION_INTERVAL = 60  # seconds (1 minute)
BATCH_SIZE = 20  # Generate 10 transactions per batch
FRAUD_RATIO = 0.85  # 5% fraud rate

# Setup logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler('synthetic_generator.log'),
        logging.StreamHandler()
    ]
)
logger = logging.getLogger(__name__)


class SyntheticTransactionGenerator:
    """Generate realistic synthetic credit card transactions"""
    
    def __init__(self, fraud_ratio: float = 0.05):
        self.fraud_ratio = fraud_ratio
        self.transaction_count = 0
        self.fraud_count = 0
        
        # Statistical parameters from real credit card data
        self.legitimate_params = {
            'time_mean': 94813.86,
            'time_std': 47488.15,
            'amount_mean': 88.35,
            'amount_std': 250.12,
            'v_means': np.zeros(28),  # PCA features centered around 0
            'v_stds': np.ones(28) * 1.96  # Standard deviation for PCA features
        }
        
        self.fraud_params = {
            'time_mean': 80746.81,
            'time_std': 47835.45,
            'amount_mean': 122.21,
            'amount_std': 256.68,
            'v_means': np.zeros(28),
            'v_stds': np.ones(28) * 3.5  # Larger variance for fraud
        }
        
        logger.info("Synthetic Transaction Generator initialized")
        logger.info(f"Fraud ratio: {fraud_ratio * 100}%")
    
    def generate_legitimate_transaction(self) -> Dict:
        """Generate a legitimate transaction"""
        # Time (seconds from first transaction)
        time_val = max(0, np.random.normal(
            self.legitimate_params['time_mean'],
            self.legitimate_params['time_std']
        ))
        
        # Amount (typical legitimate range: $1-$500)
        amount = max(1.0, np.random.lognormal(
            np.log(self.legitimate_params['amount_mean']),
            0.8
        ))
        amount = min(amount, 500.0)  # Cap at reasonable amount
        
        # V1-V28 (PCA features)
        v_features = np.random.normal(
            self.legitimate_params['v_means'],
            self.legitimate_params['v_stds']
        )
        
        # Ensure features are within reasonable bounds
        v_features = np.clip(v_features, -5, 5)
        
        # Combine all features: [Time, V1-V28, Amount]
        features = [time_val] + v_features.tolist() + [amount]
        
        return {
            'features': features,
            'true_label': 'Legitimate',
            'amount': amount,
            'time': time_val
        }
    
    def generate_fraud_transaction(self) -> Dict:
        """Generate a realistic fraudulent transaction by sampling from real frauds and adding noise."""
        # Load real frauds from dataset
        data_path = os.path.join(os.path.dirname(os.path.dirname(__file__)), 'data', 'raw', 'creditcard.csv')
        try:
            df = pd.read_csv(data_path)
            fraud_df = df[df['Class'] == 1]
            if len(fraud_df) == 0:
                raise ValueError("No fraud samples found in dataset")
            row = fraud_df.sample(1).iloc[0]
            # Extract Time, V1-V28, Amount (30 features total)
            time_val = float(row['Time'])
            v_features = [float(row[f'V{i}']) + np.random.normal(0, 0.2) for i in range(1, 29)]
            amount = float(row['Amount']) + np.random.normal(0, 2.0)
            # Clip values to reasonable range
            v_features = np.clip(v_features, -10, 10)
            amount = max(1.0, min(amount, 2500.0))
            # Combine features: [Time, V1-V28, Amount] = 30 features
            features = [time_val] + v_features + [amount]
            features = [float(f) for f in features]
        except Exception as e:
            logger.warning(f"Failed to load fraud from dataset: {e}. Using synthetic fraud generation.")
            # Fallback: generate synthetic fraud
            time_val = max(0, np.random.normal(
                self.fraud_params['time_mean'],
                self.fraud_params['time_std']
            ))
            amount = max(1.0, np.random.lognormal(
                np.log(self.fraud_params['amount_mean']),
                1.2
            ))
            amount = min(amount, 2500.0)
            v_features = np.random.normal(
                self.fraud_params['v_means'],
                self.fraud_params['v_stds']
            )
            v_features = np.clip(v_features, -10, 10)
            features = [time_val] + v_features.tolist() + [amount]
        
        return {
            'features': features,
            'true_label': 'Fraudulent',
            'amount': amount,
            'time': features[0]  # Time is first feature
        }
    
    def generate_batch(self, batch_size: int = 10) -> List[Dict]:
        """Generate a batch of transactions"""
        transactions = []
        
        for _ in range(batch_size):
            # Decide if this transaction is fraud
            is_fraud = np.random.random() < self.fraud_ratio
            
            if is_fraud:
                transaction = self.generate_fraud_transaction()
                self.fraud_count += 1
            else:
                transaction = self.generate_legitimate_transaction()
            
            self.transaction_count += 1
            transaction['transaction_id'] = f"SYNTH_{self.transaction_count:06d}"
            transaction['timestamp'] = datetime.now().isoformat()
            
            transactions.append(transaction)
        
        return transactions
    
    def get_statistics(self) -> Dict:
        """Get generator statistics"""
        return {
            'total_generated': self.transaction_count,
            'fraud_generated': self.fraud_count,
            'legitimate_generated': self.transaction_count - self.fraud_count,
            'actual_fraud_ratio': (self.fraud_count / self.transaction_count * 100) if self.transaction_count > 0 else 0
        }


class TransactionSender:
    """Send transactions to the API"""
    
    def __init__(self, api_url: str):
        self.api_url = api_url
        self.successful_predictions = 0
        self.failed_predictions = 0
        self.results_log = []
        
        logger.info(f"Transaction Sender initialized for API: {api_url}")
    
    def check_api_health(self) -> bool:
        """Check if API is available"""
        try:
            response = requests.get(f"{self.api_url}/health", timeout=5)
            if response.status_code == 200:
                logger.info("API health check passed")
                return True
            else:
                logger.warning(f"API health check failed: status {response.status_code}")
                return False
        except Exception as e:
            logger.error(f"API health check failed: {e}")
            return False
    
    def send_transaction(self, transaction: Dict) -> Dict:
        """Send a single transaction to the API"""
        try:
            # Prepare payload
            payload = {
                "features": transaction['features']
            }
            
            # Send request
            response = requests.post(
                f"{self.api_url}/predict",
                json=payload,
                timeout=10
            )
            
            if response.status_code == 200:
                result = response.json()
                self.successful_predictions += 1
                
                # Check if prediction matches true label
                predicted_label = result['prediction']
                true_label = transaction['true_label']
                is_correct = predicted_label == true_label
                
                log_entry = {
                    'transaction_id': transaction['transaction_id'],
                    'timestamp': transaction['timestamp'],
                    'true_label': true_label,
                    'predicted_label': predicted_label,
                    'probability': result['probability'],
                    'amount': transaction['amount'],
                    'is_correct': is_correct
                }
                
                self.results_log.append(log_entry)
                
                # Log result
                emoji = "y" if is_correct else "n"
                logger.info(
                    f"{emoji} {transaction['transaction_id']} | "
                    f"True: {true_label} | Pred: {predicted_label} | "
                    f"Prob: {result['probability']:.3f} | "
                    f"Amount: ${transaction['amount']:.2f}"
                )
                
                return log_entry
            else:
                self.failed_predictions += 1
                error_detail = response.json().get('detail', 'Unknown error')
                logger.error(f"prediction failed: {error_detail}")
                return None
                
        except Exception as e:
            self.failed_predictions += 1
            logger.error(f"Error sending transaction: {e}")
            return None
    
    def send_batch(self, transactions: List[Dict]) -> List[Dict]:
        """Send a batch of transactions"""
        results = []
        
        logger.info(f"Sending batch of {len(transactions)} transactions...")
        
        for transaction in transactions:
            result = self.send_transaction(transaction)
            if result:
                results.append(result)
            time.sleep(0.1)  # Small delay between requests
        
        return results
    
    def get_statistics(self) -> Dict:
        """Get sender statistics"""
        total_sent = self.successful_predictions + self.failed_predictions
        
        if len(self.results_log) > 0:
            correct_predictions = sum(1 for r in self.results_log if r['is_correct'])
            accuracy = (correct_predictions / len(self.results_log)) * 100
        else:
            accuracy = 0
        
        return {
            'total_sent': total_sent,
            'successful': self.successful_predictions,
            'failed': self.failed_predictions,
            'accuracy': accuracy
        }
    
    def save_results(self, filename: str = 'synthetic_results.json'):
        """Save results to file"""
        with open(filename, 'w') as f:
            json.dump(self.results_log, f, indent=2)
        logger.info(f"Results saved to {filename}")


class SyntheticDataPipeline:
    """Main pipeline to generate and send synthetic data"""
    
    def __init__(self, api_url: str, interval: int = 60, batch_size: int = 10, fraud_ratio: float = 0.05):
        self.generator = SyntheticTransactionGenerator(fraud_ratio)
        self.sender = TransactionSender(api_url)
        self.interval = interval
        self.batch_size = batch_size
        self.is_running = False
        
        logger.info("=" * 60)
        logger.info("Synthetic Data Pipeline Initialized")
        logger.info(f"API URL: {api_url}")
        logger.info(f"Interval: {interval} seconds")
        logger.info(f"Batch size: {batch_size} transactions")
        logger.info(f"Target fraud ratio: {fraud_ratio * 100}%")
        logger.info("=" * 60)
    
    def run_once(self):
        """Run one cycle of generation and sending"""
        logger.info(f"\n{'='*60}")
        logger.info(f"Starting generation cycle at {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
        logger.info(f"{'='*60}")
        
        # Generate transactions
        transactions = self.generator.generate_batch(self.batch_size)
        logger.info(f"Generated {len(transactions)} transactions")
        
        # Send to API
        results = self.sender.send_batch(transactions)
        
        # Print statistics
        gen_stats = self.generator.get_statistics()
        send_stats = self.sender.get_statistics()
        
        logger.info(f"\nGeneration Statistics:")
        logger.info(f"   Total generated: {gen_stats['total_generated']}")
        logger.info(f"   Fraud: {gen_stats['fraud_generated']} ({gen_stats['actual_fraud_ratio']:.2f}%)")
        logger.info(f"   Legitimate: {gen_stats['legitimate_generated']}")
        
        logger.info(f"\nPrediction Statistics:")
        logger.info(f"   Total sent: {send_stats['total_sent']}")
        logger.info(f"   Successful: {send_stats['successful']}")
        logger.info(f"   Failed: {send_stats['failed']}")
        logger.info(f"   Accuracy: {send_stats['accuracy']:.2f}%")
        
        return results
    
    def run_continuous(self):
        """Run continuously with specified interval"""
        self.is_running = True
        
        # Check API health first
        if not self.sender.check_api_health():
            logger.error("API is not available. Please start the API first.")
            return
        
        logger.info("Starting continuous generation...")
        logger.info(f"Will generate every {self.interval} seconds")
        logger.info("Press Ctrl+C to stop\n")
        
        cycle_count = 0
        
        try:
            while self.is_running:
                cycle_count += 1
                logger.info(f"\nCycle #{cycle_count}")
            
                self.run_once()
                
                # Wait for next cycle
                logger.info(f"\n Waiting {self.interval} seconds until next cycle...")
                time.sleep(self.interval)
                
        except KeyboardInterrupt:
            logger.info("\n\nStopping synthetic data generation...")
            self.stop()
        except Exception as e:
            logger.error(f" Error in continuous run: {e}")
            self.stop()
    
    def stop(self):
        """Stop the pipeline and save results"""
        self.is_running = False
        
        # Save results
        self.sender.save_results()
        
        # Final statistics
        gen_stats = self.generator.get_statistics()
        send_stats = self.sender.get_statistics()
        
        logger.info("\n" + "=" * 60)
        logger.info("FINAL STATISTICS")
        logger.info("=" * 60)
        logger.info(f"\nGeneration:")
        logger.info(f"  Total transactions: {gen_stats['total_generated']}")
        logger.info(f"  Fraud: {gen_stats['fraud_generated']} ({gen_stats['actual_fraud_ratio']:.2f}%)")
        logger.info(f"  Legitimate: {gen_stats['legitimate_generated']}")
        
        logger.info(f"\nPrediction:")
        logger.info(f"  Total sent: {send_stats['total_sent']}")
        logger.info(f"  Successful: {send_stats['successful']}")
        logger.info(f"  Failed: {send_stats['failed']}")
        logger.info(f"  Model Accuracy: {send_stats['accuracy']:.2f}%")
        
        logger.info("\nPipeline stopped successfully")


def main():
    """Main entry point"""
    import argparse
    
    parser = argparse.ArgumentParser(description='Synthetic Transaction Generator for FraudDetectPro')
    parser.add_argument('--api-url', default='http://localhost:8000', help='FastAPI URL')
    parser.add_argument('--interval', type=int, default=60, help='Generation interval in seconds')
    parser.add_argument('--batch-size', type=int, default=10, help='Transactions per batch')
    parser.add_argument('--fraud-ratio', type=float, default=0.05, help='Fraud ratio (0.0-1.0)')
    parser.add_argument('--once', action='store_true', help='Run once and exit')
    
    args = parser.parse_args()
    
    # Create pipeline
    pipeline = SyntheticDataPipeline(
        api_url=args.api_url,
        interval=args.interval,
        batch_size=args.batch_size,
        fraud_ratio=args.fraud_ratio
    )
    
    if args.once:
        # Run once
        pipeline.run_once()
    else:
        # Run continuously
        pipeline.run_continuous()


if __name__ == "__main__":
    main()