export type EmailTemplate = {
  subject: string;
  html: string;
};

// Builds the one-click confirmation URL that your /auth/confirm route handles.
function confirmUrl(
  siteUrl: string,
  tokenHash: string,
  type: string,
  redirectTo: string
): string {
  const next = encodeURIComponent(redirectTo || "/");
  return `${siteUrl}/auth/confirm?token_hash=${tokenHash}&type=${type}&next=${next}`;
}

// ---------------------------------------------------------------------------
// Shared wrapper — swap the outer layout here to restyle all emails at once.
// ---------------------------------------------------------------------------
function layout(title: string, body: string): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${title}</title>
</head>
<body style="margin:0;padding:0;background:#f4f4f5;font-family:Arial,Helvetica,sans-serif;color:#18181b;">
  <table width="100%" cellpadding="0" cellspacing="0" style="padding:40px 16px;">
    <tr>
      <td align="center">
        <table width="560" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:8px;padding:40px;max-width:100%;">
          <tr><td>${body}</td></tr>
        </table>
        <p style="margin-top:24px;font-size:12px;color:#71717a;">
          If you did not request this email, you can safely ignore it.
        </p>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

function ctaButton(label: string, href: string): string {
  return `<a href="${href}"
    style="display:inline-block;margin-top:24px;padding:12px 28px;background:#18181b;color:#ffffff;border-radius:6px;text-decoration:none;font-size:15px;font-weight:600;"
  >${label}</a>`;
}

// ---------------------------------------------------------------------------
// Templates — one per email_action_type
// ---------------------------------------------------------------------------

function signup({
  siteUrl,
  tokenHash,
  redirectTo,
}: {
  siteUrl: string;
  tokenHash: string;
  redirectTo: string;
}): EmailTemplate {
  const url = confirmUrl(siteUrl, tokenHash, "signup", redirectTo);
  return {
    subject: "Confirm your email address",
    html: layout(
      "Confirm your email address",
      `<h1 style="margin:0 0 8px;font-size:22px;">Confirm your email address</h1>
       <p style="margin:0 0 4px;color:#52525b;">Click the button below to verify your email and complete your sign-up.</p>
       ${ctaButton("Confirm email", url)}
       <p style="margin-top:24px;font-size:13px;color:#71717a;">
         Button not working? Copy and paste this link into your browser:<br />
         <a href="${url}" style="color:#3b82f6;word-break:break-all;">${url}</a>
       </p>`
    ),
  };
}

function recovery({
  siteUrl,
  tokenHash,
  redirectTo,
}: {
  siteUrl: string;
  tokenHash: string;
  redirectTo: string;
}): EmailTemplate {
  const url = confirmUrl(siteUrl, tokenHash, "recovery", redirectTo);
  return {
    subject: "Reset your password",
    html: layout(
      "Reset your password",
      `<h1 style="margin:0 0 8px;font-size:22px;">Reset your password</h1>
       <p style="margin:0 0 4px;color:#52525b;">We received a request to reset the password for your account. Click the button below to choose a new password.</p>
       ${ctaButton("Reset password", url)}
       <p style="margin-top:16px;font-size:13px;color:#71717a;">This link expires in 1 hour.</p>
       <p style="margin-top:8px;font-size:13px;color:#71717a;">
         Button not working?<br />
         <a href="${url}" style="color:#3b82f6;word-break:break-all;">${url}</a>
       </p>`
    ),
  };
}

function magiclink({
  siteUrl,
  tokenHash,
  redirectTo,
}: {
  siteUrl: string;
  tokenHash: string;
  redirectTo: string;
}): EmailTemplate {
  const url = confirmUrl(siteUrl, tokenHash, "magiclink", redirectTo);
  return {
    subject: "Your sign-in link",
    html: layout(
      "Your sign-in link",
      `<h1 style="margin:0 0 8px;font-size:22px;">Sign in to your account</h1>
       <p style="margin:0 0 4px;color:#52525b;">Click the button below to sign in. This link can only be used once and expires in 1 hour.</p>
       ${ctaButton("Sign in", url)}
       <p style="margin-top:24px;font-size:13px;color:#71717a;">
         Button not working?<br />
         <a href="${url}" style="color:#3b82f6;word-break:break-all;">${url}</a>
       </p>`
    ),
  };
}

function invite({
  siteUrl,
  tokenHash,
  redirectTo,
}: {
  siteUrl: string;
  tokenHash: string;
  redirectTo: string;
}): EmailTemplate {
  const url = confirmUrl(siteUrl, tokenHash, "invite", redirectTo);
  return {
    subject: "You've been invited",
    html: layout(
      "You've been invited",
      `<h1 style="margin:0 0 8px;font-size:22px;">You have been invited</h1>
       <p style="margin:0 0 4px;color:#52525b;">You have been invited to create an account. Click the button below to accept the invitation and set your password.</p>
       ${ctaButton("Accept invitation", url)}
       <p style="margin-top:24px;font-size:13px;color:#71717a;">
         Button not working?<br />
         <a href="${url}" style="color:#3b82f6;word-break:break-all;">${url}</a>
       </p>`
    ),
  };
}

function emailChange({
  siteUrl,
  tokenHash,
  type,
  redirectTo,
  isCurrentEmail,
}: {
  siteUrl: string;
  tokenHash: string;
  type: string;
  redirectTo: string;
  isCurrentEmail: boolean;
}): EmailTemplate {
  const url = confirmUrl(siteUrl, tokenHash, type, redirectTo);
  const heading = isCurrentEmail
    ? "Confirm your current email"
    : "Confirm your new email address";
  const body = isCurrentEmail
    ? "We received a request to change your email address. Click below to confirm this change from your current email."
    : "An email address change was requested. Click below to confirm your new email address.";
  return {
    subject: heading,
    html: layout(
      heading,
      `<h1 style="margin:0 0 8px;font-size:22px;">${heading}</h1>
       <p style="margin:0 0 4px;color:#52525b;">${body}</p>
       ${ctaButton("Confirm email change", url)}
       <p style="margin-top:24px;font-size:13px;color:#71717a;">
         Button not working?<br />
         <a href="${url}" style="color:#3b82f6;word-break:break-all;">${url}</a>
       </p>`
    ),
  };
}

function reauthentication({
  siteUrl,
  tokenHash,
  redirectTo,
}: {
  siteUrl: string;
  tokenHash: string;
  redirectTo: string;
}): EmailTemplate {
  const url = confirmUrl(siteUrl, tokenHash, "reauthentication", redirectTo);
  return {
    subject: "Confirm your identity",
    html: layout(
      "Confirm your identity",
      `<h1 style="margin:0 0 8px;font-size:22px;">Confirm your identity</h1>
       <p style="margin:0 0 4px;color:#52525b;">A sensitive action was requested for your account. Click the button below to verify it's you.</p>
       ${ctaButton("Confirm", url)}
       <p style="margin-top:24px;font-size:13px;color:#71717a;">
         Button not working?<br />
         <a href="${url}" style="color:#3b82f6;word-break:break-all;">${url}</a>
       </p>`
    ),
  };
}

function passwordChangedNotification(): EmailTemplate {
  return {
    subject: "Your password has been changed",
    html: layout(
      "Password changed",
      `<h1 style="margin:0 0 8px;font-size:22px;">Your password has been changed</h1>
       <p style="margin:0 0 4px;color:#52525b;">
         Your account password was recently changed. If you made this change, no action is needed.
       </p>
       <p style="margin-top:16px;color:#52525b;">
         If you did <strong>not</strong> make this change, please reset your password immediately or contact support.
       </p>`
    ),
  };
}

function emailChangedNotification({ newEmail }: { newEmail: string }): EmailTemplate {
  return {
    subject: "Your email address has been updated",
    html: layout(
      "Email address updated",
      `<h1 style="margin:0 0 8px;font-size:22px;">Email address updated</h1>
       <p style="margin:0 0 4px;color:#52525b;">
         Your account email address has been changed to <strong>${newEmail}</strong>.
       </p>
       <p style="margin-top:16px;color:#52525b;">
         If you did not make this change, please contact support immediately.
       </p>`
    ),
  };
}

// ---------------------------------------------------------------------------
// Main resolver — called from the webhook route
// ---------------------------------------------------------------------------

export type EmailData = {
  token: string;
  token_hash: string;
  redirect_to: string;
  email_action_type: string;
  site_url: string;
  token_new: string;
  token_hash_new: string;
  old_email?: string;
};

export type SupabaseUser = {
  email: string;
  new_email?: string;
};

/**
 * Returns zero, one, or two email sends for a given hook payload.
 * Returns an array so `email_change` with Secure Email Change can yield two emails.
 */
export function resolveEmails(
  user: SupabaseUser,
  emailData: EmailData
): Array<{ to: string; template: EmailTemplate }> {
  const {
    email_action_type: type,
    token_hash,
    token_hash_new,
    redirect_to,
    site_url,
  } = emailData;

  switch (type) {
    case "signup":
      return [{ to: user.email, template: signup({ siteUrl: site_url, tokenHash: token_hash, redirectTo: redirect_to }) }];

    case "recovery":
      return [{ to: user.email, template: recovery({ siteUrl: site_url, tokenHash: token_hash, redirectTo: redirect_to }) }];

    case "magiclink":
      return [{ to: user.email, template: magiclink({ siteUrl: site_url, tokenHash: token_hash, redirectTo: redirect_to }) }];

    case "invite":
      return [{ to: user.email, template: invite({ siteUrl: site_url, tokenHash: token_hash, redirectTo: redirect_to }) }];

    case "email_change": {
      const emails: Array<{ to: string; template: EmailTemplate }> = [];

      // Secure Email Change enabled: two token/hash pairs are present.
      // token_hash_new → send to current email (user.email)
      // token_hash     → send to new email (user.new_email)
      if (token_hash_new) {
        emails.push({
          to: user.email,
          template: emailChange({
            siteUrl: site_url,
            tokenHash: token_hash_new,
            type,
            redirectTo: redirect_to,
            isCurrentEmail: true,
          }),
        });
      }
      if (user.new_email) {
        emails.push({
          to: user.new_email,
          template: emailChange({
            siteUrl: site_url,
            tokenHash: token_hash,
            type,
            redirectTo: redirect_to,
            isCurrentEmail: false,
          }),
        });
      }
      // Fallback: Secure Email Change disabled — only new email
      if (emails.length === 0) {
        emails.push({
          to: user.email,
          template: emailChange({
            siteUrl: site_url,
            tokenHash: token_hash,
            type,
            redirectTo: redirect_to,
            isCurrentEmail: false,
          }),
        });
      }
      return emails;
    }

    case "reauthentication":
      return [{ to: user.email, template: reauthentication({ siteUrl: site_url, tokenHash: token_hash, redirectTo: redirect_to }) }];

    case "password_changed_notification":
      return [{ to: user.email, template: passwordChangedNotification() }];

    case "email_changed_notification":
      return [{ to: user.email, template: emailChangedNotification({ newEmail: user.new_email ?? user.email }) }];

    default:
      return [];
  }
}
