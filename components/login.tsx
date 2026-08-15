"use client"

import { Button } from "@/components/ui/button"
import {
  browserLocalPersistence,
  GoogleAuthProvider,
  getRedirectResult,
  onAuthStateChanged,
  setPersistence,
  signInWithRedirect,
} from "firebase/auth"
import { auth } from "@/lib/firebase"
import { Logo } from "@/components/logo"
import { BackgroundPattern } from "./background-pattern"
import { useCallback, useEffect, useState } from "react"

const REDIRECT_PENDING_KEY = "free-ai:google-redirect-pending"

const Login = () => {
  const [isRedirecting, setIsRedirecting] = useState(false)
  const [errorMessage, setErrorMessage] = useState("")

  useEffect(() => {
    if (!auth) return
    let mounted = true
    let hasNavigated = false
    const redirectWasPending = window.sessionStorage.getItem(REDIRECT_PENDING_KEY) === "1"
    const clearRedirectMarker = () => window.sessionStorage.removeItem(REDIRECT_PENDING_KEY)
    const navigateToChat = () => {
      if (!mounted || hasNavigated) return
      hasNavigated = true
      clearRedirectMarker()
      // A full navigation guarantees that the freshly restored Firebase user
      // is available to AuthGuard before /chat renders.
      window.location.replace("/chat")
    }

    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (!mounted) return
      if (user) {
        navigateToChat()
      } else {
        setIsRedirecting(false)
      }
    })

    void (async () => {
      try {
        const result = await getRedirectResult(auth)
        if (result?.user || auth.currentUser) navigateToChat()
        else if (redirectWasPending && mounted) {
          clearRedirectMarker()
          setErrorMessage(
            "Google returned without a signed-in Firebase user. Redirect sign-in may require HTTPS on localhost."
          )
        }
      } catch (error: unknown) {
        if (!mounted) return
        clearRedirectMarker()
        setIsRedirecting(false)
        setErrorMessage(getAuthErrorMessage(error))
      }
    })()

    return () => {
      mounted = false
      unsubscribe()
    }
  }, [])

  const onLogin = useCallback(async () => {
    const fbAuth = auth
    if (isRedirecting) return
    if (!fbAuth) {
      setErrorMessage("Firebase Authentication is not configured for this deployment.")
      return
    }
    setErrorMessage("")
    setIsRedirecting(true)
    window.sessionStorage.setItem(REDIRECT_PENDING_KEY, "1")
    const provider = new GoogleAuthProvider()
    try {
      await setPersistence(fbAuth, browserLocalPersistence)
      await signInWithRedirect(fbAuth, provider)
    } catch (error: unknown) {
      window.sessionStorage.removeItem(REDIRECT_PENDING_KEY)
      setIsRedirecting(false)
      setErrorMessage(getAuthErrorMessage(error))
    }
  }, [isRedirecting])

  return (
    <div className="min-h-dvh flex items-center justify-center">
      <BackgroundPattern />

      <div className="relative max-w-sm w-full border rounded-3xl px-8 py-8 shadow-lg/5 dark:shadow-xl bg-linear-to-b from-muted/50 dark:from-transparent to-card overflow-hidden z-20">
        <div
          className="absolute inset-0 z-0 -top-px -left-px"
          style={{
            backgroundImage: `
        linear-gradient(to right, color-mix(in srgb, var(--card-foreground) 8%, transparent) 1px, transparent 1px),
        linear-gradient(to bottom, color-mix(in srgb, var(--card-foreground) 8%, transparent) 1px, transparent 1px)
      `,
            backgroundSize: "20px 20px",
            backgroundPosition: "0 0, 0 0",
            maskImage: `
        repeating-linear-gradient(
              to right,
              black 0px,
              black 3px,
              transparent 3px,
              transparent 8px
            ),
            repeating-linear-gradient(
              to bottom,
              black 0px,
              black 3px,
              transparent 3px,
              transparent 8px
            ),
            radial-gradient(ellipse 70% 50% at 50% 0%, #000 60%, transparent 100%)
      `,
            WebkitMaskImage: `
 repeating-linear-gradient(
              to right,
              black 0px,
              black 3px,
              transparent 3px,
              transparent 8px
            ),
            repeating-linear-gradient(
              to bottom,
              black 0px,
              black 3px,
              transparent 3px,
              transparent 8px
            ),
            radial-gradient(ellipse 70% 50% at 50% 0%, #000 60%, transparent 100%)
      `,
            maskComposite: "intersect",
            WebkitMaskComposite: "source-in",
          }}
        />

        <div className="relative isolate flex flex-col items-center">
          <Logo className="text-3xl user-select-none" />
          <p className="mt-4 text-xl font-semibold tracking-tight">
            Log in to Free.ai
          </p>
          <p className="mt-1 text-sm text-muted-foreground text-center">
            Sign in to chat and generate for free.
          </p>

          <Button
            type="button"
            className="mt-8 w-full gap-3 cursor-pointer"
            onClick={onLogin}
            disabled={isRedirecting}
          >
            <GoogleLogo />
            {isRedirecting ? "Redirecting to Google…" : "Continue with Google"}
          </Button>

          {errorMessage ? (
            <p role="alert" className="mt-3 text-xs text-destructive text-center">
              {errorMessage}
            </p>
          ) : null}

          <p className="mt-6 text-xs text-muted-foreground text-center">
            By continuing you agree to our{" "}
            <a href="/terms" className="underline hover:text-foreground transition-colors">Terms</a> and{" "}
            <a href="/privacy" className="underline hover:text-foreground transition-colors">Privacy Policy</a>.
          </p>
        </div>
      </div>
    </div>
  )
}

function getAuthErrorMessage(error: unknown): string {
  if (error && typeof error === "object" && "code" in error) {
    const code = String((error as { code?: unknown }).code)
    if (code === "auth/unauthorized-domain") {
      return "This domain is not enabled for Google sign-in. Add it to Firebase Authentication → Settings → Authorized domains."
    }
    if (code === "auth/popup-closed-by-user") {
      return "Sign-in was cancelled."
    }
  }
  return error instanceof Error ? error.message : "Google sign-in failed. Please try again."
}

const GoogleLogo = () => (
  <svg
    width="1.2em"
    height="1.2em"
    id="icon-google"
    viewBox="0 0 16 16"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className="inline-block shrink-0 align-sub text-inherit size-lg"
    aria-hidden
  >
    <g clipPath="url(#clip0)">
      <path
        d="M15.6823 8.18368C15.6823 7.63986 15.6382 7.0931 15.5442 6.55811H7.99829V9.63876H12.3194C12.1401 10.6323 11.564 11.5113 10.7203 12.0698V14.0687H13.2983C14.8122 12.6753 15.6823 10.6176 15.6823 8.18368Z"
        fill="#4285F4"
      ></path>
      <path
        d="M7.99812 16C10.1558 16 11.9753 15.2915 13.3011 14.0687L10.7231 12.0698C10.0058 12.5578 9.07988 12.8341 8.00106 12.8341C5.91398 12.8341 4.14436 11.426 3.50942 9.53296H0.849121V11.5936C2.2072 14.295 4.97332 16 7.99812 16Z"
        fill="#34A853"
      ></path>
      <path
        d="M3.50665 9.53295C3.17154 8.53938 3.17154 7.4635 3.50665 6.46993V4.4093H0.849292C-0.285376 6.66982 -0.285376 9.33306 0.849292 11.5936L3.50665 9.53295Z"
        fill="#FBBC04"
      ></path>
      <path
        d="M7.99812 3.16589C9.13867 3.14825 10.241 3.57743 11.067 4.36523L13.3511 2.0812C11.9048 0.723121 9.98526 -0.0235266 7.99812 -1.02057e-05C4.97332 -1.02057e-05 2.2071 1.70493 0.849121 4.40932L3.50648 6.46995C4.13848 4.57394 5.91104 3.16589 7.99812 3.16589Z"
        fill="#EA4335"
      ></path>
    </g>
    <defs>
      <clipPath id="clip0">
        <rect width="15.6825" height="16" fill="white"></rect>
      </clipPath>
    </defs>
  </svg>
)

export default Login
