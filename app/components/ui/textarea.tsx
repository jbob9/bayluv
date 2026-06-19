import * as React from "react";
import { cn } from "~/lib/utils";
import { inputBase } from "./input";

export const Textarea = React.forwardRef<
  HTMLTextAreaElement,
  React.TextareaHTMLAttributes<HTMLTextAreaElement>
>(({ className, ...props }, ref) => (
  <textarea
    ref={ref}
    className={cn(inputBase, "min-h-28 resize-y py-3 leading-relaxed", className)}
    {...props}
  />
));
Textarea.displayName = "Textarea";
