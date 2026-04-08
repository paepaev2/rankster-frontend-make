'use client';

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createRankPost, fetchCategories } from "../lib/ranksterApi";
import { useMockSession } from "../lib/useMockSession";
import type { Category, CreateRankInput, TierData, TierItem } from "../lib/feedUi";

const EMPTY_TIERS: Record<keyof TierData, string> = {
  S: "",
  A: "",
  B: "",
  C: "",
  D: "",
};

export function CreatePage() {
  const router = useRouter();
  const { session, isLoading: isAuthLoading, error: authError } = useMockSession();
  const [categories, setCategories] = useState<Category[]>([]);
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("gaming");
  const [description, setDescription] = useState("");
  const [tags, setTags] = useState("");
  const [tiers, setTiers] = useState<Record<keyof TierData, string>>(EMPTY_TIERS);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    void fetchCategories()
      .then((items) => {
        setCategories(items);
        if (items[0]) {
          setCategory(items[0].id);
        }
      })
      .catch((categoryError) => {
        setError(categoryError instanceof Error ? categoryError.message : "Failed to load categories.");
      });
  }, []);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      const payload = buildCreatePayload({ title, category, description, tags, tiers });
      const created = await createRankPost(payload);
      router.push(`/topic/${created.id}`);
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "Failed to create ranking.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 px-4 pt-12 pb-24">
      <div className="mx-auto max-w-lg space-y-4">
        <div className="rounded-3xl border border-gray-100 bg-white p-5 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-violet-600">Create</p>
          <h1 className="mt-2 text-3xl font-black tracking-tight text-gray-900">Publish a ranking</h1>
          <p className="mt-3 text-sm leading-6 text-gray-600">
            Mock bearer auth is active for {session?.user.displayName || "your account"}, so anything you publish here is tied to that signed-in user.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 rounded-3xl border border-gray-100 bg-white p-5 shadow-sm">
          <Field label="Title">
            <input
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              className="w-full rounded-2xl border border-gray-200 px-4 py-3 text-sm outline-none focus:border-violet-400"
              placeholder="Best games of the year"
            />
          </Field>

          <Field label="Category">
            <select
              value={category}
              onChange={(event) => setCategory(event.target.value)}
              className="w-full rounded-2xl border border-gray-200 px-4 py-3 text-sm outline-none focus:border-violet-400"
            >
              {categories.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.name}
                </option>
              ))}
            </select>
          </Field>

          <Field label="Description">
            <textarea
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              className="min-h-24 w-full rounded-2xl border border-gray-200 px-4 py-3 text-sm outline-none focus:border-violet-400"
              placeholder="Explain your take..."
            />
          </Field>

          <Field label="Tags">
            <input
              value={tags}
              onChange={(event) => setTags(event.target.value)}
              className="w-full rounded-2xl border border-gray-200 px-4 py-3 text-sm outline-none focus:border-violet-400"
              placeholder="gaming, 2026, favorites"
            />
          </Field>

          {(["S", "A", "B", "C", "D"] as const).map((tierKey) => (
            <Field key={tierKey} label={`${tierKey} tier items`}>
              <textarea
                value={tiers[tierKey]}
                onChange={(event) => setTiers((current) => ({ ...current, [tierKey]: event.target.value }))}
                className="min-h-20 w-full rounded-2xl border border-gray-200 px-4 py-3 text-sm outline-none focus:border-violet-400"
                placeholder="One item per line"
              />
            </Field>
          ))}

          {(authError || error) && <p className="text-sm text-red-500">{authError || error}</p>}

          <button
            type="submit"
            disabled={isSubmitting || isAuthLoading}
            className="w-full rounded-2xl bg-violet-500 px-4 py-3 text-sm font-semibold text-white transition-colors hover:bg-violet-600 disabled:opacity-60"
          >
            {isSubmitting ? "Publishing..." : "Publish ranking"}
          </button>
        </form>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-2 block text-sm font-semibold text-gray-800">{label}</span>
      {children}
    </label>
  );
}

function buildCreatePayload(input: {
  title: string;
  category: string;
  description: string;
  tags: string;
  tiers: Record<keyof TierData, string>;
}): CreateRankInput {
  const allItems: TierItem[] = [];

  const tierData = (["S", "A", "B", "C", "D"] as const).reduce((result, tierKey) => {
    const items = input.tiers[tierKey]
      .split("\n")
      .map((item) => item.trim())
      .filter(Boolean)
      .map((item, index) => {
        const entry = { id: `${tierKey.toLowerCase()}-${index}-${slugify(item)}`, name: item };
        allItems.push(entry);
        return entry;
      });

    return {
      ...result,
      [tierKey]: items,
    };
  }, {
    S: [] as TierItem[],
    A: [] as TierItem[],
    B: [] as TierItem[],
    C: [] as TierItem[],
    D: [] as TierItem[],
  });

  return {
    title: input.title.trim(),
    category: input.category,
    description: input.description.trim(),
    tags: input.tags.split(",").map((tag) => tag.trim()).filter(Boolean),
    tiers: tierData,
    allItems,
    isPublic: true,
  };
}

function slugify(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}
