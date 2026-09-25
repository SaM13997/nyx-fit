import {
  useCallback,
  useEffect,
  useId,
  useRef,
  useState,
  type FormEvent,
} from "react";
import { motion, useReducedMotion } from "framer-motion";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Field, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";
import type { EmailAuthValues } from "@/lib/use-email-auth";
import { flowCopy } from "./config";

export type EmailAuthTone = "flow" | "login";

const EASE_HEIGHT: [number, number, number, number] = [0.77, 0, 0.175, 1];
const EASE_FADE: [number, number, number, number] = [0.23, 1, 0.32, 1];
const FADE_DURATION = 0.16;
const HEIGHT_DURATION = 0.22;
const STAGGER_DELAY = 0.04;
const FALLBACK_TRIGGER_HEIGHT = 44;

const toneClasses: Record<
  EmailAuthTone,
  {
    trigger: string;
    label: string;
    input: string;
    submit: string;
    collapse: string;
    error: string;
  }
> = {
  flow: {
    trigger:
      "w-full text-[15px] leading-5 font-semibold text-flow-ink-soft hover:text-flow-ink",
    label: "text-[13px] leading-4 font-semibold text-flow-ink",
    input:
      "h-11 rounded-md border-flow-line bg-flow-card px-3.5 text-[16px] text-flow-ink placeholder:text-flow-ink-faint focus-visible:border-flow-ink focus-visible:ring-flow-ink/20",
    submit: "w-full",
    collapse:
      "w-full text-[13px] leading-4 font-semibold text-flow-ink-soft hover:text-flow-ink",
    error: "text-flow-tomato",
  },
  login: {
    trigger: "w-full text-sm font-semibold text-zinc-300 hover:text-white",
    label: "text-sm font-medium text-zinc-300",
    input:
      "h-12 rounded-xl border-white/10 bg-zinc-900/60 px-4 text-base text-white placeholder:text-zinc-500 focus-visible:border-purple-500 focus-visible:ring-purple-500/30",
    submit:
      "h-12 w-full rounded-xl bg-purple-600 text-base font-bold text-white shadow-lg shadow-purple-900/20 hover:bg-purple-500",
    collapse: "w-full text-xs text-zinc-400 hover:text-white",
    error: "text-red-200",
  },
};

function EmailAuthField({
  id,
  label,
  tone,
  ...props
}: React.ComponentProps<"input"> & {
  id: string;
  label: string;
  tone: EmailAuthTone;
}) {
  return (
    <Field className="gap-1.5">
      <FieldLabel htmlFor={id} className={toneClasses[tone].label}>
        {label}
      </FieldLabel>
      <Input id={id} className={toneClasses[tone].input} {...props} />
    </Field>
  );
}

export function EmailAuthReveal({
  mode,
  onSubmit,
  errorMessage,
  isSubmitting,
  onCollapse,
  tone = "flow",
  className,
}: {
  mode: "signup" | "signin";
  onSubmit: (values: EmailAuthValues) => void;
  errorMessage: string | null;
  isSubmitting: boolean;
  onCollapse: () => void;
  tone?: EmailAuthTone;
  className?: string;
}) {
  const reduceMotion = useReducedMotion();
  const formId = useId();
  const triggerRef = useRef<HTMLButtonElement | null>(null);
  const emailInputRef = useRef<HTMLInputElement | null>(null);
  const interactedRef = useRef(false);
  const [open, setOpen] = useState(false);
  const [triggerHeight, setTriggerHeight] = useState(FALLBACK_TRIGGER_HEIGHT);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [localError, setLocalError] = useState<string | null>(null);
  const copy = flowCopy.save.emailForm;

  useEffect(() => {
    const node = triggerRef.current;
    if (node === null || node.offsetHeight === 0) return;
    setTriggerHeight(node.offsetHeight);
  }, []);

  useEffect(() => {
    if (open) {
      interactedRef.current = true;
      emailInputRef.current?.focus({ preventScroll: true });
      return;
    }
    if (interactedRef.current) {
      triggerRef.current?.focus({ preventScroll: true });
    }
  }, [open]);

  const handleCollapse = useCallback(() => {
    setOpen(false);
    setLocalError(null);
    onCollapse();
  }, [onCollapse]);

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (isSubmitting) return;
    const trimmedEmail = email.trim();
    const trimmedName = name.trim();
    if (trimmedEmail.length === 0) {
      setLocalError(copy.emailRequired);
      return;
    }
    if (password.length === 0) {
      setLocalError(copy.passwordRequired);
      return;
    }
    setLocalError(null);
    onSubmit(
      mode === "signup" && trimmedName.length > 0
        ? { email: trimmedEmail, password, name: trimmedName }
        : { email: trimmedEmail, password },
    );
  };

  const shownError = localError ?? errorMessage;
  const submitLabel = isSubmitting
    ? copy.submitting[mode]
    : shownError !== null
      ? copy.tryAgain
      : copy.submit[mode];

  const fieldMotion = (index: number) => ({
    initial: false,
    animate: open ? { opacity: 1 } : { opacity: 0 },
    transition: {
      duration: FADE_DURATION,
      ease: EASE_FADE,
      delay: reduceMotion || !open ? 0 : index * STAGGER_DELAY,
    },
  });

  return (
    <div className={cn("relative", className)}>
      <motion.div
        initial={false}
        animate={{ height: open ? "auto" : triggerHeight }}
        transition={
          reduceMotion
            ? { duration: 0 }
            : { duration: HEIGHT_DURATION, ease: EASE_HEIGHT }
        }
        className="relative overflow-hidden"
      >
        <motion.div
          aria-hidden={open}
          inert={open}
          initial={false}
          animate={{ opacity: open ? 0 : 1 }}
          transition={{ duration: FADE_DURATION, ease: EASE_FADE }}
          className={cn(
            "absolute inset-x-0 top-0",
            open && "pointer-events-none",
          )}
        >
          <Button
            ref={triggerRef}
            type="button"
            variant="link"
            aria-expanded={open}
            aria-controls={formId}
            onClick={() => setOpen(true)}
            className={cn("min-h-11", toneClasses[tone].trigger)}
          >
            {flowCopy.save.emailAction[mode]}
          </Button>
        </motion.div>
        <motion.div
          id={formId}
          aria-hidden={!open}
          inert={!open}
          initial={false}
          animate={open ? { opacity: 1, y: 0 } : { opacity: 0, y: 8 }}
          transition={{ duration: FADE_DURATION, ease: EASE_FADE }}
          className={cn("pt-2", !open && "pointer-events-none")}
        >
          <form
            noValidate
            onSubmit={handleSubmit}
            className="flex flex-col gap-4"
          >
            {mode === "signup" ? (
              <motion.div {...fieldMotion(0)}>
                <EmailAuthField
                  id={`${formId}-name`}
                  label={copy.nameLabel}
                  tone={tone}
                  name="name"
                  type="text"
                  autoComplete="name"
                  placeholder={copy.namePlaceholder}
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  disabled={isSubmitting}
                />
              </motion.div>
            ) : null}
            <motion.div {...fieldMotion(mode === "signup" ? 1 : 0)}>
              <EmailAuthField
                ref={emailInputRef}
                id={`${formId}-email`}
                label={copy.emailLabel}
                tone={tone}
                name="email"
                type="email"
                inputMode="email"
                autoComplete="email"
                placeholder={copy.emailPlaceholder}
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                disabled={isSubmitting}
              />
            </motion.div>
            <motion.div {...fieldMotion(mode === "signup" ? 2 : 1)}>
              <EmailAuthField
                id={`${formId}-password`}
                label={copy.passwordLabel}
                tone={tone}
                name="password"
                type="password"
                autoComplete={
                  mode === "signup" ? "new-password" : "current-password"
                }
                placeholder={copy.passwordPlaceholder[mode]}
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                disabled={isSubmitting}
              />
            </motion.div>
            {shownError ? (
              <p
                role="alert"
                className={cn(
                  "text-sm leading-5 break-words",
                  toneClasses[tone].error,
                )}
              >
                {shownError}
              </p>
            ) : null}
            <Button
              type="submit"
              size={tone === "flow" ? "xl" : "default"}
              disabled={isSubmitting}
              className={toneClasses[tone].submit}
            >
              {isSubmitting ? (
                <>
                  <Spinner aria-hidden="true" className="size-5" />
                  <span role="status">{submitLabel}</span>
                </>
              ) : (
                submitLabel
              )}
            </Button>
            <Button
              type="button"
              variant="link"
              onClick={handleCollapse}
              className={cn(
                "min-h-11 self-center",
                toneClasses[tone].collapse,
              )}
            >
              {copy.collapse}
            </Button>
          </form>
        </motion.div>
      </motion.div>
    </div>
  );
}
