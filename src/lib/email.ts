import { Resend } from "resend"

const resendApiKey = process.env.RESEND_API_KEY

export const resend = resendApiKey ? new Resend(resendApiKey) : null

export const RESEND_FROM = process.env.RESEND_FROM || "onboarding@resend.dev"
