/** Supabase speaks in API terms. People don't. */
export function plainAuthError(message: string): string {
  const m = message.toLowerCase();
  if (m.includes("invalid login credentials")) return "That email and password don't match an account.";
  if (m.includes("email not confirmed")) return "Check your inbox and confirm the email first.";
  if (m.includes("user already registered") || m.includes("already been registered"))
    return "There's already an account on that email. Sign in instead, or reset the password.";
  if (m.includes("password should be at least")) return "Passwords need at least 8 characters.";
  if (m.includes("unable to validate email") || m.includes("invalid format"))
    return "That doesn't look like a working email address.";
  if (m.includes("for security purposes") || m.includes("rate limit") || m.includes("too many"))
    return "Too many tries. Wait a minute and go again.";
  if (m.includes("unsupported provider") || m.includes("provider is not enabled"))
    return "That sign-in isn't switched on yet. Use your email and password.";
  if (m.includes("failed to fetch") || m.includes("network"))
    return "Couldn't reach the server. Check your connection and try again.";
  if (m.includes("same password")) return "That's the password you already had. Pick a different one.";
  return message;
}
