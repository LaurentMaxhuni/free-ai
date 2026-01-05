"use client";

/**
 * @author: @kokonutui
 * @description: AI Prompt Input
 * @version: 1.0.0
 * @date: 2025-06-26
 * @license: MIT
 * @website: https://kokonutui.com
 * @github: https://github.com/kokonut-labs/kokonutui
 */

import { ArrowRight, Bot, Check, ChevronDown, Paperclip } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Textarea } from "@/components/ui/textarea";
import { useAutoResizeTextarea } from "@/hooks/use-auto-resize-textarea";
import { cn } from "@/lib/utils";

const AI_MODELS = [
  "GPT OSS 120B",
  "GPT OSS 20B",
  "Llama 4 Maverick 17B 128E",
  "Groq Compound",
  "Qwen3-32B",
];

const OPENAI_SVG = (
  <div>
    <svg
      aria-label="o3-mini icon"
      className="block dark:hidden h-4 w-4"
      preserveAspectRatio="xMidYMid"
      viewBox="0 0 256 260"
      xmlns="http://www.w3.org/2000/svg"
    >
      <title>OpenAI Icon Light</title>
      <path d="M239.184 106.203a64.716 64.716 0 0 0-5.576-53.103C219.452 28.459 191 15.784 163.213 21.74A65.586 65.586 0 0 0 52.096 45.22a64.716 64.716 0 0 0-43.23 31.36c-14.31 24.602-11.061 55.634 8.033 76.74a64.665 64.665 0 0 0 5.525 53.102c14.174 24.65 42.644 37.324 70.446 31.36a64.72 64.72 0 0 0 48.754 21.744c28.481.025 53.714-18.361 62.414-45.481a64.767 64.767 0 0 0 43.229-31.36c14.137-24.558 10.875-55.423-8.083-76.483Zm-97.56 136.338a48.397 48.397 0 0 1-31.105-11.255l1.535-.87 51.67-29.825a8.595 8.595 0 0 0 4.247-7.367v-72.85l21.845 12.636c.218.111.37.32.409.563v60.367c-.056 26.818-21.783 48.545-48.601 48.601Zm-104.466-44.61a48.345 48.345 0 0 1-5.781-32.589l1.534.921 51.722 29.826a8.339 8.339 0 0 0 8.441 0l63.181-36.425v25.221a.87.87 0 0 1-.358.665l-52.335 30.184c-23.257 13.398-52.97 5.431-66.404-17.803ZM23.549 85.38a48.499 48.499 0 0 1 25.58-21.333v61.39a8.288 8.288 0 0 0 4.195 7.316l62.874 36.272-21.845 12.636a.819.819 0 0 1-.767 0L41.353 151.53c-23.211-13.454-31.171-43.144-17.804-66.405v.256Zm179.466 41.695-63.08-36.63L161.73 77.86a.819.819 0 0 1 .768 0l52.233 30.184a48.6 48.6 0 0 1-7.316 87.635v-61.391a8.544 8.544 0 0 0-4.4-7.213Zm21.742-32.69-1.535-.922-51.619-30.081a8.39 8.39 0 0 0-8.492 0L99.98 99.808V74.587a.716.716 0 0 1 .307-.665l52.233-30.133a48.652 48.652 0 0 1 72.236 50.391v.205ZM88.061 139.097l-21.845-12.585a.87.87 0 0 1-.41-.614V65.685a48.652 48.652 0 0 1 79.757-37.346l-1.535.87-51.67 29.825a8.595 8.595 0 0 0-4.246 7.367l-.051 72.697Zm11.868-25.58 28.138-16.217 28.188 16.218v32.434l-28.086 16.218-28.188-16.218-.052-32.434Z" />
    </svg>
    <svg
      aria-label="o3-mini icon"
      className="hidden dark:block h-4 w-4"
      preserveAspectRatio="xMidYMid"
      viewBox="0 0 256 260"
      xmlns="http://www.w3.org/2000/svg"
    >
      <title>OpenAI Icon Dark</title>
      <path
        d="M239.184 106.203a64.716 64.716 0 0 0-5.576-53.103C219.452 28.459 191 15.784 163.213 21.74A65.586 65.586 0 0 0 52.096 45.22a64.716 64.716 0 0 0-43.23 31.36c-14.31 24.602-11.061 55.634 8.033 76.74a64.665 64.665 0 0 0 5.525 53.102c14.174 24.65 42.644 37.324 70.446 31.36a64.72 64.72 0 0 0 48.754 21.744c28.481.025 53.714-18.361 62.414-45.481a64.767 64.767 0 0 0 43.229-31.36c14.137-24.558 10.875-55.423-8.083-76.483Zm-97.56 136.338a48.397 48.397 0 0 1-31.105-11.255l1.535-.87 51.67-29.825a8.595 8.595 0 0 0 4.247-7.367v-72.85l21.845 12.636c.218.111.37.32.409.563v60.367c-.056 26.818-21.783 48.545-48.601 48.601Zm-104.466-44.61a48.345 48.345 0 0 1-5.781-32.589l1.534.921 51.722 29.826a8.339 8.339 0 0 0 8.441 0l63.181-36.425v25.221a.87.87 0 0 1-.358.665l-52.335 30.184c-23.257 13.398-52.97 5.431-66.404-17.803ZM23.549 85.38a48.499 48.499 0 0 1 25.58-21.333v61.39a8.288 8.288 0 0 0 4.195 7.316l62.874 36.272-21.845 12.636a.819.819 0 0 1-.767 0L41.353 151.53c-23.211-13.454-31.171-43.144-17.804-66.405v.256Zm179.466 41.695-63.08-36.63L161.73 77.86a.819.819 0 0 1 .768 0l52.233 30.184a48.6 48.6 0 0 1-7.316 87.635v-61.391a8.544 8.544 0 0 0-4.4-7.213Zm21.742-32.69-1.535-.922-51.619-30.081a8.39 8.39 0 0 0-8.492 0L99.98 99.808V74.587a.716.716 0 0 1 .307-.665l52.233-30.133a48.652 48.652 0 0 1 72.236 50.391v.205ZM88.061 139.097l-21.845-12.585a.87.87 0 0 1-.41-.614V65.685a48.652 48.652 0 0 1 79.757-37.346l-1.535.87-51.67 29.825a8.595 8.595 0 0 0-4.246 7.367l-.051 72.697Zm11.868-25.58 28.138-16.217 28.188 16.218v32.434l-28.086 16.218-28.188-16.218-.052-32.434Z"
        fill="#fff"
      />
    </svg>
  </div>
);

const QWEN_SVG = (
  <svg
    aria-label="Llama icon"
    className="h-4 w-4"
    viewBox="0 0 200 200"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path
      d="M174.82 108.75L155.38 75L165.64 57.75C166.46 56.31 166.46 54.53 165.64 53.09L155.38 35.84C154.86 34.91 153.87 34.33 152.78 34.33H114.88L106.14 19.03C105.62 18.1 104.63 17.52 103.54 17.52H83.3C82.21 17.52 81.22 18.1 80.7 19.03L61.26 52.77H41.02C39.93 52.77 38.94 53.35 38.42 54.28L28.16 71.53C27.34 72.97 27.34 74.75 28.16 76.19L45.52 107.5L36.78 122.8C35.96 124.24 35.96 126.02 36.78 127.46L47.04 144.71C47.56 145.64 48.55 146.22 49.64 146.22H87.54L96.28 161.52C96.8 162.45 97.79 163.03 98.88 163.03H119.12C120.21 163.03 121.2 162.45 121.72 161.52L141.16 127.78H158.52C159.61 127.78 160.6 127.2 161.12 126.27L171.38 109.02C172.2 107.58 172.2 105.8 171.38 104.36L174.82 108.75Z"
      fill="url(#llama-paint0)"
    />
    <path
      d="M119.12 163.03H98.88L87.54 144.71H49.64L61.26 126.39H80.7L38.42 55.29H61.26L83.3 19.03L93.56 37.35L83.3 55.29H161.58L151.32 72.54L170.76 106.28H151.32L141.16 88.34L101.18 163.03H119.12Z"
      fill="#fff"
    />
    <path
      d="M127.86 79.83H76.14L101.18 122.11L127.86 79.83Z"
      fill="url(#llama-paint1)"
    />
    <defs>
      <radialGradient
        id="llama-paint0"
        cx="0"
        cy="0"
        r="1"
        gradientUnits="userSpaceOnUse"
        gradientTransform="translate(100 100) rotate(90) scale(100)"
      >
        <stop stopColor="#665CEE" />
        <stop offset="1" stopColor="#332E91" />
      </radialGradient>
      <radialGradient
        id="llama-paint1"
        cx="0"
        cy="0"
        r="1"
        gradientUnits="userSpaceOnUse"
        gradientTransform="translate(100 100) rotate(90) scale(100)"
      >
        <stop stopColor="#665CEE" />
        <stop offset="1" stopColor="#332E91" />
      </radialGradient>
    </defs>
  </svg>
);

const LLAMA_SVG = (
  <svg
    aria-label="Groq icon"
    className="h-4 w-4"
    style={{ flex: "none", lineHeight: 1 }}
    viewBox="0 0 24 24"
    xmlns="http://www.w3.org/2000/svg"
  >
    <title>Meta</title>
    <path
      d="M6.897 4h-.024l-.031 2.615h.022c1.715 0 3.046 1.357 5.94 6.246l.175.297.012.02 1.62-2.438-.012-.019a48.763 48.763 0 00-1.098-1.716 28.01 28.01 0 00-1.175-1.629C10.413 4.932 8.812 4 6.896 4z"
      fill="url(#groq-fill-0)"
    />
    <path
      d="M6.873 4C4.95 4.01 3.247 5.258 2.02 7.17a4.352 4.352 0 00-.01.017l2.254 1.231.011-.017c.718-1.083 1.61-1.774 2.568-1.785h.021L6.896 4h-.023z"
      fill="url(#groq-fill-1)"
    />
    <path
      d="M2.019 7.17l-.011.017C1.2 8.447.598 9.995.274 11.664l-.005.022 2.534.6.004-.022c.27-1.467.786-2.828 1.456-3.845l.011-.017L2.02 7.17z"
      fill="url(#groq-fill-2)"
    />
    <path
      d="M2.807 12.264l-2.533-.6-.005.022c-.177.918-.267 1.851-.269 2.786v.023l2.598.233v-.023a12.591 12.591 0 01.21-2.44z"
      fill="url(#groq-fill-3)"
    />
    <path
      d="M2.677 15.537a5.462 5.462 0 01-.079-.813v-.022L0 14.468v.024a8.89 8.89 0 00.146 1.652l2.535-.585a4.106 4.106 0 01-.004-.022z"
      fill="url(#groq-fill-4)"
    />
    <path
      d="M3.27 16.89c-.284-.31-.484-.756-.589-1.328l-.004-.021-2.535.585.004.021c.192 1.01.568 1.85 1.106 2.487l.014.017 2.018-1.745a2.106 2.106 0 01-.015-.016z"
      fill="url(#groq-fill-5)"
    />
    <path
      d="M10.78 9.654c-1.528 2.35-2.454 3.825-2.454 3.825-2.035 3.2-2.739 3.917-3.871 3.917a1.545 1.545 0 01-1.186-.508l-2.017 1.744.014.017C2.01 19.518 3.058 20 4.356 20c1.963 0 3.374-.928 5.884-5.33l1.766-3.13a41.283 41.283 0 00-1.227-1.886z"
      fill="#0082FB"
    />
    <path
      d="M13.502 5.946l-.016.016c-.4.43-.786.908-1.16 1.416.378.483.768 1.024 1.175 1.63.48-.743.928-1.345 1.367-1.807l.016-.016-1.382-1.24z"
      fill="url(#groq-fill-6)"
    />
    <path
      d="M20.918 5.713C19.853 4.633 18.583 4 17.225 4c-1.432 0-2.637.787-3.723 1.944l-.016.016 1.382 1.24.016-.017c.715-.747 1.408-1.12 2.176-1.12.826 0 1.6.39 2.27 1.075l.015.016 1.589-1.425-.016-.016z"
      fill="#0082FB"
    />
    <path
      d="M23.998 14.125c-.06-3.467-1.27-6.566-3.064-8.396l-.016-.016-1.588 1.424.015.016c1.35 1.392 2.277 3.98 2.361 6.971v.023h2.292v-.022z"
      fill="url(#groq-fill-7)"
    />
    <path
      d="M23.998 14.15v-.023h-2.292v.022c.004.14.006.282.006.424 0 .815-.121 1.474-.368 1.95l-.011.022 1.708 1.782.013-.02c.62-.96.946-2.293.946-3.91 0-.083 0-.165-.002-.247z"
      fill="url(#groq-fill-8)"
    />
    <path
      d="M21.344 16.52l-.011.02c-.214.402-.519.67-.917.787l.778 2.462a3.493 3.493 0 00.438-.182 3.558 3.558 0 001.366-1.218l.044-.065.012-.02-1.71-1.784z"
      fill="url(#groq-fill-9)"
    />
    <path
      d="M19.92 17.393c-.262 0-.492-.039-.718-.14l-.798 2.522c.449.153.927.222 1.46.222.492 0 .943-.073 1.352-.215l-.78-2.462c-.167.05-.341.075-.517.073z"
      fill="url(#groq-fill-10)"
    />
    <path
      d="M18.323 16.534l-.014-.017-1.836 1.914.016.017c.637.682 1.246 1.105 1.937 1.337l.797-2.52c-.291-.125-.573-.353-.9-.731z"
      fill="url(#groq-fill-11)"
    />
    <path
      d="M18.309 16.515c-.55-.642-1.232-1.712-2.303-3.44l-1.396-2.336-.011-.02-1.62 2.438.012.02.989 1.668c.959 1.61 1.74 2.774 2.493 3.585l.016.016 1.834-1.914a2.353 2.353 0 01-.014-.017z"
      fill="url(#groq-fill-12)"
    />
    <defs>
      <linearGradient
        id="groq-fill-0"
        x1="75.897%"
        x2="26.312%"
        y1="89.199%"
        y2="12.194%"
      >
        <stop offset=".06%" stopColor="#0867DF" />
        <stop offset="45.39%" stopColor="#0668E1" />
        <stop offset="85.91%" stopColor="#0064E0" />
      </linearGradient>
      <linearGradient
        id="groq-fill-1"
        x1="21.67%"
        x2="97.068%"
        y1="75.874%"
        y2="23.985%"
      >
        <stop offset="13.23%" stopColor="#0064DF" />
        <stop offset="99.88%" stopColor="#0064E0" />
      </linearGradient>
      <linearGradient
        id="groq-fill-2"
        x1="38.263%"
        x2="60.895%"
        y1="89.127%"
        y2="16.131%"
      >
        <stop offset="1.47%" stopColor="#0072EC" />
        <stop offset="68.81%" stopColor="#0064DF" />
      </linearGradient>
      <linearGradient
        id="groq-fill-3"
        x1="47.032%"
        x2="52.15%"
        y1="90.19%"
        y2="15.745%"
      >
        <stop offset="7.31%" stopColor="#007CF6" />
        <stop offset="99.43%" stopColor="#0072EC" />
      </linearGradient>
      <linearGradient
        id="groq-fill-4"
        x1="52.155%"
        x2="47.591%"
        y1="58.301%"
        y2="37.004%"
      >
        <stop offset="7.31%" stopColor="#007FF9" />
        <stop offset="100%" stopColor="#007CF6" />
      </linearGradient>
      <linearGradient
        id="groq-fill-5"
        x1="37.689%"
        x2="61.961%"
        y1="12.502%"
        y2="63.624%"
      >
        <stop offset="7.31%" stopColor="#007FF9" />
        <stop offset="100%" stopColor="#0082FB" />
      </linearGradient>
      <linearGradient
        id="groq-fill-6"
        x1="34.808%"
        x2="62.313%"
        y1="68.859%"
        y2="23.174%"
      >
        <stop offset="27.99%" stopColor="#007FF8" />
        <stop offset="91.41%" stopColor="#0082FB" />
      </linearGradient>
      <linearGradient
        id="groq-fill-7"
        x1="43.762%"
        x2="57.602%"
        y1="6.235%"
        y2="98.514%"
      >
        <stop offset="0%" stopColor="#0082FB" />
        <stop offset="99.95%" stopColor="#0081FA" />
      </linearGradient>
      <linearGradient
        id="groq-fill-8"
        x1="60.055%"
        x2="39.88%"
        y1="4.661%"
        y2="69.077%"
      >
        <stop offset="6.19%" stopColor="#0081FA" />
        <stop offset="100%" stopColor="#0080F9" />
      </linearGradient>
      <linearGradient
        id="groq-fill-9"
        x1="30.282%"
        x2="61.081%"
        y1="59.32%"
        y2="33.244%"
      >
        <stop offset="0%" stopColor="#027AF3" />
        <stop offset="100%" stopColor="#0080F9" />
      </linearGradient>
      <linearGradient
        id="groq-fill-10"
        x1="20.433%"
        x2="82.112%"
        y1="50.001%"
        y2="50.001%"
      >
        <stop offset="0%" stopColor="#0377EF" />
        <stop offset="99.94%" stopColor="#0279F1" />
      </linearGradient>
      <linearGradient
        id="groq-fill-11"
        x1="40.303%"
        x2="72.394%"
        y1="35.298%"
        y2="57.811%"
      >
        <stop offset=".19%" stopColor="#0471E9" />
        <stop offset="100%" stopColor="#0377EF" />
      </linearGradient>
      <linearGradient
        id="groq-fill-12"
        x1="32.254%"
        x2="68.003%"
        y1="19.719%"
        y2="84.908%"
      >
        <stop offset="27.65%" stopColor="#0867DF" />
        <stop offset="100%" stopColor="#0471E9" />
      </linearGradient>
    </defs>
  </svg>
);

const GROQ_SVG = (
  <svg
    aria-label="Qwen icon"
    className="h-4 w-4"
    viewBox="0 0 26.3 26.3"
    xmlns="http://www.w3.org/2000/svg"
  >
    <circle cx="13.15" cy="13.15" r="13.15" fill="#f05237" />
    <path
      d="M13.17 6.88a4.43 4.43 0 0 0 0 8.85h1.45V14.07H13.17a2.77 2.77 0 1 1 2.77-2.76v4.07a2.74 2.74 0 0 1-4.67 2L10.1 18.51a4.37 4.37 0 0 0 3.07 1.29h.06a4.42 4.42 0 0 0 4.36-4.4V11.2a4.43 4.43 0 0 0-4.42-4.32"
      fill="#fff"
    />
  </svg>
);

export const MODEL_ICONS: Record<string, JSX.Element> = {
  "GPT OSS 120B": OPENAI_SVG,
  "GPT OSS 20B": OPENAI_SVG,
  "Llama 4 Maverick 17B 128E": LLAMA_SVG,
  "Groq Compound": GROQ_SVG,
  "Qwen3-32B": QWEN_SVG,
};

type AIPromptProps = {
  onSend?: (value: string, model: string) => void;
  containerClassName?: string;
};

export default function AI_Prompt({ onSend, containerClassName }: AIPromptProps) {
  const [value, setValue] = useState("");
  const { textareaRef, adjustHeight } = useAutoResizeTextarea({
    minHeight: 72,
    maxHeight: 300,
  });
  const [selectedModel, setSelectedModel] = useState(AI_MODELS[0]);

  const handleSend = () => {
    const trimmed = value.trim();
    if (!trimmed) {
      return;
    }
    onSend?.(trimmed, selectedModel);
    setValue("");
    adjustHeight(true);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className={cn("w-3/6 py-4", containerClassName)}>
      <div className="rounded-2xl bg-black/5 p-1.5 dark:bg-white/5">
        <div className="relative">
          <div className="relative flex flex-col">
            <div className="overflow-y-auto" style={{ maxHeight: "400px" }}>
              <Textarea
                className={cn(
                  "w-full resize-none rounded-xl rounded-b-none border-none bg-black/5 px-4 py-3 placeholder:text-black/70 focus-visible:ring-0 focus-visible:ring-offset-0 dark:bg-white/5 dark:text-white dark:placeholder:text-white/70",
                  "min-h-18"
                )}
                id="ai-input-15"
                onChange={(e) => {
                  setValue(e.target.value);
                  adjustHeight();
                }}
                onKeyDown={handleKeyDown}
                placeholder={"What can I do for you?"}
                ref={textareaRef}
                value={value}
              />
            </div>

            <div className="flex h-14 items-center rounded-b-xl bg-black/5 dark:bg-white/5">
              <div className="absolute right-3 bottom-3 left-3 flex w-[calc(100%-24px)] items-center justify-between">
                <div className="flex items-center gap-2">
                  <DropdownMenu>
                    <DropdownMenuTrigger render={<Button className="flex h-8 items-center gap-1 rounded-md pr-2 pl-2 text-xs hover:bg-black/10 focus-visible:ring-1 focus-visible:ring-blue-500 focus-visible:ring-offset-0 dark:text-white dark:hover:bg-white/10 cursor-pointer" variant="ghost" />}><AnimatePresence mode="wait">
                                                                <motion.div
                                                                  animate={{
                                                                    opacity: 1,
                                                                    y: 0,
                                                                  }}
                                                                  className="flex items-center gap-1"
                                                                  exit={{
                                                                    opacity: 0,
                                                                    y: 5,
                                                                  }}
                                                                  initial={{
                                                                    opacity: 0,
                                                                    y: -5,
                                                                  }}
                                                                  key={selectedModel}
                                                                  transition={{
                                                                    duration: 0.15,
                                                                  }}
                                                                >
                                                                  {MODEL_ICONS[selectedModel] ?? (
                                                                    <Bot className="h-4 w-4 opacity-50" />
                                                                  )}
                                                                  {selectedModel}
                                                                  <ChevronDown className="h-3 w-3 opacity-50" />
                                                                </motion.div>
                                                              </AnimatePresence></DropdownMenuTrigger>
                    <DropdownMenuContent
                      className={cn(
                        "min-w-40",
                        "border-black/10 dark:border-white/10",
                      )}
                    >
                      {AI_MODELS.map((model) => (
                        <DropdownMenuItem
                          className="flex items-center justify-between gap-2 cursor-pointer"
                          key={model}
                          onClick={() => setSelectedModel(model)}
                        >
                          <div className="flex items-center gap-2">
                            {MODEL_ICONS[model] ?? (
                              <Bot className="h-4 w-4 opacity-50" />
                            )}
                            <span>{model}</span>
                          </div>
                          {selectedModel === model && (
                            <Check className="h-4 w-4 text-blue-500" />
                          )}
                        </DropdownMenuItem>
                      ))}
                    </DropdownMenuContent>
                  </DropdownMenu>
                  <div className="mx-0.5 h-4 w-px bg-black/10 dark:bg-white/10" />
                  <label
                    aria-label="Attach file"
                    className={cn(
                      "cursor-pointer rounded-lg bg-black/5 p-2 dark:bg-white/5",
                      "hover:bg-black/10 focus-visible:ring-1 focus-visible:ring-blue-500 focus-visible:ring-offset-0 dark:hover:bg-white/10",
                      "text-black/40 hover:text-black dark:text-white/40 dark:hover:text-white"
                    )}
                  >
                    <input className="hidden" type="file" />
                    <Paperclip className="h-4 w-4 transition-colors" />
                  </label>
                </div>
                <button
                  aria-label="Send message"
                  className={cn(
                    "rounded-lg bg-black/5 p-2 dark:bg-white/5",
                    "hover:bg-black/10 focus-visible:ring-1 focus-visible:ring-blue-500 focus-visible:ring-offset-0 dark:hover:bg-white/10 cursor-pointer"
                  )}
                  disabled={!value.trim()}
                  type="button"
                  onClick={handleSend}
                >
                  <ArrowRight
                    className={cn(
                      "h-4 w-4 transition-opacity duration-200 dark:text-white",
                      value.trim() ? "opacity-100" : "opacity-30"
                    )}
                  />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
