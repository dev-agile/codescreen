export const testInvitationTemplate = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Test Invitation</title>
  <style>
    body {
      font-family: 'Arial', sans-serif;
      line-height: 1.6;
      color: #333;
      margin: 0;
      padding: 0;
      background-color: #f5f5f5;
    }
    .container {
      max-width: 600px;
      margin: 20px auto;
      background: white;
      border-radius: 10px;
      overflow: hidden;
      box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
    }
    .header {
      background: linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%);
      color: white;
      padding: 30px;
      text-align: center;
    }
    .header h1 {
      margin: 0;
      font-size: 24px;
      text-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
    }
    .content {
      padding: 30px;
      background: white;
    }
    .greeting {
      font-size: 18px;
      margin-bottom: 20px;
    }
    .test-title {
      font-size: 20px;
      color: #4f46e5;
      margin: 15px 0;
    }
    .details-box {
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 8px;
      padding: 20px;
      margin: 20px 0;
    }
    .details-title {
      display: flex;
      align-items: center;
      font-size: 18px;
      font-weight: bold;
      margin-bottom: 15px;
      color: #1e293b;
    }
    .details-icon {
      margin-right: 8px;
      font-size: 20px;
    }
    .details-list {
      list-style: none;
      padding: 0;
      margin: 0;
    }
    .details-list li {
      display: flex;
      align-items: center;
      margin-bottom: 12px;
      color: #475569;
    }
    .details-list li:last-child {
      margin-bottom: 0;
    }
    .button-container {
      text-align: center;
      margin: 30px 0;
    }
    .button {
      display: inline-block;
      background: #4f46e5;
      color: white;
      padding: 14px 28px;
      border-radius: 8px;
      text-decoration: none;
      font-weight: bold;
      font-size: 16px;
      transition: background 0.3s ease;
    }
    .button:hover {
      background: #4338ca;
    }
    .note {
      background: #fef3c7;
      border-left: 4px solid #f59e0b;
      padding: 15px;
      margin: 20px 0;
      border-radius: 4px;
    }
    .footer {
      text-align: center;
      padding: 20px 30px;
      background: #f8fafc;
      color: #64748b;
      font-size: 14px;
      border-top: 1px solid #e2e8f0;
    }
    @media (max-width: 600px) {
      .container {
        margin: 10px;
        width: auto;
      }
      .header {
        padding: 20px;
      }
      .content {
        padding: 20px;
      }
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>Logical Assessment Invitation</h1>
    </div>
    <div class="content">
      <div class="greeting">
        Hello {{to_name}},
      </div>
      
      <p>You have been invited to take a logical assessment:</p>
      <div class="test-title">
        {{test_title}}
      </div>
      
      <div class="details-box">
        <div class="details-title">
          <span class="details-icon">📝</span> Test Details
        </div>
        <ul class="details-list">
          <li>⏱️ Duration: {{test_duration}} minutes</li>
          <li>🔄 Your progress is automatically saved</li>
          <li>⚡ The timer starts when you begin</li>
          <li>✅ Auto-submission when time is up</li>
        </ul>
      </div>
      
      <div class="button-container">
        <a href="{{test_link}}" class="button">Start Assessment</a>
      </div>
      
      <div class="note">
        <strong>Important:</strong> This link is unique to you. Please do not share it with others.
      </div>
      
      <p>Best of luck with your assessment!</p>
    </div>
    
    <div class="footer">
      This assessment is powered by Cognivac{{#if company_name}} on behalf of {{company_name}}{{/if}}.
    </div>
  </div>
</body>
</html>
`; 