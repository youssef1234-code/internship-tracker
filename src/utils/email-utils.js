import { saveToStore, getAllFromStore } from "./indexedDB-utils";

/**
 * Send an email to a user
 * @param {Object} email - The email object
 * @param {string} email.recipient - The email address of the recipient
 * @param {string} email.subject - The subject of the email
 * @param {string} email.content - The content of the email
 * @param {string} [email.sender='system@scad.edu'] - The sender of the email
 * @returns {Promise<Object>} - The saved email object with generated ID
 */
export const sendEmail = async (email) => {
  try {
    // Validate required fields
    if (!email.recipient || !email.subject || !email.content) {
      throw new Error("Email recipient, subject, and content are required");
    }

    // Generate email ID and add metadata
    const newEmail = {
      ...email,
      id: `email-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      date: new Date().toISOString(),
      read: false,
      sender: email.sender || "system@scad.edu",
      senderName: email.senderName || "SCAD System",
    };

    // Save to IndexedDB
    await saveToStore("emails", newEmail);

    // Dispatch an event that a new email was sent
    window.dispatchEvent(new Event("emailSent"));

    return newEmail;
  } catch (error) {
    console.error("Failed to send email:", error);
    throw error;
  }
};

/**
 * Mark an email as read
 * @param {string} emailId - The ID of the email to mark as read
 * @returns {Promise<Object>} - The updated email object
 */
export const markEmailAsRead = async (emailId) => {
  try {
    // Get all emails
    const allEmails = await getAllFromStore("emails");

    // Find the email
    const email = allEmails.find((e) => e.id === emailId);
    if (!email) {
      throw new Error(`Email with ID ${emailId} not found`);
    }

    // Update the email
    const updatedEmail = { ...email, read: true };

    // Save to IndexedDB
    await saveToStore("emails", updatedEmail);

    return updatedEmail;
  } catch (error) {
    console.error("Failed to mark email as read:", error);
    throw error;
  }
};

/**
 * Get all emails for a user
 * @param {string} userEmail - The user's email address
 * @returns {Promise<Array>} - Array of email objects
 */
export const getUserEmails = async (userEmail) => {
  try {
    // Get all emails from IndexedDB
    const allEmails = await getAllFromStore("emails");

    // Filter for the recipient
    const userEmails = allEmails.filter(
      (email) => email.recipient === userEmail && !email._deleted
    );

    // Sort by date (newest first)
    userEmails.sort((a, b) => new Date(b.date) - new Date(a.date));

    return userEmails;
  } catch (error) {
    console.error("Failed to get user emails:", error);
    return [];
  }
};

/**
 * Delete an email by ID
 * @param {string} emailId - The ID of the email to delete
 * @returns {Promise<boolean>} - Success status
 */
export const deleteEmail = async (emailId) => {
  try {
    // Get all emails
    const allEmails = await getAllFromStore("emails");

    // Find the email to delete
    const emailToDelete = allEmails.find((e) => e.id === emailId);

    if (!emailToDelete) {
      throw new Error(`Email with ID ${emailId} not found`);
    }

    // Mark as deleted
    await saveToStore("emails", {
      ...emailToDelete,
      _deleted: true,
    });

    return true;
  } catch (error) {
    console.error("Failed to delete email:", error);
    return false;
  }
};

/**
 * Send a company approval notification email
 * @param {Object} company - The company data
 * @param {boolean} approved - Whether the company was approved or rejected
 * @returns {Promise<Object>} - The sent email
 */
export const sendCompanyApprovalEmail = async (company, approved) => {
  const subject = approved
    ? "Your Company Registration Has Been Approved"
    : "Your Company Registration Application Status";

  const content = approved
    ? `<p>Dear ${company.companyName},</p>
       <p>We are pleased to inform you that your company registration with SCAD has been <strong>approved</strong>.</p>
       <p>You can now log in to the SCAD system and start posting internship opportunities for our students.</p>
       <p>If you have any questions, please don't hesitate to reach out to the SCAD office.</p>
       <p>Best regards,<br>SCAD Team</p>`
    : `<p>Dear ${company.companyName},</p>
       <p>Thank you for your interest in joining our SCAD internship program.</p>
       <p>After careful review, we regret to inform you that your company registration has been <strong>declined</strong> at this time.</p>
       <p>This may be due to incomplete information or not meeting our current partnership criteria.</p>
       <p>Please contact the SCAD office for more details and guidance on how to improve your application for future consideration.</p>
       <p>Best regards,<br>SCAD Team</p>`;

  return sendEmail({
    recipient: company.email,
    subject: subject,
    content: content,
    sender: "approvals@scad.edu",
    senderName: "SCAD Approvals Team",
  });
};

/**
 * Initialize sample emails for testing
 * @param {string} userEmail - The user's email to create sample emails for
 */
export const initializeSampleEmails = async (userEmail) => {
  if (!userEmail) return [];

  // Check if emails already exist
  const existingEmails = await getUserEmails(userEmail);

  if (existingEmails.length === 0) {
    const sampleEmails = [
      {
        recipient: userEmail,
        subject: "Welcome to the SCAD System",
        content: `<p>Dear User,</p>
                 <p>Welcome to the SCAD Internship Management System. We're excited to have you join our platform.</p>
                 <p>Through this system, you'll be able to manage your internship applications, track your progress, and communicate with companies and the SCAD office.</p>
                 <p>If you need any assistance, don't hesitate to contact our support team.</p>
                 <p>Best regards,<br>The SCAD Team</p>`,
        sender: "welcome@scad.edu",
        senderName: "SCAD Welcome Team",
        date: new Date(Date.now() - 3600000).toISOString(), // 1 hour ago
        read: false,
      },
      {
        recipient: userEmail,
        subject: "Getting Started with Your Internship Journey",
        content: `<p>Hello,</p>
                 <p>Thank you for registering with the SCAD Internship System.</p>
                 <p>Here are some tips to get started:</p>
                 <ul>
                   <li>Complete your profile with all required information</li>
                   <li>Browse available internship opportunities</li>
                   <li>Prepare your resume and application materials</li>
                   <li>Apply to positions that match your skills and interests</li>
                 </ul>
                 <p>Good luck with your internship search!</p>
                 <p>Regards,<br>Student Career Services</p>`,
        sender: "career@scad.edu",
        senderName: "Student Career Services",
        date: new Date(Date.now() - 86400000).toISOString(), // 1 day ago
        read: true,
      },
      {
        recipient: userEmail,
        subject: "Important Dates - Upcoming Internship Cycle",
        content: `<p>Dear Student,</p>
                 <p>Please mark these important dates for the upcoming internship cycle:</p>
                 <ul>
                   <li><strong>Application Period:</strong> June 1 - July 15</li>
                   <li><strong>Interview Phase:</strong> July 20 - August 10</li>
                   <li><strong>Placement Confirmations:</strong> August 15</li>
                   <li><strong>Internship Start Date:</strong> September 1</li>
                 </ul>
                 <p>Make sure to complete all requirements before the deadlines.</p>
                 <p>Best regards,<br>SCAD Office</p>`,
        sender: "deadlines@scad.edu",
        senderName: "SCAD Office",
        date: new Date(Date.now() - 172800000).toISOString(), // 2 days ago
        read: true,
      },
    ];

    for (const email of sampleEmails) {
      await sendEmail(email);
    }

    return sampleEmails;
  }

  return existingEmails;
};
