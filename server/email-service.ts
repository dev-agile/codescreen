import { Resend } from 'resend';

// Initialize Resend with API key from environment variables
let resend: Resend | null = null;

try {
  if (process.env.RESEND_API_KEY) {
    resend = new Resend(process.env.RESEND_API_KEY);
  } else {
    console.warn('RESEND_API_KEY not found in environment variables. Email functionality will be disabled.');
  }
} catch (error) {
  console.error('Error initializing Resend:', error);
}

interface EmailOptions {
  to: string | string[];
  subject: string;
  text?: string;
  html?: string;
  from?: string;
}

/**
 * Sends an email using Resend
 * @param options Email sending options
 * @returns Promise with the result of the email sending operation
 */
export async function sendEmail(options: EmailOptions): Promise<{ success: boolean; error?: string }> {
  try {
    // Check if Resend is initialized
    if (!resend) {
      console.warn('Resend not initialized. Email will not be sent.');
      return { 
        success: false, 
        error: 'Email service not configured. Please add RESEND_API_KEY to environment variables.' 
      };
    }

    const fromEmail = options.from || 'sau9458@mailinator.com';

    // Send email using Resend
    const emailData: any = {
      from: fromEmail,
      to: Array.isArray(options.to) ? options.to : [options.to],
      subject: options.subject,
    };
    
    // At least one of text or html is required
    if (options.html) {
      emailData.html = options.html;
    }
    if (options.text) {
      emailData.text = options.text;
    } else if (!options.html) {
      // Default text content if neither is provided
      emailData.text = "Please view this email in an HTML-compatible email client";
    }
    
    const { data, error } = await resend.emails.send(emailData);

    if (error) {
      console.error('Error sending email:', error);
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (error) {
    console.error('Error sending email:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error sending email' 
    };
  }
}

/**
 * Sends a test invitation email to a candidate
 * @param candidateEmail Candidate's email address
 * @param candidateName Candidate's name
 * @param testTitle Title of the test
 * @param testLink Link to access the test
 * @param duration Test duration in minutes
 * @param companyName Company name (optional)
 */
export async function sendTestInvitation(
  candidateEmail: string,
  candidateName: string,
  testTitle: string,
  testLink: string,
  duration: number,
  companyName?: string
): Promise<{ success: boolean; error?: string }> {
  const fullTestLink = `${process.env.PUBLIC_URL || 'https://codescreen.example.com'}/take-test/${testLink}`;
  
  const subject = `You've been invited to take a coding assessment`;
  
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #4f46e5;">Coding Assessment Invitation</h2>
      <p>Hello ${candidateName},</p>
      <p>You have been invited to take a coding assessment: <strong>${testTitle}</strong>.</p>
      
      <div style="margin: 20px 0; padding: 15px; background-color: #f9fafb; border-radius: 8px;">
        <p><strong>Test Details:</strong></p>
        <ul style="padding-left: 20px;">
          <li>Duration: ${duration} minutes</li>
          <li>The timer will start once you begin the test</li>
          <li>Your progress is automatically saved</li>
          <li>The test will be auto-submitted when the time is up</li>
        </ul>
      </div>
      
      <div style="margin: 25px 0; text-align: center;">
        <a href="${fullTestLink}" style="display: inline-block; background-color: #4f46e5; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold;">Start Assessment</a>
      </div>
      
      <p>This link is unique to you. Please do not share it with others.</p>
      <p>Good luck!</p>
      
      <hr style="margin: 30px 0; border: none; border-top: 1px solid #e5e7eb;" />
      
      <p style="font-size: 14px; color: #6b7280;">
        This assessment is powered by CodeScreen${companyName ? ` on behalf of ${companyName}` : ''}.
      </p>
    </div>
  `;
  
  const text = `
Hello ${candidateName},

You have been invited to take a coding assessment: ${testTitle}.

Test Details:
- Duration: ${duration} minutes
- The timer will start once you begin the test
- Your progress is automatically saved
- The test will be auto-submitted when the time is up

Start the assessment by clicking or copying this link:
${fullTestLink}

This link is unique to you. Please do not share it with others.

Good luck!

This assessment is powered by CodeScreen${companyName ? ` on behalf of ${companyName}` : ''}.
  `;
  
  return sendEmail({
    to: candidateEmail,
    subject,
    html,
    text
  });
}