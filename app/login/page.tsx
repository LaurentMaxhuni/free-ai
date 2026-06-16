import type { Metadata } from "next"
import Login from "@/components/login"

export const dynamic = "force-dynamic"

export const metadata: Metadata = {
  title: "Log In",
  description:
    "Sign in to Free.ai and start using free AI chat and image generation instantly. No credit card required.",
  alternates: {
    canonical: "https://free-ai-lm.vercel.app/login",
  },
}

const LoginPage = () => {
  return <Login />
}

export default LoginPage
