import { createFileRoute } from "@tanstack/react-router";
import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import ReactMarkdown from "react-markdown";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import {
  listChatMessages,
  sendChatMessage,
  regenerateLastReply,
  continueLastReply,
  clearConversation,
  type ChatMessage,
} from "@/lib/chat.functions";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  ArrowDown,
  Check,
  Copy,
  CornerDownLeft,
  Loader2,
  MessageSquarePlus,
  RefreshCw,
  Sparkles,
  TextQuote,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_app/chat")({
  head: () => ({
    meta: [
      { title: "AI Chat — Proposly AI" },
      {
        name: "description",
        content:
          "Chat continuously with Proposly AI to refine proposals, cover letters and client replies without losing context.",
      },
      { property: "og:title", content: "AI Chat — Proposly AI" },
      {
        property: "og:description",
        content: "One continuous conversation with your freelance proposal assistant.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: ChatPage,
});

const STORAGE_KEY = "proposly.chat.conversation";
const SUGGESTIONS = [
  "Rewrite my proposal to sound more confident",
  "Draft a follow-up message for a client who went quiet",
  "How should I price a 3-week Webflow project?",
];

function timeLabel(iso: string) {
  const d = new Date(iso);
  return d.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
}

function dayLabel(iso: string) {
  const d = new Date(iso);
  const today = new Date();
  const isToday = d.toDateString() === today.toDateString();
  if (isToday) return "Today";
  const yesterday = new Date(today.getTime() - 86_400_000);
  if (d.toDateString() === yesterday.toDateString()) return "Yesterday";
  return d.toLocaleDateString([], { month: "short", day: "numeric" });
}

function ChatPage() {
  const listFn = useServerFn(listChatMessages);
  const sendFn = useServerFn(sendChatMessage);
  const regenFn = useServerFn(regenerateLastReply);
  const continueFn = useServerFn(continueLastReply);
  const clearFn = useServerFn(clearConversation);

  const [convId, setConvId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [pendingUser, setPendingUser] = useState<string | null>(null);
  const [streaming, setStreaming] = useState<string | null>(null);
  const [atBottom, setAtBottom] = useState(true);

  const scrollerRef = useRef<HTMLDivElement | null>(null);
  const bottomRef = useRef<HTMLDivElement | null>(null);
  const inputRef = useRef<HTMLTextAreaElement | null>(null);

  // Restore the last active conversation for this browser (server is source of truth).
  useEffect(() => {
    if (typeof window === "undefined") return;
    const saved = window.localStorage.getItem(STORAGE_KEY);
    if (saved) setConvId(saved);
  }, []);

  const chat = useQuery({
    queryKey: ["chat", convId ?? "latest"],
    queryFn: () => listFn({ data: convId ? { conversationId: convId } : {} }),
    staleTime: 30_000,
  });

  const activityRef = useRef(false);

  useEffect(() => {
    if (!chat.data) return;
    if (!activityRef.current) setMessages(chat.data.messages);
    if (!convId && chat.data.conversationId) {
      setConvId(chat.data.conversationId);
      if (typeof window !== "undefined")
        window.localStorage.setItem(STORAGE_KEY, chat.data.conversationId);
    }
  }, [chat.data, convId]);

  const appendMessage = useCallback((m: ChatMessage) => {
    setMessages((prev) => (prev.some((x) => x.id === m.id) ? prev : [...prev, m]));
  }, []);

  const ensureConversation = useCallback(() => {
    if (convId) return convId;
    const id = crypto.randomUUID();
    setConvId(id);
    if (typeof window !== "undefined") window.localStorage.setItem(STORAGE_KEY, id);
    return id;
  }, [convId]);

  const scrollToBottom = useCallback((behavior: ScrollBehavior = "smooth") => {
    bottomRef.current?.scrollIntoView({ behavior, block: "end" });
  }, []);

  // Track whether the user is pinned to the newest message.
  const onScroll = useCallback(() => {
    const el = scrollerRef.current;
    if (!el) return;
    const distance = el.scrollHeight - el.scrollTop - el.clientHeight;
    setAtBottom(distance < 120);
  }, []);

  useLayoutEffect(() => {
    if (chat.isSuccess && messages.length) scrollToBottom("auto");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [chat.isSuccess]);

  useEffect(() => {
    if (atBottom) scrollToBottom("smooth");
  }, [messages, pendingUser, streaming, atBottom, scrollToBottom]);

  /** Reveals a finished reply progressively so it reads like live typing. */
  const revealReply = useCallback(
    (full: string, commit: () => void) =>
      new Promise<void>((resolve) => {
        const step = Math.max(3, Math.ceil(full.length / 90));
        let i = 0;
        setStreaming("");
        const tick = window.setInterval(() => {
          i += step;
          if (i >= full.length) {
            window.clearInterval(tick);
            setStreaming(null);
            commit();
            resolve();
            return;
          }
          setStreaming(full.slice(0, i));
        }, 16);
      }),
    [],
  );

  const send = useMutation({
    mutationFn: async (text: string) => {
      const id = ensureConversation();
      return sendFn({ data: { conversationId: id, content: text } });
    },
    onMutate: (text: string) => {
      activityRef.current = true;
      setPendingUser(text);
    },
    onSuccess: async (res) => {
      setPendingUser(null);
      appendMessage(res.userMessage);
      await revealReply(res.assistantMessage.content, () =>
        appendMessage(res.assistantMessage),
      );
    },
    onError: (e: Error, text: string) => {
      setPendingUser(null);
      setInput((prev) => prev || text);
      toast.error(e.message);
    },
  });

  const regenerate = useMutation({
    mutationFn: async () => {
      const id = ensureConversation();
      return regenFn({ data: { conversationId: id } });
    },
    onMutate: () => {
      activityRef.current = true;
      setMessages((prev) => {
        const next = [...prev];
        while (next.length && next[next.length - 1].role === "assistant") next.pop();
        return next;
      });
    },
    onSuccess: async (res) => {
      await revealReply(res.assistantMessage.content, () =>
        appendMessage(res.assistantMessage),
      );
    },
    onError: (e: Error) => {
      toast.error(e.message);
      chat.refetch();
    },
  });

  const continueReply = useMutation({
    mutationFn: async () => {
      const id = ensureConversation();
      return continueFn({ data: { conversationId: id } });
    },
    onSuccess: (res) => {
      setMessages((prev) =>
        prev.map((m) => (m.id === res.assistantMessage.id ? res.assistantMessage : m)),
      );
      toast.success("Response continued");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const clear = useMutation({
    mutationFn: async () => {
      if (!convId) return { ok: true };
      return clearFn({ data: { conversationId: convId } });
    },
    onSuccess: () => {
      setMessages([]);
      toast.success("Chat cleared");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  function newChat() {
    const id = crypto.randomUUID();
    setMessages([]);
    setStreaming(null);
    setPendingUser(null);
    setConvId(id);
    if (typeof window !== "undefined") window.localStorage.setItem(STORAGE_KEY, id);
    inputRef.current?.focus();
  }

  const busy = send.isPending || regenerate.isPending || streaming !== null;

  function submit() {
    const text = input.trim();
    if (!text || busy) return;
    setInput("");
    setAtBottom(true);
    send.mutate(text);
    requestAnimationFrame(() => inputRef.current?.focus());
  }

  const lastAssistant = useMemo(() => {
    for (let i = messages.length - 1; i >= 0; i--) {
      if (messages[i].role === "assistant") return messages[i];
    }
    return null;
  }, [messages]);

  const canRegenerate = !busy && messages.some((m) => m.role === "user");
  const canContinue =
    !busy &&
    !!lastAssistant &&
    lastAssistant.id === messages[messages.length - 1]?.id &&
    lastAssistant.content.length > 700;

  return (
    <div className="flex h-full min-h-0 flex-col bg-background">
      <header className="flex shrink-0 items-center justify-between gap-3 border-b border-border/70 bg-surface/80 px-4 py-2.5 backdrop-blur lg:px-8 lg:py-3">
        <div className="flex min-w-0 items-center gap-2">
          <div className="grid h-7 w-7 shrink-0 place-items-center rounded-lg bg-primary/8 text-primary">
            <Sparkles className="h-3.5 w-3.5" />
          </div>
          <h1 className="truncate text-[15px] font-semibold tracking-tight">AI Assistant</h1>
        </div>
        <div className="flex shrink-0 items-center gap-1">
          <Button
            variant="ghost"
            size="sm"
            className="h-8 px-2"
            onClick={() => clear.mutate()}
            disabled={clear.isPending || busy || messages.length === 0}
            aria-label="Clear chat"
          >
            {clear.isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Trash2 className="h-4 w-4" />
            )}
            <span className="ml-1.5 hidden sm:inline">Clear</span>
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="h-8 px-2"
            onClick={newChat}
            disabled={busy}
            aria-label="New chat"
          >
            <MessageSquarePlus className="h-4 w-4" />
            <span className="ml-1.5 hidden sm:inline">New chat</span>
          </Button>
        </div>
      </header>

      <div className="relative flex min-h-0 flex-1 flex-col">
        <div
          ref={scrollerRef}
          onScroll={onScroll}
          className="chat-scroll min-h-0 flex-1 overflow-y-auto overscroll-contain scroll-smooth [-webkit-overflow-scrolling:touch]"
          aria-live="polite"
          aria-label="Conversation"
        >
          <div className="mx-auto w-full max-w-3xl px-4 py-4 lg:px-8 lg:py-6">
            {chat.isLoading ? (
              <div className="space-y-5">
                <div className="ml-auto h-11 w-2/3 rounded-2xl shimmer" />
                <div className="h-20 w-full rounded-2xl shimmer" />
                <div className="ml-auto h-10 w-1/2 rounded-2xl shimmer" />
              </div>
            ) : messages.length === 0 && !pendingUser ? (
              <EmptyState
                onPick={(s) => {
                  setInput(s);
                  inputRef.current?.focus();
                }}
              />
            ) : (
              <ol className="space-y-4">
                {messages.map((m, i) => {
                  const showDay =
                    i === 0 || dayLabel(m.created_at) !== dayLabel(messages[i - 1].created_at);
                  const isLastAssistant = !!lastAssistant && m.id === lastAssistant.id;
                  return (
                    <li key={m.id} className="space-y-4">
                      {showDay && (
                        <div className="flex justify-center pt-1">
                          <span className="rounded-full bg-muted px-2.5 py-0.5 text-[11px] font-medium text-muted-foreground">
                            {dayLabel(m.created_at)}
                          </span>
                        </div>
                      )}
                      <Bubble
                        message={m}
                        onRegenerate={
                          isLastAssistant && canRegenerate ? () => regenerate.mutate() : undefined
                        }
                        onContinue={isLastAssistant && canContinue ? () => continueReply.mutate() : undefined}
                        continuing={continueReply.isPending}
                      />
                    </li>
                  );
                })}
                {pendingUser && (
                  <li>
                    <Bubble
                      message={{
                        id: "pending-user",
                        conversation_id: convId ?? "",
                        role: "user",
                        content: pendingUser,
                        created_at: new Date().toISOString(),
                      }}
                      pending
                    />
                  </li>
                )}
                {streaming !== null && (
                  <li>
                    <Bubble
                      message={{
                        id: "streaming",
                        conversation_id: convId ?? "",
                        role: "assistant",
                        content: streaming,
                        created_at: new Date().toISOString(),
                      }}
                      streaming
                    />
                  </li>
                )}
                {(send.isPending || regenerate.isPending) && streaming === null && <Typing />}
              </ol>
            )}
            <div ref={bottomRef} className="h-2" />
          </div>
        </div>

        {!atBottom && (
          <button
            type="button"
            onClick={() => {
              setAtBottom(true);
              scrollToBottom("smooth");
            }}
            className="absolute bottom-3 left-1/2 z-10 -translate-x-1/2 rounded-full border border-border bg-surface p-2 text-muted-foreground shadow-md transition-all hover:text-foreground animate-fade-up"
            aria-label="Scroll to newest message"
          >
            <ArrowDown className="h-4 w-4" />
          </button>
        )}
      </div>

      <div className="sticky bottom-0 shrink-0 border-t border-border bg-surface/95 backdrop-blur pb-[env(safe-area-inset-bottom)]">
        <div className="mx-auto w-full max-w-3xl px-3 py-2.5 lg:px-8 lg:py-3">
          <div className="flex items-end gap-2 rounded-[22px] border border-border bg-background px-2 py-1.5 transition-shadow focus-within:border-primary/40 focus-within:shadow-xs">
            <Textarea
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  submit();
                }
              }}
              placeholder="Message Proposly AI…"
              rows={1}
              maxLength={8000}
              className="max-h-[9.5rem] min-h-[38px] resize-none overflow-y-auto border-0 bg-transparent px-2 py-2 text-[16px] leading-relaxed shadow-none focus-visible:ring-0"
              aria-label="Message"
            />
            <Button
              size="icon"
              className="h-9 w-9 shrink-0 rounded-full"
              onClick={submit}
              disabled={busy || input.trim().length === 0}
              aria-label="Send message"
            >
              {busy ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <ArrowUp className="h-4 w-4" />
              )}
            </Button>
          </div>
          <p className="mt-1.5 hidden text-center text-[11px] text-muted-foreground sm:block">
            Enter to send · Shift + Enter for a new line
          </p>
        </div>
      </div>
    </div>
  );
}

function Typing() {
  return (
    <li className="flex justify-start">
      <div className="flex items-center gap-1.5 py-2">
        {[0, 1, 2].map((i) => (
          <span
            key={i}
            className="h-1.5 w-1.5 rounded-full bg-muted-foreground/60 animate-typing-dot"
            style={{ animationDelay: `${i * 0.16}s` }}
          />
        ))}
      </div>
    </li>
  );
}

function Bubble({
  message,
  pending,
  streaming,
  onRegenerate,
  onContinue,
  continuing,
}: {
  message: ChatMessage;
  pending?: boolean;
  streaming?: boolean;
  onRegenerate?: () => void;
  onContinue?: () => void;
  continuing?: boolean;
}) {
  const [copied, setCopied] = useState(false);
  const isUser = message.role === "user";

  function copy() {
    navigator.clipboard.writeText(message.content);
    setCopied(true);
    toast.success("Copied");
    window.setTimeout(() => setCopied(false), 1400);
  }

  return (
    <div
      className={`flex flex-col gap-1.5 animate-message-in ${isUser ? "items-end" : "items-start"}`}
    >
      <div
        className={`break-words text-[15px] leading-[1.7] ${
          isUser
            ? "max-w-[85%] whitespace-pre-wrap rounded-[20px] rounded-br-md bg-primary px-3.5 py-2.5 text-primary-foreground shadow-xs"
            : "w-full text-foreground"
        } ${pending ? "opacity-70" : ""}`}
      >
        {isUser ? (
          message.content
        ) : (
          <div className="space-y-3 [&_a]:text-primary [&_a]:underline [&_code]:rounded [&_code]:bg-muted [&_code]:px-1 [&_code]:py-0.5 [&_code]:text-[13px] [&_li]:leading-[1.7] [&_ol]:list-decimal [&_ol]:space-y-1 [&_ol]:pl-5 [&_p]:m-0 [&_pre]:overflow-x-auto [&_pre]:rounded-lg [&_pre]:bg-muted [&_pre]:p-3 [&_strong]:font-semibold [&_ul]:list-disc [&_ul]:space-y-1 [&_ul]:pl-5">
            <ReactMarkdown>{message.content}</ReactMarkdown>
          </div>
        )}
        {streaming && (
          <span className="ml-0.5 inline-block h-4 w-[2px] animate-pulse bg-current align-middle" />
        )}
      </div>

      {!pending && !streaming && (
        <div
          className={`flex items-center gap-1 text-[11px] text-muted-foreground ${
            isUser ? "flex-row-reverse pr-1" : ""
          }`}
        >
          <button
            type="button"
            onClick={copy}
            className="inline-flex items-center gap-1 rounded-md px-1.5 py-1 transition-colors hover:bg-muted hover:text-foreground"
            aria-label="Copy message"
          >
            {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
            <span className="hidden sm:inline">{copied ? "Copied" : "Copy"}</span>
          </button>
          {onRegenerate && (
            <button
              type="button"
              onClick={onRegenerate}
              className="inline-flex items-center gap-1 rounded-md px-1.5 py-1 transition-colors hover:bg-muted hover:text-foreground"
              aria-label="Regenerate response"
            >
              <RefreshCw className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Regenerate</span>
            </button>
          )}
          {onContinue && (
            <button
              type="button"
              onClick={onContinue}
              disabled={continuing}
              className="inline-flex items-center gap-1 rounded-md px-1.5 py-1 transition-colors hover:bg-muted hover:text-foreground disabled:opacity-50"
              aria-label="Continue response"
            >
              {continuing ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <TextQuote className="h-3.5 w-3.5" />
              )}
              <span className="hidden sm:inline">Continue</span>
            </button>
          )}
          <span className="px-1 opacity-70">{timeLabel(message.created_at)}</span>
        </div>
      )}
      {pending && <span className="px-1 text-[11px] text-muted-foreground">Sending…</span>}
    </div>
  );
}

function EmptyState({ onPick }: { onPick: (s: string) => void }) {
  return (
    <div className="grid min-h-[50vh] place-items-center">
      <div className="w-full max-w-md text-center">
        <div className="mx-auto mb-4 grid h-11 w-11 place-items-center rounded-xl bg-primary/8 text-primary">
          <Sparkles className="h-5 w-5" />
        </div>
        <div className="text-base font-semibold text-foreground">Start the conversation</div>
        <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
          Everything you send stays in this one thread — ask follow-ups any time.
        </p>
        <div className="mt-5 space-y-2">
          {SUGGESTIONS.map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => onPick(s)}
              className="w-full rounded-xl border border-border bg-surface px-4 py-2.5 text-left text-sm text-muted-foreground transition-all hover:border-primary/30 hover:text-foreground"
            >
              {s}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

