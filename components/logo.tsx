import { cn } from "@/lib/utils";

export const Logo = ({
  className,
  ...props
}: React.ComponentProps<"span">) => {
  return (
    <span
      className={cn("text-2xl font-semibold tracking-tight", className)}
      {...props}
    >
      free.<span className="text-sky-500">ai</span>
    </span>
  );
};
