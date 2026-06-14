import Navbar from "@/components/navbar"
import Footer from "@/components/footer"

export default function TermsPage() {
  return (
    <>
      <Navbar />
      <main className="pt-16 min-h-dvh">
        <div className="max-w-3xl mx-auto px-4 py-16">
        <h1 className="text-4xl font-bold tracking-tight mb-2">Terms of Service</h1>
        <p className="text-muted-foreground mb-10 text-sm">Last updated: June 2026</p>

        <div className="space-y-6 text-sm leading-relaxed text-muted-foreground">
          <section className="space-y-2">
            <h2 className="text-lg font-semibold text-foreground">1. Acceptance of Terms</h2>
            <p>
              By accessing or using Free.ai (&quot;the Service&quot;), you agree to be bound by these Terms of Service. If you do not agree, do not use the Service.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-lg font-semibold text-foreground">2. Description of Service</h2>
            <p>
              Free.ai provides a web-based interface that aggregates access to various third-party AI model providers. We do not host or operate the underlying AI models. The Service is provided &quot;as is&quot; without any warranty.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-lg font-semibold text-foreground">3. User Responsibilities</h2>
            <p>You agree to:</p>
            <ul className="list-disc pl-5 space-y-1">
              <li>Use the Service in compliance with all applicable laws</li>
              <li>Not use the Service for any illegal or harmful purposes</li>
              <li>Not attempt to abuse, overload, or compromise the Service</li>
              <li>Not generate content that violates the rights of others</li>
            </ul>
          </section>

          <section className="space-y-2">
            <h2 className="text-lg font-semibold text-foreground">4. Third-Party Services</h2>
            <p>
              Free.ai acts as an intermediary to third-party AI providers. Each provider has its own terms of service and usage policies. Free.ai is not responsible for the behavior, availability, or output of third-party models.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-lg font-semibold text-foreground">5. Limitation of Liability</h2>
            <p>
              Free.ai shall not be liable for any indirect, incidental, special, consequential, or punitive damages arising from your use of the Service. The Service is provided free of charge, and to the maximum extent permitted by law, we disclaim all liability.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-lg font-semibold text-foreground">6. Changes to Terms</h2>
            <p>
              We reserve the right to modify these terms at any time. Changes will be posted on this page, and continued use of the Service after changes constitutes acceptance of the new terms.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-lg font-semibold text-foreground">7. Contact</h2>
            <p>
              For questions about these terms, please contact us through our <a href="/contact" className="text-primary underline underline-offset-2">contact page</a>.
            </p>
          </section>
        </div>
        </div>
      </main>
      <Footer />
    </>
  )
}
