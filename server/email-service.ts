import emailjs from '@emailjs/nodejs';
import { testInvitationTemplate } from './templates/email-templates';

// Initialize EmailJS with environment variables
const EMAILJS_PUBLIC_KEY = process.env.EMAILJS_PUBLIC_KEY;
const EMAILJS_SERVICE_ID = process.env.EMAILJS_SERVICE_ID;
const EMAILJS_TEMPLATE_ID = process.env.EMAILJS_TEMPLATE_ID;
const EMAILJS_PRIVATE_KEY = process.env.EMAILJS_PRIVATE_KEY;

console.log('=== EmailJS Environment Variables ===');
console.log('PUBLIC_KEY:', EMAILJS_PUBLIC_KEY);
console.log('SERVICE_ID:', EMAILJS_SERVICE_ID);
console.log('TEMPLATE_ID:', EMAILJS_TEMPLATE_ID);
console.log('PRIVATE_KEY:', EMAILJS_PRIVATE_KEY ? 'Present' : 'Missing');

// Initialize EmailJS with both public and private keys for server-side usage
try {
  emailjs.init({
    publicKey: EMAILJS_PUBLIC_KEY || '',
    privateKey: EMAILJS_PRIVATE_KEY // Required for server-side usage
  });
  console.log('EmailJS initialized successfully');
} catch (error) {
  console.error('Error initializing EmailJS:', error);
}

/**
 * Sends a test invitation email to a candidate using EmailJS
 * @param candidateEmail - The email address of the candidate
 * @param candidateName - The name of the candidate
 * @param testTitle - The title of the test
 * @param testLink - The unique test link
 * @param duration - Test duration in minutes
 * @param companyName - Optional company name
 */
export async function sendTestInvitation(
  candidateEmail: string,
  candidateName: string,
  testTitle: string,
  testLink: string,
  duration: number,
  companyName?: string
): Promise<{ success: boolean; error?: string }> {
  console.log('=== Starting sendTestInvitation ===');
  console.log('Candidate:', { email: candidateEmail, name: candidateName });
  console.log('Test:', { title: testTitle, link: testLink, duration });

  try {
    if (!EMAILJS_PUBLIC_KEY || !EMAILJS_SERVICE_ID || !EMAILJS_TEMPLATE_ID || !EMAILJS_PRIVATE_KEY) {
      console.error('Missing EmailJS configuration:', {
        hasPublicKey: !!EMAILJS_PUBLIC_KEY,
        hasServiceId: !!EMAILJS_SERVICE_ID,
        hasTemplateId: !!EMAILJS_TEMPLATE_ID,
        hasPrivateKey: !!EMAILJS_PRIVATE_KEY
      });
      throw new Error('EmailJS configuration is missing. Please check your environment variables.');
    }

    const fullTestLink = `${process.env.PUBLIC_URL || 'https://codescreen.example.com'}/take-test/${testLink}`;
    console.log('Full test link:', fullTestLink);

    const templateParams = {
      to_email: candidateEmail,
      to_name: candidateName,
      test_title: testTitle,
      test_link: fullTestLink,
      test_duration: duration,
      company_name: companyName || 'Cognivac',
      subject: "You've been invited to take a logical assessment",
    };

    console.log('Sending email with params:', {
      ...templateParams,
      html: 'HTML template present' // Don't log the full HTML
    });

    console.log('EmailJS send configuration:', {
      serviceId: EMAILJS_SERVICE_ID,
      templateId: EMAILJS_TEMPLATE_ID,
      hasPublicKey: !!EMAILJS_PUBLIC_KEY,
      hasPrivateKey: !!EMAILJS_PRIVATE_KEY
    });

    await emailjs.send(
      EMAILJS_SERVICE_ID,
      EMAILJS_TEMPLATE_ID,
      templateParams,
      {
        publicKey: EMAILJS_PUBLIC_KEY,
        privateKey: EMAILJS_PRIVATE_KEY
      }
    );

    console.log('Email sent successfully');
    return { success: true };
  } catch (error) {
    console.error('Error sending email:', error);
    console.error('Error details:', {
      name: error instanceof Error ? error.name : 'Unknown',
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    });

    // Check for API access disabled error
    if (error instanceof Error && error.message.includes('API calls are disabled for non-browser applications')) {
      return {
        success: false,
        error: 'EmailJS API calls are disabled. Please enable API access for non-browser applications in your EmailJS dashboard (Account -> Security).'
      };
    }

    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error sending email'
    };
  }
}