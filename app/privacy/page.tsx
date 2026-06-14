import Navbar from "@/components/navbar"
import Footer from "@/components/footer"

export default function PrivacyPage() {
  return (
    <>
      <Navbar />
      <main className="pt-16 min-h-dvh">
        <div className="max-w-3xl mx-auto px-4 py-16">
        <h1 className="text-4xl font-bold tracking-tight mb-2">Privacy Policy</h1>
        <p className="text-muted-foreground mb-10 text-sm">Last updated: June 2026</p>

        <div className="space-y-6 text-sm leading-relaxed text-muted-foreground">
          <section className="space-y-2">
            <h2 className="text-lg font-semibold text-foreground">1. Information We Collect</h2>
            <p>When you use Free.ai, we collect:</p>
            <ul className="list-disc pl-5 space-y-1">
              <li><strong className="text-foreground">Account information:</strong> Your email address and display name from Google Sign-In.</li>
              <li><strong className="text-foreground">Chat data:</strong> Messages you send and receive, including any files you upload for processing.</li>
              <li><strong className="text-foreground">Usage data:</strong> Anonymous analytics about how you interact with the Service.</li>
            </ul>
          </section>

          <section className="space-y-2">
            <h2 className="text-lg font-semibold text-foreground">2. How We Use Your Information</h2>
            <p>We use your information to:</p>
            <ul className="list-disc pl-5 space-y-1">
              <li>Provide and improve the Service</li>
              <li>Sync your chat history across devices</li>
              <li>Authenticate your account</li>
              <li>Respond to your inquiries</li>
            </ul>
          </section>

          <section className="space-y-2">
            <h2 className="text-lg font-semibold text-foreground">3. Data Sharing</h2>
            <p>
              We do not sell your personal information. Chat messages are sent to third-party AI providers to generate responses. These providers process your messages according to their own privacy policies. We do not share your data with any other third parties.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-lg font-semibold text-foreground">4. Data Storage</h2>
            <p>
              Your chat history is stored securely using Firebase Firestore. Messages are retained until you delete them. You can delete individual chats or your entire account at any time.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-lg font-semibold text-foreground">5. Cookies</h2>
            <p>
              We use essential cookies for authentication and service functionality. We do not use tracking cookies or third-party advertising cookies.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-lg font-semibold text-foreground">6. Your Rights</h2>
            <p>You have the right to:</p>
            <ul className="list-disc pl-5 space-y-1">
              <li>Access your personal data</li>
              <li>Delete your account and associated data</li>
              <li>Export your chat history</li>
              <li>Withdraw consent at any time</li>
            </ul>
          </section>

          <section className="space-y-2">
            <h2 className="text-lg font-semibold text-foreground">7. Contact</h2>
            <p>
              For privacy-related inquiries, please contact us through our <a href="/contact" className="text-primary underline underline-offset-2">contact page</a>.
            </p>
          </section>
        </div>
        </div>
      </main>
      <Footer />
    </>
  )
}
