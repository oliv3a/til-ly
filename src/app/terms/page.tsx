import type { Metadata } from "next"
import PageShell from "@/components/PageShell"
import Link from "next/link"

export const metadata: Metadata = {
  title: "Terms of Service — til.ly",
}

export default function TermsPage() {
  return (
    <PageShell>
      <div className="max-w-2xl mx-auto py-10 space-y-6 text-muted-ink text-[0.85rem] leading-relaxed">
        <h1 className="text-xl font-bold text-ink">Terms of Service</h1>
        <p>
          By accessing or using til.ly, you agree to be bound by these Terms. If you do not agree, do not use the platform.
        </p>

        <h2 className="text-base font-semibold text-ink mt-8">1. Service Description</h2>
        <p>
          til.ly is an AI-powered study companion designed primarily for computer science students. The platform allows you to:
        </p>
        <ul className="list-disc pl-5 space-y-1">
          <li>Create daily study logs with text, notes, images, PDFs, and code</li>
          <li>Generate AI summaries and real-world explanations of your learning</li>
          <li>Build AI-generated learning roadmaps and track goals</li>
          <li>Track projects with checklists and updates</li>
          <li>Extract resume-ready skills and generate resumes</li>
          <li>Use AI mentoring features</li>
        </ul>

        <h2 className="text-base font-semibold text-ink mt-8">2. User Accounts</h2>
        <p>
          You are responsible for keeping your account credentials secure, providing accurate information, and for all activity that occurs under your account.
        </p>

        <h2 className="text-base font-semibold text-ink mt-8">3. User Content</h2>
        <p>
          You retain full ownership of everything you upload or create on til.ly — including study logs, projects, resumes, notes, images, PDFs, code, and any other content. til.ly does not claim ownership of your content.
        </p>
        <p>
          By submitting content, you grant til.ly permission to process and display it solely for the purpose of providing the platform's features.
        </p>

        <h2 className="text-base font-semibold text-ink mt-8">4. AI Features</h2>
        <p>
          til.ly uses AI (via OpenAI's API) to provide features including study log summaries, real-world explanations, learning roadmaps, resume generation, skills extraction, and AI mentor responses.
        </p>
        <p>
          AI-generated content may occasionally be inaccurate or incomplete. You should review important information before relying on it. AI output does not constitute professional educational, career, legal, or financial advice.
        </p>

        <h2 className="text-base font-semibold text-ink mt-8">5. Acceptable Use</h2>
        <p>You must not use til.ly to:</p>
        <ul className="list-disc pl-5 space-y-1">
          <li>Upload illegal or harmful content</li>
          <li>Upload malware or malicious code</li>
          <li>Attempt to disrupt or attack the service</li>
          <li>Misuse the platform or its features</li>
          <li>Spam or harass other users</li>
        </ul>
        <p>
          We reserve the right to suspend or remove accounts that violate these terms.
        </p>

        <h2 className="text-base font-semibold text-ink mt-8">6. Intellectual Property</h2>
        <p>
          <strong>You own</strong> your uploaded content, study logs, projects, resumes, and notes.
        </p>
        <p>
          <strong>til.ly owns</strong> the website, branding, logo, interface design, and source code (unless explicitly open-sourced).
        </p>

        <h2 className="text-base font-semibold text-ink mt-8">7. Third-Party Services</h2>
        <p>
          til.ly relies on trusted third-party services including OpenAI (AI processing), Neon (PostgreSQL database), and Vercel (hosting). These services operate under their own terms and privacy policies.
        </p>

        <h2 className="text-base font-semibold text-ink mt-8">8. Service Availability</h2>
        <p>
          While we make reasonable efforts to keep the platform available, we cannot guarantee uninterrupted service. The platform may occasionally be unavailable due to maintenance, updates, or technical issues.
        </p>

        <h2 className="text-base font-semibold text-ink mt-8">9. Disclaimer</h2>
        <p>
          til.ly is provided &quot;as is&quot; and &quot;as available.&quot; We make no guarantees regarding accuracy, availability, or suitability. til.ly is intended as a learning companion and should not be considered professional educational, career, legal, or financial advice.
        </p>

        <h2 className="text-base font-semibold text-ink mt-8">10. Limitation of Liability</h2>
        <p>
          To the maximum extent permitted by law, til.ly will not be liable for indirect or consequential damages resulting from your use of the platform.
        </p>

        <h2 className="text-base font-semibold text-ink mt-8">11. Privacy</h2>
        <p>
          Your use of til.ly is also governed by our <Link href="/privacy" className="underline underline-offset-2 text-warm-brown hover:text-muted-teal">Privacy Policy</Link>, which explains how we collect, use, and protect your data.
        </p>

        <h2 className="text-base font-semibold text-ink mt-8">12. Changes to These Terms</h2>
        <p>
          These Terms may be updated from time to time. Continued use of til.ly after updates constitutes acceptance of the revised Terms.
        </p>

        <h2 className="text-base font-semibold text-ink mt-8">13. Contact</h2>
        <p>
          For questions or concerns, email <strong>studywithtilly@gmail.com</strong>.
        </p>

        <p className="text-[0.65rem] text-muted-ink/40 pt-8">Last updated: July 2026</p>
      </div>
    </PageShell>
  )
}
