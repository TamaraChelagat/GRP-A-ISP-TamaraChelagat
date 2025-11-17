import { 
  auth,
  TotpMultiFactorGenerator 
} from '../config/firebase';
import {
  multiFactor,
  TotpMultiFactorAssertion,
  User
} from 'firebase/auth';

export interface TOTPEnrollmentResult {
  success: boolean;
  error?: string;
  secret?: string;
  qrCodeUrl?: string;
}

export interface TOTPVerificationResult {
  success: boolean;
  error?: string;
}

export const totpAuthService = {
  /**
   * Enroll TOTP for multi-factor authentication
   * @param user - Current authenticated user
   * @param totpDisplayName - Display name for the TOTP factor (e.g., "My Phone")
   */
  async enrollTOTP(user: User, totpDisplayName: string = 'TOTP'): Promise<TOTPEnrollmentResult> {
    try {
      const multiFactorUser = multiFactor(user);
      
      // Generate TOTP secret using the session from the user
      // Note: This requires the user to have recently authenticated
      const session = await multiFactorUser.getSession();
      const totpSecret = TotpMultiFactorGenerator.generateSecret(session);
      
      // Generate QR code URL manually using otpauth:// format
      // Firebase's TotpMultiFactorGenerator doesn't have a generateQrCodeUrl method
      // We generate the otpauth:// URL which is the standard format for TOTP
      const issuer = encodeURIComponent('FraudDetectPro');
      const accountName = encodeURIComponent(user.email || 'user@example.com');
      const qrCodeUrl = `otpauth://totp/${issuer}:${accountName}?secret=${totpSecret}&issuer=${issuer}`;
      
      return {
        success: true,
        secret: totpSecret,
        qrCodeUrl
      };
    } catch (error: any) {
      console.error('TOTP enrollment error:', error);
      return {
        success: false,
        error: error.message || 'Failed to enroll TOTP. Make sure you are recently authenticated.'
      };
    }
  },

  /**
   * Complete TOTP enrollment by verifying the code
   * @param user - Current authenticated user
   * @param totpCode - 6-digit TOTP code from authenticator app
   * @param totpSecret - Secret from enrollTOTP
   * @param totpDisplayName - Display name for the TOTP factor
   */
  async completeTOTPEnrollment(
    user: User,
    totpCode: string,
    totpSecret: string,
    totpDisplayName: string = 'TOTP'
  ): Promise<TOTPVerificationResult> {
    try {
      const multiFactorUser = multiFactor(user);
      
      // Create TOTP assertion
      const totpAssertion = TotpMultiFactorGenerator.assertionForEnrollment(totpSecret, totpCode);
      
      // Enroll the TOTP factor
      await multiFactorUser.enroll(totpAssertion, totpDisplayName);
      
      return {
        success: true
      };
    } catch (error: any) {
      console.error('TOTP enrollment completion error:', error);
      return {
        success: false,
        error: error.message || 'Failed to complete TOTP enrollment'
      };
    }
  },

  /**
   * Verify TOTP code during sign-in (for MFA)
   * @param user - User attempting to sign in
   * @param totpCode - 6-digit TOTP code from authenticator app
   * @param sessionId - Session ID from the MFA challenge
   */
  async verifyTOTP(
    user: User,
    totpCode: string,
    sessionId: string
  ): Promise<TOTPVerificationResult> {
    try {
      const multiFactorUser = multiFactor(user);
      
      // Get enrolled TOTP factors
      const enrolledFactors = multiFactorUser.enrolledFactors;
      
      if (enrolledFactors.length === 0) {
        return {
          success: false,
          error: 'No TOTP factor enrolled'
        };
      }
      
      // For sign-in, we need to use the first enrolled factor
      // In a real app, you might want to let the user choose which factor to use
      const totpFactor = enrolledFactors[0];
      
      // Create assertion for sign-in
      const totpAssertion = TotpMultiFactorGenerator.assertionForSignIn(
        totpFactor.uid,
        totpCode
      );
      
      // Verify the TOTP code
      await multiFactorUser.resolveSignIn(totpAssertion, sessionId);
      
      return {
        success: true
      };
    } catch (error: any) {
      console.error('TOTP verification error:', error);
      return {
        success: false,
        error: error.message || 'Invalid TOTP code'
      };
    }
  },

  /**
   * Check if user has TOTP enrolled
   * @param user - Current authenticated user
   */
  hasTOTPEnrolled(user: User): boolean {
    try {
      const multiFactorUser = multiFactor(user);
      const enrolledFactors = multiFactorUser.enrolledFactors;
      return enrolledFactors.length > 0;
    } catch (error) {
      console.error('Error checking TOTP enrollment:', error);
      return false;
    }
  },

  /**
   * Unenroll TOTP factor
   * @param user - Current authenticated user
   * @param factorUid - UID of the factor to unenroll
   */
  async unenrollTOTP(user: User, factorUid: string): Promise<TOTPVerificationResult> {
    try {
      const multiFactorUser = multiFactor(user);
      await multiFactorUser.unenroll(factorUid);
      
      return {
        success: true
      };
    } catch (error: any) {
      console.error('TOTP unenrollment error:', error);
      return {
        success: false,
        error: error.message || 'Failed to unenroll TOTP'
      };
    }
  }
};

export default totpAuthService;

