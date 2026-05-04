/**
 * Email notification service
 * In production, integrate with SendGrid, AWS SES, or similar
 * This is a mock implementation that logs emails
 */

export interface EmailNotification {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

/**
 * Send email notification for project estimate
 */
export async function sendEstimateNotification(
  recipientEmail: string,
  projectName: string,
  squareFeet: number,
  material: string,
  totalCost: string,
  shareLink: string
): Promise<{ success: boolean; messageId?: string }> {
  const html = `
    <h2>Driveway Estimate Ready</h2>
    <p>Your driveway estimate for <strong>${projectName}</strong> is ready!</p>
    
    <h3>Project Summary</h3>
    <ul>
      <li><strong>Area:</strong> ${squareFeet} sq ft</li>
      <li><strong>Material:</strong> ${formatMaterialName(material)}</li>
      <li><strong>Estimated Cost:</strong> ${totalCost}</li>
    </ul>
    
    <p><a href="${shareLink}" style="background-color: #3b82f6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
      View Full Estimate
    </a></p>
    
    <p>You can share this link with contractors or use it to get quotes.</p>
    <p>Best regards,<br/>Driveway Estimator Pro</p>
  `;

  const text = `
Driveway Estimate Ready

Your driveway estimate for ${projectName} is ready!

Project Summary:
- Area: ${squareFeet} sq ft
- Material: ${formatMaterialName(material)}
- Estimated Cost: ${totalCost}

View your estimate: ${shareLink}

You can share this link with contractors or use it to get quotes.

Best regards,
Driveway Estimator Pro
  `.trim();

  return sendEmail({
    to: recipientEmail,
    subject: `Driveway Estimate Ready: ${projectName}`,
    html,
    text,
  });
}

/**
 * Send email notification to contractor with project details
 */
export async function sendContractorNotification(
  contractorEmail: string,
  ownerName: string,
  projectName: string,
  squareFeet: number,
  material: string,
  totalCost: string,
  shareLink: string
): Promise<{ success: boolean; messageId?: string }> {
  const html = `
    <h2>New Driveway Project Estimate</h2>
    <p><strong>${ownerName}</strong> has shared a driveway estimate with you.</p>
    
    <h3>Project Details</h3>
    <ul>
      <li><strong>Project Name:</strong> ${projectName}</li>
      <li><strong>Area:</strong> ${squareFeet} sq ft</li>
      <li><strong>Material:</strong> ${formatMaterialName(material)}</li>
      <li><strong>Estimated Cost:</strong> ${totalCost}</li>
    </ul>
    
    <p><a href="${shareLink}" style="background-color: #10b981; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
      View Project Details
    </a></p>
    
    <p>You can use this information to prepare a quote for the homeowner.</p>
    <p>Best regards,<br/>Driveway Estimator Pro</p>
  `;

  const text = `
New Driveway Project Estimate

${ownerName} has shared a driveway estimate with you.

Project Details:
- Project Name: ${projectName}
- Area: ${squareFeet} sq ft
- Material: ${formatMaterialName(material)}
- Estimated Cost: ${totalCost}

View project details: ${shareLink}

You can use this information to prepare a quote for the homeowner.

Best regards,
Driveway Estimator Pro
  `.trim();

  return sendEmail({
    to: contractorEmail,
    subject: `New Driveway Project: ${projectName}`,
    html,
    text,
  });
}

/**
 * Core email sending function
 * In production, replace with actual email service provider
 */
async function sendEmail(
  notification: EmailNotification
): Promise<{ success: boolean; messageId?: string }> {
  try {
    // Mock implementation - in production, use SendGrid, AWS SES, etc.
    console.log("[Email] Sending email to:", notification.to);
    console.log("[Email] Subject:", notification.subject);
    console.log("[Email] HTML:", notification.html);

    // Simulate async operation
    await new Promise(resolve => setTimeout(resolve, 100));

    // In production, this would return a real message ID from the email service
    const mockMessageId = `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    console.log("[Email] Email sent successfully with ID:", mockMessageId);
    return { success: true, messageId: mockMessageId };
  } catch (error) {
    console.error("[Email] Failed to send email:", error);
    return { success: false };
  }
}

/**
 * Format material name for display
 */
function formatMaterialName(material: string): string {
  const names: Record<string, string> = {
    hotmix: "Hot Mix Asphalt",
    millings: "Asphalt Millings",
    tar_and_chip: "Tar and Chip",
    gravel: "Gravel",
  };
  return names[material] || material;
}
