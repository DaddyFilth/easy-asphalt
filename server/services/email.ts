import { ENV } from "../_core/env";

export interface EmailNotification {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function sanitizeSubject(value: string) {
  return value.replace(/[\r\n]+/g, " ").slice(0, 200);
}

export async function sendEstimateNotification(
  recipientEmail: string,
  projectName: string,
  squareFeet: number,
  material: string,
  totalCost: string,
  shareLink: string
): Promise<{ success: boolean; messageId?: string }> {
  const safeProjectName = escapeHtml(projectName);
  const safeMaterial = escapeHtml(formatMaterialName(material));
  const safeTotalCost = escapeHtml(totalCost);
  const safeShareLink = escapeHtml(shareLink);

  const html = `
    <h2>Driveway Estimate Ready</h2>
    <p>Your driveway estimate for <strong>${safeProjectName}</strong> is ready!</p>
    
    <h3>Project Summary</h3>
    <ul>
      <li><strong>Area:</strong> ${squareFeet} sq ft</li>
      <li><strong>Material:</strong> ${safeMaterial}</li>
      <li><strong>Estimated Cost:</strong> ${safeTotalCost}</li>
    </ul>
    
    <p><a href="${safeShareLink}" style="background-color: #3b82f6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
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
    subject: sanitizeSubject(`Driveway Estimate Ready: ${projectName}`),
    html,
    text,
  });
}

export async function sendContractorNotification(
  contractorEmail: string,
  ownerName: string,
  projectName: string,
  squareFeet: number,
  material: string,
  totalCost: string,
  shareLink: string
): Promise<{ success: boolean; messageId?: string }> {
  const safeOwnerName = escapeHtml(ownerName);
  const safeProjectName = escapeHtml(projectName);
  const safeMaterial = escapeHtml(formatMaterialName(material));
  const safeTotalCost = escapeHtml(totalCost);
  const safeShareLink = escapeHtml(shareLink);

  const html = `
    <h2>New Driveway Project Estimate</h2>
    <p><strong>${safeOwnerName}</strong> has shared a driveway estimate with you.</p>
    
    <h3>Project Details</h3>
    <ul>
      <li><strong>Project Name:</strong> ${safeProjectName}</li>
      <li><strong>Area:</strong> ${squareFeet} sq ft</li>
      <li><strong>Material:</strong> ${safeMaterial}</li>
      <li><strong>Estimated Cost:</strong> ${safeTotalCost}</li>
    </ul>
    
    <p><a href="${safeShareLink}" style="background-color: #10b981; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
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
    subject: sanitizeSubject(`New Driveway Project: ${projectName}`),
    html,
    text,
  });
}

async function sendEmail(
  notification: EmailNotification
): Promise<{ success: boolean; messageId?: string }> {
  if (!ENV.resendApiKey) {
    console.info("[Email] RESEND_API_KEY not configured; mock email accepted", {
      toDomain: notification.to.split("@")[1] ?? "unknown",
      subject: notification.subject,
    });
    return {
      success: true,
      messageId: `mock_${Date.now()}`,
    };
  }

  try {
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${ENV.resendApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: ENV.emailFromAddress,
        to: [notification.to],
        subject: notification.subject,
        html: notification.html,
        text: notification.text,
      }),
    });

    if (!response.ok) {
      const errorBody = await response.text().catch(() => "");
      console.error("[Email] Resend API error:", response.status, errorBody);

      // If domain verification fails, provide helpful guidance
      if (
        response.status === 403 &&
        errorBody.includes("domain is not verified")
      ) {
        console.warn(
          "[Email] Domain not verified in Resend. Please verify the domain in Resend dashboard or use a verified sender address."
        );
      }

      return { success: false };
    }

    const result = (await response.json()) as { id: string };
    return { success: true, messageId: result.id };
  } catch (error) {
    console.error("[Email] Failed to send email:", error);
    return { success: false };
  }
}

function formatMaterialName(material: string): string {
  const names: Record<string, string> = {
    hotmix: "Hot Mix Asphalt",
    millings: "Asphalt Millings",
    tar_and_chip: "Tar and Chip",
    gravel: "Gravel",
  };
  return names[material] || material;
}
