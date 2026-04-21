package utils

import (
	"crypto/rand"
	"fmt"
	"html"
	"log"
	"math/big"
	"net/smtp"
	"os"
	"strings"
)

// appURL returns the base application URL from the environment.
func appURL() string {
	if u := os.Getenv("APP_URL"); u != "" {
		return u
	}
	return "http://localhost:5173"
}

// htmlEsc safely escapes a user-supplied string for embedding in HTML.
func htmlEsc(s string) string {
	return html.EscapeString(s)
}

// ctaButton renders a styled indigo-gradient CTA button for HTML emails.
func ctaButton(href, label string) string {
	return fmt.Sprintf(
		`<table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin: 28px auto;">`+
			`<tr><td align="center" style="border-radius: 10px; background: linear-gradient(135deg, #6366f1, #3b82f6);">`,
	) + fmt.Sprintf(
		`<a href="%s" target="_blank" style="display: inline-block; padding: 14px 36px; color: #ffffff; font-size: 15px; font-weight: 700; text-decoration: none; border-radius: 10px; letter-spacing: 0.4px;">%s</a>`,
		href, label,
	) + `</td></tr></table>`
}

// credentialRow renders a labeled credential row for use inside a credentials card.
func credentialRow(label, value string) string {
	return fmt.Sprintf(
		`<tr><td style="padding: 10px 0; border-bottom: 1px solid #27272a;">`+
			`<span style="font-size: 11px; font-weight: 700; color: #71717a; text-transform: uppercase; letter-spacing: 1px;">%s</span><br/>`+
			`<span style="font-size: 14px; color: #e4e4e7; font-family: 'Courier New', Courier, monospace; word-break: break-all;">%s</span>`+
			`</td></tr>`,
		label, value,
	)
}

// baseTemplate wraps content in the shared InvoiceFlow branded dark email layout.
func baseTemplate(title, preheader, content string) string {
	return fmt.Sprintf(`<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>%s</title>
</head>
<body style="margin:0;padding:0;background-color:#09090b;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;color:#e4e4e7;">
  <span style="display:none;max-height:0;overflow:hidden;mso-hide:all;">%s</span>
  <table role="presentation" width="100%%" cellpadding="0" cellspacing="0" border="0">
    <tr>
      <td align="center" style="padding:40px 16px;">
        <table role="presentation" width="600" cellpadding="0" cellspacing="0" border="0" style="max-width:600px;width:100%%">

          <!-- Logo header -->
          <tr>
            <td align="center" style="padding-bottom:32px;">
              <table role="presentation" cellpadding="0" cellspacing="0" border="0">
                <tr>
                  <td style="background:linear-gradient(135deg,#6366f1,#3b82f6);border-radius:14px;width:48px;height:48px;text-align:center;vertical-align:middle;">
                    <span style="color:#ffffff;font-size:20px;font-weight:900;font-style:italic;line-height:48px;display:block;">IF</span>
                  </td>
                  <td style="padding-left:12px;vertical-align:middle;">
                    <span style="font-size:20px;font-weight:900;font-style:italic;color:#6366f1;">InvoiceFlow</span><br/>
                    <span style="font-size:10px;font-weight:700;color:#52525b;letter-spacing:3px;text-transform:uppercase;">Business Suite</span>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Card -->
          <tr>
            <td style="background-color:#18181b;border:1px solid #27272a;border-radius:16px;padding:40px;">
              %s
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td align="center" style="padding-top:32px;">
              <p style="margin:0 0 6px 0;font-size:12px;color:#52525b;">If you didn&#39;t request this email, you can safely ignore it.</p>
              <p style="margin:0;font-size:12px;color:#3f3f46;">&copy; 2026 InvoiceFlow. All rights reserved.</p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`, title, preheader, content)
}

// ─── Email senders ────────────────────────────────────────────────────────────

// SendWelcomeEmail sends a branded welcome email to a newly registered admin.
func SendWelcomeEmail(to, name, businessName string) {
	content := fmt.Sprintf(`
<h1 style="margin:0 0 8px 0;font-size:24px;font-weight:800;color:#fafafa;">Welcome aboard, %s!</h1>
<p style="margin:0 0 24px 0;font-size:14px;color:#a1a1aa;line-height:1.7;">
  Your InvoiceFlow account for <strong style="color:#e4e4e7;">%s</strong> is ready.
  Manage invoices, customers, transactions, and your team — all in one place.
</p>
<table role="presentation" width="100%%" cellpadding="0" cellspacing="0" border="0"
  style="background:#09090b;border:1px solid #27272a;border-radius:12px;margin:0 0 24px 0;padding:20px;">
  <tr>
    <td>
      <p style="margin:0 0 10px 0;font-size:11px;font-weight:700;color:#71717a;text-transform:uppercase;letter-spacing:1px;">Quick start</p>
      <ul style="margin:0;padding:0 0 0 18px;color:#a1a1aa;font-size:14px;line-height:2.1;">
        <li>Add your first customer</li>
        <li>Create and send invoices</li>
        <li>Invite sales representatives</li>
        <li>Track payments and transactions</li>
      </ul>
    </td>
  </tr>
</table>
%s
<p style="margin:16px 0 0 0;font-size:13px;color:#52525b;text-align:center;">Questions? Reply to this email — we&#39;re here to help.</p>`,
		htmlEsc(name), htmlEsc(businessName),
		ctaButton(appURL()+"/dashboard", "Go to Dashboard"),
	)
	body := baseTemplate("Welcome to InvoiceFlow!", "Your InvoiceFlow account is ready. Let's get started!", content)
	SendEmail(to, "Welcome to InvoiceFlow!", body)
}

// SendPasswordResetEmail sends a password reset link email.
func SendPasswordResetEmail(to, name, resetToken string) {
	resetLink := appURL() + "/reset-password?token=" + resetToken
	content := fmt.Sprintf(`
<h1 style="margin:0 0 8px 0;font-size:24px;font-weight:800;color:#fafafa;">Reset your password</h1>
<p style="margin:0 0 24px 0;font-size:14px;color:#a1a1aa;line-height:1.7;">
  Hi <strong style="color:#e4e4e7;">%s</strong>, we received a request to reset the password on your InvoiceFlow account.
  Click the button below to choose a new password.
</p>
%s
<p style="margin:0 0 20px 0;font-size:13px;color:#71717a;text-align:center;">
  This link expires in <strong style="color:#e4e4e7;">1 hour</strong>.
  If you didn&#39;t request a reset, you can safely ignore this email.
</p>
<table role="presentation" width="100%%" cellpadding="0" cellspacing="0" border="0"
  style="background:#09090b;border:1px solid #27272a;border-radius:12px;padding:16px 20px;">
  <tr>
    <td>
      <p style="margin:0 0 6px 0;font-size:11px;font-weight:700;color:#71717a;text-transform:uppercase;letter-spacing:1px;">Or paste this link in your browser</p>
      <p style="margin:0;font-size:12px;color:#6366f1;font-family:'Courier New',Courier,monospace;word-break:break-all;">%s</p>
    </td>
  </tr>
</table>`,
		htmlEsc(name),
		ctaButton(resetLink, "Reset Password"),
		htmlEsc(resetLink),
	)
	body := baseTemplate("Reset Your Password", "A password reset was requested for your InvoiceFlow account.", content)
	SendEmail(to, "Reset Your InvoiceFlow Password", body)
}

// SendCustomerPortalEmail sends portal login credentials to a newly created customer.
func SendCustomerPortalEmail(to, name, email, password string) {
	content := fmt.Sprintf(`
<h1 style="margin:0 0 8px 0;font-size:24px;font-weight:800;color:#fafafa;">Your portal is ready</h1>
<p style="margin:0 0 24px 0;font-size:14px;color:#a1a1aa;line-height:1.7;">
  Hi <strong style="color:#e4e4e7;">%s</strong>, an account has been created for you on the InvoiceFlow customer portal.
  Use the credentials below to log in and view your invoices, payments, and transaction history.
</p>
<table role="presentation" width="100%%" cellpadding="0" cellspacing="0" border="0"
  style="background:#09090b;border:1px solid #27272a;border-radius:12px;margin:0 0 8px 0;padding:20px;">
  <thead>
    <tr><td style="padding-bottom:12px;">
      <span style="font-size:11px;font-weight:700;color:#71717a;text-transform:uppercase;letter-spacing:1px;">Your login credentials</span>
    </td></tr>
  </thead>
  <tbody>
    %s
    %s
  </tbody>
</table>
%s
<p style="margin:0;font-size:13px;color:#71717a;text-align:center;">We recommend changing your password after your first login.</p>`,
		htmlEsc(name),
		credentialRow("Email", htmlEsc(email)),
		credentialRow("Password", htmlEsc(password)),
		ctaButton(appURL()+"/login", "Access Your Portal"),
	)
	body := baseTemplate("Customer Portal Access", "Your InvoiceFlow customer portal credentials are inside.", content)
	SendEmail(to, "Your InvoiceFlow Customer Portal Access", body)
}

// SendRepWelcomeEmail sends login credentials to a newly created sales representative.
func SendRepWelcomeEmail(to, name, email, password string) {
	content := fmt.Sprintf(`
<h1 style="margin:0 0 8px 0;font-size:24px;font-weight:800;color:#fafafa;">Welcome to the team, %s!</h1>
<p style="margin:0 0 24px 0;font-size:14px;color:#a1a1aa;line-height:1.7;">
  A representative account has been set up for you on InvoiceFlow.
  Use the credentials below to log in and start recording transactions.
</p>
<table role="presentation" width="100%%" cellpadding="0" cellspacing="0" border="0"
  style="background:#09090b;border:1px solid #27272a;border-radius:12px;margin:0 0 8px 0;padding:20px;">
  <thead>
    <tr><td style="padding-bottom:12px;">
      <span style="font-size:11px;font-weight:700;color:#71717a;text-transform:uppercase;letter-spacing:1px;">Your login credentials</span>
    </td></tr>
  </thead>
  <tbody>
    %s
    %s
  </tbody>
</table>
%s
<p style="margin:0;font-size:13px;color:#71717a;text-align:center;">Please change your password after your first login.</p>`,
		htmlEsc(name),
		credentialRow("Email", htmlEsc(email)),
		credentialRow("Password", htmlEsc(password)),
		ctaButton(appURL()+"/login", "Log In Now"),
	)
	body := baseTemplate("Your Rep Account", "Your InvoiceFlow representative account credentials are inside.", content)
	SendEmail(to, "Your InvoiceFlow Representative Account", body)
}

// ─── Core SMTP sender ─────────────────────────────────────────────────────────

// SendEmail sends an HTML email via SMTP and falls back to console logging when SMTP is not configured.
func SendEmail(to, subject, htmlBody string) {
	host := os.Getenv("SMTP_HOST")
	port := os.Getenv("SMTP_PORT")
	user := os.Getenv("SMTP_USER")
	pass := os.Getenv("SMTP_PASS")
	from := os.Getenv("SMTP_FROM")

	if host == "" || user == "" || pass == "" {
		log.Printf("SIMULATED EMAIL TO: %s\nSUBJECT: %s\n-------------------", to, subject)
		return
	}

	auth := smtp.PlainAuth("", user, pass, host)
	msg := "From: InvoiceFlow <" + from + ">\r\n" +
		"To: " + to + "\r\n" +
		"Subject: " + subject + "\r\n" +
		"MIME-Version: 1.0\r\n" +
		"Content-Type: text/html; charset=UTF-8\r\n" +
		"\r\n" +
		htmlBody

	addr := host + ":" + port
	if err := smtp.SendMail(addr, auth, from, []string{to}, []byte(msg)); err != nil {
		log.Printf("EMAIL SEND ERROR to %s: %v", to, err)
		return
	}
	log.Printf("EMAIL SENT to: %s | SUBJECT: %s", to, subject)
}

// LogEmail is kept for backward compatibility — wraps plain text in a minimal HTML body.
func LogEmail(to, subject, body string) {
	htmlBody := `<div style="font-family:sans-serif;color:#e4e4e7;background:#09090b;padding:32px;">` +
		`<pre style="white-space:pre-wrap;font-size:14px;color:#a1a1aa;">` + html.EscapeString(body) + `</pre></div>`
	SendEmail(to, subject, htmlBody)
}

// GenerateRandomPassword creates a cryptographically secure random alphanumeric password.
func GenerateRandomPassword(length int) (string, error) {
	const charset = "abcdefghijklmnpqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789"
	var sb strings.Builder
	for i := 0; i < length; i++ {
		num, err := rand.Int(rand.Reader, big.NewInt(int64(len(charset))))
		if err != nil {
			return "", fmt.Errorf("failed to generate random password: %w", err)
		}
		sb.WriteByte(charset[num.Int64()])
	}
	return sb.String(), nil
}
