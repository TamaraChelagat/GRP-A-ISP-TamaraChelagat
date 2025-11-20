import { 
  auth, 
  phoneProvider 
} from '../config/firebase';
import {
  signInWithPhoneNumber,
  RecaptchaVerifier,
  ConfirmationResult,
  PhoneAuthCredential,
  signInWithCredential,
  User
} from 'firebase/auth';

export interface OTPResult {
  success: boolean;
  error?: string;
  confirmationResult?: ConfirmationResult;
}

export const otpAuthService = {
  /**
   * Send OTP to phone number
   * @param phoneNumber - Phone number in E.164 format (e.g., +1234567890)
   * @param recaptchaContainerId - ID of the container element for reCAPTCHA
   */
  async sendOTP(phoneNumber: string, recaptchaContainerId: string = 'recaptcha-container', useVisibleRecaptcha: boolean = false): Promise<OTPResult> {
    try {
      // Clean up any existing reCAPTCHA verifier
      const existingContainer = document.getElementById(recaptchaContainerId);
      if (existingContainer) {
        existingContainer.innerHTML = '';
      }

      // Create reCAPTCHA verifier
      // Use visible reCAPTCHA for better reliability (especially for testing)
      const recaptchaVerifier = new RecaptchaVerifier(auth, recaptchaContainerId, {
        size: useVisibleRecaptcha ? 'normal' : 'invisible',
        callback: () => {
          console.log('✅ reCAPTCHA verified successfully');
        },
        'expired-callback': () => {
          console.warn('⚠️ reCAPTCHA expired - user needs to verify again');
        },
        'error-callback': (error: any) => {
          console.error('❌ reCAPTCHA error:', error);
        }
      });

      console.log('📱 Sending OTP to:', phoneNumber);
      console.log('🔐 reCAPTCHA verifier created, waiting for verification...');

      // Send OTP
      const confirmationResult = await signInWithPhoneNumber(auth, phoneNumber, recaptchaVerifier);
      
      console.log('✅ OTP sent successfully! Confirmation result received.');
      
      return {
        success: true,
        confirmationResult
      };
    } catch (error: any) {
      console.error('❌ OTP send error:', error);
      console.error('Error code:', error.code);
      console.error('Error message:', error.message);
      
      // Provide more specific error messages
      let errorMessage = error.message || 'Failed to send OTP';
      
      if (error.code === 'auth/invalid-phone-number') {
        errorMessage = 'Invalid phone number format. Please include country code (e.g., +1234567890)';
      } else if (error.code === 'auth/missing-phone-number') {
        errorMessage = 'Phone number is required';
      } else if (error.code === 'auth/quota-exceeded') {
        errorMessage = 'SMS quota exceeded. Please try again later or contact support.';
      } else if (error.code === 'auth/captcha-check-failed') {
        errorMessage = 'reCAPTCHA verification failed. Please try again.';
      } else if (error.code === 'auth/too-many-requests') {
        errorMessage = 'Too many requests. Please wait a few minutes and try again.';
      }
      
      return {
        success: false,
        error: errorMessage
      };
    }
  },

  /**
   * Verify OTP code
   * @param confirmationResult - Result from sendOTP
   * @param code - 6-digit OTP code
   */
  async verifyOTP(confirmationResult: ConfirmationResult, code: string): Promise<{ success: boolean; user?: User; error?: string }> {
    try {
      const result = await confirmationResult.confirm(code);
      return {
        success: true,
        user: result.user
      };
    } catch (error: any) {
      console.error('OTP verification error:', error);
      return {
        success: false,
        error: error.message || 'Invalid OTP code'
      };
    }
  },

  /**
   * Format phone number to E.164 format
   * @param phoneNumber - Phone number in any format
   */
  formatPhoneNumber(phoneNumber: string): string {
    // Remove all non-digit characters
    const digits = phoneNumber.replace(/\D/g, '');
    
    // If it doesn't start with +, assume it's a local number and add +1 (US/Canada)
    // You may want to adjust this based on your default country code
    if (!phoneNumber.startsWith('+')) {
      return `+1${digits}`;
    }
    
    return phoneNumber;
  }
};

export default otpAuthService;

