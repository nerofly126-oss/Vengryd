import { getSupabaseClient } from "@/lib/supabase";

const waitlistTable = import.meta.env.VITE_SUPABASE_WAITLIST_TABLE || "waitlist_signups";
const waitlistEmailFunction =
  import.meta.env.VITE_SUPABASE_WAITLIST_EMAIL_FUNCTION || "waitlist-email";

type JoinWaitlistResult = {
  alreadyJoined: boolean;
  emailFailed: boolean;
};

export async function joinWaitlist(email: string): Promise<JoinWaitlistResult> {
  const normalizedEmail = email.trim().toLowerCase();

  if (!normalizedEmail) {
    throw new Error("Email is required.");
  }

  const supabase = getSupabaseClient();
  const { error } = await supabase.from(waitlistTable).insert({
    email: normalizedEmail,
  });

  if (error) {
    const isDuplicate =
      error.code === "23505" ||
      error.message.toLowerCase().includes("duplicate") ||
      error.message.toLowerCase().includes("unique");

    if (isDuplicate) {
      return {
        alreadyJoined: true,
        emailFailed: false,
      };
    }

    throw error;
  }

  const { error: emailError } = await supabase.functions.invoke(waitlistEmailFunction, {
    body: {
      email: normalizedEmail,
      source: "website_waitlist",
    },
  });

  return {
    alreadyJoined: false,
    emailFailed: Boolean(emailError),
  };
}
