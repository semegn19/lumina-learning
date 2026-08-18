import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Bot,
  Check,
  ChevronLeft,
  ChevronRight,
  Copy,
  HelpCircle,
  MessageSquareQuote,
  Pencil,
  Plus,
  RefreshCcw,
  Search,
  Trash2,
} from "lucide-react";
import { useState, useMemo, useEffect } from "react";
import { toast } from "sonner";

import { AdminGuard } from "@/components/admin-guard";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { createBotFaq, deleteBotFaq, getBotFaqs, updateBotFaq } from "@/lib/bot-api";
import { getApiErrorMessage } from "@/lib/api-client";
import type { BotFaq } from "@/lib/api-types";

const PAGE_SIZE = 10;

export const Route = createFileRoute("/manage/faqs")({
  head: () => ({
    meta: [
      { title: "Bot FAQs | Lumina Learning Admin" },
      {
        name: "description",
        content: "Manage the knowledge base Q&A entries used by the chatbot.",
      },
      { property: "og:title", content: "Bot FAQs | Lumina Learning Admin" },
      { property: "og:description", content: "Manage bot knowledge base and FAQ answers." },
      { property: "og:type", content: "website" },
    ],
    links: [{ rel: "canonical", href: "/manage/faqs" }],
  }),
  component: () => (
    <AdminGuard>
      <ManageFaqs />
    </AdminGuard>
  ),
});

function ManageFaqs() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [page, setPage] = useState(1);

  // Modal states
  const [createOpen, setCreateOpen] = useState(false);
  const [editingFaq, setEditingFaq] = useState<BotFaq | null>(null);
  const [deletingFaq, setDeletingFaq] = useState<BotFaq | null>(null);

  // Form states
  const [formQuestion, setFormQuestion] = useState("");
  const [formAnswer, setFormAnswer] = useState("");
  const [copiedId, setCopiedId] = useState<number | string | null>(null);

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search.trim());
      setPage(1);
    }, 300);
    return () => clearTimeout(timer);
  }, [search]);

  // 1. Fetch FAQs
  const { data, isLoading, isRefetching, refetch } = useQuery({
    queryKey: ["bot-faqs", { page, search: debouncedSearch || undefined }],
    queryFn: () =>
      getBotFaqs({
        page,
        page_size: PAGE_SIZE,
        size: PAGE_SIZE,
        search: debouncedSearch || undefined,
      }),
  });

  const rawList: BotFaq[] = Array.isArray(data) ? data : data?.results ?? [];

  // Extract server pagination or compute client pagination
  const isServerPaginated = !Array.isArray(data) && (data?.meta || data?.count !== undefined);
  const serverMeta = !Array.isArray(data) ? data?.meta : undefined;

  const totalItems =
    serverMeta?.total_items ??
    (!Array.isArray(data) && data?.count !== undefined ? data.count : rawList.length);

  const totalPages =
    serverMeta?.total_pages ??
    ((isServerPaginated ? Math.ceil(totalItems / PAGE_SIZE) : Math.ceil(rawList.length / PAGE_SIZE)) || 1);

  // Filter & Paginate items if backend is unpaginated
  const displayFaqs = useMemo(() => {
    if (isServerPaginated) return rawList;

    let filtered = rawList;
    if (debouncedSearch) {
      const q = debouncedSearch.toLowerCase();
      filtered = filtered.filter(
        (f) =>
          (f.question || "").toLowerCase().includes(q) ||
          (f.answer || "").toLowerCase().includes(q)
      );
    }
    const start = (page - 1) * PAGE_SIZE;
    return filtered.slice(start, start + PAGE_SIZE);
  }, [rawList, isServerPaginated, debouncedSearch, page]);

  // 2. Create FAQ mutation
  const createMut = useMutation({
    mutationFn: async () => {
      if (!formQuestion.trim()) throw new Error("Question is required");
      if (!formAnswer.trim()) throw new Error("Answer is required");
      return await createBotFaq({
        question: formQuestion.trim(),
        answer: formAnswer.trim(),
      });
    },
    onSuccess: () => {
      toast.success("FAQ created successfully!");
      setFormQuestion("");
      setFormAnswer("");
      setCreateOpen(false);
      void queryClient.invalidateQueries({ queryKey: ["bot-faqs"] });
    },
    onError: (err) => {
      toast.error(`Failed to create FAQ: ${getApiErrorMessage(err)}`);
    },
  });

  // 3. Edit FAQ mutation
  const editMut = useMutation({
    mutationFn: async () => {
      if (!editingFaq?.id) throw new Error("Missing FAQ ID");
      if (!formQuestion.trim()) throw new Error("Question is required");
      if (!formAnswer.trim()) throw new Error("Answer is required");
      return await updateBotFaq(editingFaq.id, {
        question: formQuestion.trim(),
        answer: formAnswer.trim(),
      });
    },
    onSuccess: () => {
      toast.success("FAQ updated successfully!");
      setEditingFaq(null);
      setFormQuestion("");
      setFormAnswer("");
      void queryClient.invalidateQueries({ queryKey: ["bot-faqs"] });
    },
    onError: (err) => {
      toast.error(`Failed to update FAQ: ${getApiErrorMessage(err)}`);
    },
  });

  // 4. Delete FAQ mutation
  const deleteMut = useMutation({
    mutationFn: async (id: number | string) => {
      await deleteBotFaq(id);
    },
    onSuccess: () => {
      toast.success("FAQ deleted successfully!");
      setDeletingFaq(null);
      void queryClient.invalidateQueries({ queryKey: ["bot-faqs"] });
    },
    onError: (err) => {
      toast.error(`Failed to delete FAQ: ${getApiErrorMessage(err)}`);
    },
  });

  const handleOpenCreate = () => {
    setFormQuestion("");
    setFormAnswer("");
    setCreateOpen(true);
  };

  const handleOpenEdit = (faq: BotFaq) => {
    setEditingFaq(faq);
    setFormQuestion(faq.question || "");
    setFormAnswer(faq.answer || "");
  };

  const handleCopy = (text: string, id: number | string) => {
    void navigator.clipboard.writeText(text);
    setCopiedId(id);
    toast.success("Answer copied to clipboard");
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Generate pagination buttons window
  const paginationPages = useMemo(() => {
    const pages: number[] = [];
    const maxButtons = 7;
    let start = Math.max(1, page - 3);
    let end = Math.min(totalPages, start + maxButtons - 1);
    if (end - start + 1 < maxButtons) {
      start = Math.max(1, end - maxButtons + 1);
    }
    for (let i = start; i <= end; i++) {
      pages.push(i);
    }
    return pages;
  }, [page, totalPages]);

  return (
    <div className="min-h-screen bg-canvas-rose/40">
      <main className="mx-auto max-w-[1200px] px-6 py-8 md:px-8">
        {/* Header */}
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2.5">
              <span className="grid size-10 place-items-center rounded-xl bg-primary/10 text-primary">
                <HelpCircle className="size-5" aria-hidden />
              </span>
              <div>
                <h1 className="text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
                  Bot Knowledge Base & FAQs
                </h1>
                <p className="mt-1 text-base text-muted-foreground">
                  Configure answers to frequently asked student and visitor inquiries for the bot.
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              size="sm"
              onClick={() => refetch()}
              disabled={isLoading || isRefetching}
              className="gap-2 rounded-xl"
            >
              <RefreshCcw className={`size-4 ${isRefetching ? "animate-spin" : ""}`} />
              Refresh
            </Button>

            <Button
              onClick={handleOpenCreate}
              className="gap-2 rounded-xl bg-primary text-primary-foreground shadow-xs hover:bg-primary/90"
            >
              <Plus className="size-4" />
              Add FAQ
            </Button>
          </div>
        </div>

        {/* Stats Strip */}
        <div className="mt-8 grid gap-4 sm:grid-cols-2">
          <div className="surface-card flex items-center gap-4 p-5">
            <span className="grid size-12 place-items-center rounded-2xl bg-primary-soft text-primary">
              <MessageSquareQuote className="size-6" />
            </span>
            <div>
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Total Q&A Pairs
              </p>
              <p className="text-2xl font-bold text-foreground">{totalItems}</p>
            </div>
          </div>

          <div className="surface-card flex items-center gap-4 p-5">
            <span className="grid size-12 place-items-center rounded-2xl bg-success/15 text-success">
              <Bot className="size-6" />
            </span>
            <div>
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Chatbot Knowledge
              </p>
              <p className="text-2xl font-bold text-foreground">Active & Ready</p>
            </div>
          </div>
        </div>

        {/* Search Filter Bar */}
        <div className="mt-8 flex items-center gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search knowledge base questions and answers..."
              className="h-11 rounded-xl bg-card pl-10 text-sm shadow-xs"
            />
          </div>
          {search && (
            <Button variant="ghost" size="sm" onClick={() => setSearch("")}>
              Clear
            </Button>
          )}
        </div>

        {/* FAQ Cards List */}
        <div className="mt-6">
          {isLoading ? (
            <div className="py-20 text-center">
              <div className="mx-auto size-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
              <p className="mt-4 text-sm text-muted-foreground">Loading knowledge base...</p>
            </div>
          ) : displayFaqs.length === 0 ? (
            <div className="surface-card py-16 text-center">
              <span className="mx-auto grid size-16 place-items-center rounded-full bg-primary/10 text-primary">
                <HelpCircle className="size-8" />
              </span>
              <h3 className="mt-4 text-lg font-bold text-foreground">
                {search ? "No matching FAQs found" : "No FAQs created yet"}
              </h3>
              <p className="mt-1 text-sm text-muted-foreground">
                {search
                  ? "Try adjusting your search keywords."
                  : "Add common questions and answers to configure how the bot answers students."}
              </p>
              {!search && (
                <Button onClick={handleOpenCreate} className="mt-6 gap-2 rounded-xl">
                  <Plus className="size-4" /> Create First FAQ
                </Button>
              )}
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2">
              {displayFaqs.map((faq, idx) => {
                const faqId = faq.id || idx;
                const itemNumber = (page - 1) * PAGE_SIZE + idx + 1;

                return (
                  <article
                    key={faqId}
                    onClick={() => handleOpenEdit(faq)}
                    className="surface-card group flex flex-col justify-between p-6 transition-all duration-200 hover:border-primary/40 hover:bg-accent/30 hover:shadow-md cursor-pointer"
                  >
                    <div>
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-start gap-3">
                          <span className="grid size-8 shrink-0 place-items-center rounded-lg bg-primary-soft text-primary font-bold text-xs transition-transform duration-300 group-hover:scale-105">
                            Q{itemNumber}
                          </span>
                          <h2 className="text-base font-bold text-foreground leading-snug group-hover:text-primary transition-colors">
                            {faq.question}
                          </h2>
                        </div>

                        <div className="flex items-center gap-1 shrink-0" onClick={(e) => e.stopPropagation()}>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleCopy(faq.answer, faqId)}
                            title="Copy answer"
                            className="size-8 text-muted-foreground hover:text-foreground"
                          >
                            {copiedId === faqId ? (
                              <Check className="size-4 text-success" />
                            ) : (
                              <Copy className="size-4" />
                            )}
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleOpenEdit(faq)}
                            title="Edit FAQ"
                            className="size-8 text-muted-foreground hover:text-primary"
                          >
                            <Pencil className="size-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setDeletingFaq(faq)}
                            title="Delete FAQ"
                            className="size-8 text-muted-foreground hover:text-destructive"
                          >
                            <Trash2 className="size-4" />
                          </Button>
                        </div>
                      </div>

                      <div className="mt-4 rounded-xl bg-muted/40 p-4 text-sm text-foreground/90 leading-relaxed border border-border/50">
                        <p className="whitespace-pre-wrap">{faq.answer}</p>
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          )}

          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div className="mt-8 flex flex-wrap items-center justify-between gap-4 border-t border-border/60 pt-6">
              <p className="text-sm text-muted-foreground">
                Showing{" "}
                <span className="font-semibold text-foreground">
                  {Math.min(totalItems, (page - 1) * PAGE_SIZE + 1)}
                </span>{" "}
                to{" "}
                <span className="font-semibold text-foreground">
                  {Math.min(totalItems, page * PAGE_SIZE)}
                </span>{" "}
                of <span className="font-semibold text-foreground">{totalItems}</span> FAQs
              </p>

              <div className="flex items-center gap-1.5">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page <= 1 || isLoading}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  className="gap-1 rounded-lg px-2.5 text-xs font-semibold"
                >
                  <ChevronLeft className="size-4" /> Previous
                </Button>

                {paginationPages.map((pg) => (
                  <Button
                    key={pg}
                    variant={page === pg ? "default" : "outline"}
                    size="sm"
                    onClick={() => setPage(pg)}
                    className="size-8 rounded-lg p-0 text-xs font-semibold"
                  >
                    {pg}
                  </Button>
                ))}

                <Button
                  variant="outline"
                  size="sm"
                  disabled={page >= totalPages || isLoading}
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  className="gap-1 rounded-lg px-2.5 text-xs font-semibold"
                >
                  Next <ChevronRight className="size-4" />
                </Button>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* Create FAQ Modal */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold text-foreground">
              Create Bot FAQ
            </DialogTitle>
            <DialogDescription>
              Add a question and answer for the chatbot knowledge base.
            </DialogDescription>
          </DialogHeader>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              createMut.mutate();
            }}
            className="space-y-4 py-2"
          >
            <div className="space-y-2">
              <Label htmlFor="faq-question" className="font-semibold text-foreground">
                Question <span className="text-destructive">*</span>
              </Label>
              <Input
                id="faq-question"
                value={formQuestion}
                onChange={(e) => setFormQuestion(e.target.value)}
                placeholder="e.g. How do I enroll in a course?"
                className="rounded-xl"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="faq-answer" className="font-semibold text-foreground">
                Answer <span className="text-destructive">*</span>
              </Label>
              <Textarea
                id="faq-answer"
                value={formAnswer}
                onChange={(e) => setFormAnswer(e.target.value)}
                placeholder="e.g. You can enroll in a course by visiting the course page and clicking the enroll button..."
                rows={5}
                className="rounded-xl resize-none"
                required
              />
            </div>

            <DialogFooter className="pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => setCreateOpen(false)}
                className="rounded-xl"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={createMut.isPending || !formQuestion.trim() || !formAnswer.trim()}
                className="gap-2 rounded-xl"
              >
                {createMut.isPending ? "Creating..." : "Create FAQ"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Edit FAQ Modal */}
      <Dialog open={!!editingFaq} onOpenChange={(open) => !open && setEditingFaq(null)}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold text-foreground">
              Edit Bot FAQ
            </DialogTitle>
            <DialogDescription>
              Update the question and answer for this knowledge base entry.
            </DialogDescription>
          </DialogHeader>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              editMut.mutate();
            }}
            className="space-y-4 py-2"
          >
            <div className="space-y-2">
              <Label htmlFor="edit-faq-question" className="font-semibold text-foreground">
                Question <span className="text-destructive">*</span>
              </Label>
              <Input
                id="edit-faq-question"
                value={formQuestion}
                onChange={(e) => setFormQuestion(e.target.value)}
                className="rounded-xl"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-faq-answer" className="font-semibold text-foreground">
                Answer <span className="text-destructive">*</span>
              </Label>
              <Textarea
                id="edit-faq-answer"
                value={formAnswer}
                onChange={(e) => setFormAnswer(e.target.value)}
                rows={5}
                className="rounded-xl resize-none"
                required
              />
            </div>

            <DialogFooter className="pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => setEditingFaq(null)}
                className="rounded-xl"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={editMut.isPending || !formQuestion.trim() || !formAnswer.trim()}
                className="gap-2 rounded-xl"
              >
                {editMut.isPending ? "Saving..." : "Save Changes"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deletingFaq} onOpenChange={(open) => !open && setDeletingFaq(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete FAQ</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete the FAQ:{" "}
              <span className="font-semibold text-foreground">"{deletingFaq?.question}"</span>? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => deletingFaq?.id && deleteMut.mutate(deletingFaq.id)}
            >
              {deleteMut.isPending ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
