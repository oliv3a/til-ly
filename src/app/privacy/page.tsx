import type { Metadata } from "next"
import PageShell from "@/components/PageShell"

export const metadata: Metadata = {
  title: "Privacy Policy — KeizoKode",
}

export default function PrivacyPage() {
  return (
    <PageShell>
      <div className="max-w-2xl mx-auto py-10 space-y-6 text-muted-ink text-[0.85rem] leading-relaxed">
        <h1 className="text-xl font-bold text-ink">Privacy Policy</h1>
        <p>
          KeizoKode is a study-log platform for CS students. This policy explains what data we collect and how it is used.
        </p>

        <h2 className="text-base font-semibold text-ink mt-8">Data We Collect</h2>
        <ul className="list-disc pl-5 space-y-1">
          <li><strong>Account</strong> — email address and password (hashed) for authentication.</li>
          <li><strong>Study logs</strong> — daily progress entries you submit, including text content and any attached tags or skills.</li>
          <li><strong>Skills & XP</strong> — automatically derived from your study logs.</li>
          <li><strong>Goals</strong> — learning goals and progress you set.</li>
          <li><strong>Resume</strong> — generated resume data you choose to create.</li>
        </ul>

        <h2 className="text-base font-semibold text-ink mt-8">How We Use Data</h2>
        <ul className="list-disc pl-5 space-y-1">
          <li>To provide the service — display your logs, skills, goals, and portfolio.</li>
          <li>To generate AI summaries and skill extraction from your logs.</li>
          <li>To optionally display your portfolio publicly for recruiter discovery.</li>
        </ul>

        <h2 className="text-base font-semibold text-ink mt-8">Data Sharing</h2>
        <p>
          We do not sell your data. Your portfolio is visible to anyone with the link if you opt into public sharing. We use OpenAI API for AI features; OpenAI does not train on your data via API usage.
        </p>

        <h2 className="text-base font-semibold text-ink mt-8">Data Retention & Deletion</h2>
        <p>
          You can delete individual study logs at any time. To delete your entire account, contact us. Data is retained until you delete it or request account removal.
        </p>

        <h2 className="text-base font-semibold text-ink mt-8">Contact</h2>
        <p>
          For questions or deletion requests, reach out through the GitHub repository.
        </p>

        <p className="text-[0.65rem] text-muted-ink/40 pt-8">Last updated: July 2026</p>
      </div>
    </PageShell>
  )
}
