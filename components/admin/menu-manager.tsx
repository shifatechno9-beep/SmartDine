"use client";

import { useMemo, useState } from "react";
import { Plus } from "lucide-react";
import { useLocale } from "@/components/locale-provider";
import { useMenu } from "@/components/menu-provider";
import { DishCard } from "@/components/admin/dish-card";
import { DishFormModal } from "@/components/admin/dish-form-modal";
import { DataStatusBanner } from "@/components/data-status-banner";
import { CATEGORY_KEYS, type Dish, type DishCategory } from "@/lib/menu";

type Filter = "all" | DishCategory;
type Editor = Dish | "new" | null;

export function MenuManager() {
  const { t } = useLocale();
  const { dishes, addDish, updateDish, removeDish, toggleAvailable } = useMenu();
  const [filter, setFilter] = useState<Filter>("all");
  const [editor, setEditor] = useState<Editor>(null);

  const tabs: { id: Filter; label: string }[] = [
    { id: "all", label: t("menu.all") },
    ...CATEGORY_KEYS.map((category) => ({ id: category.id, label: t(category.label) })),
  ];

  const visible = useMemo(
    () => (filter === "all" ? dishes : dishes.filter((dish) => dish.category === filter)),
    [dishes, filter],
  );

  return (
    <section>
      <div className="mb-5">
        <DataStatusBanner />
      </div>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="text-sm font-medium">{t("menu.heading")}</h2>
          <p className="mt-1 max-w-xl text-sm text-muted">{t("menu.body")}</p>
        </div>
        <button
          type="button"
          onClick={() => setEditor("new")}
          className="inline-flex h-9 items-center justify-center gap-2 rounded-md bg-foreground px-3 text-sm font-medium text-background"
        >
          <Plus className="size-4" />
          {t("menu.add")}
        </button>
      </div>

      <div className="mt-5 flex gap-1 overflow-x-auto">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setFilter(tab.id)}
            className={`h-8 shrink-0 rounded-md px-3 text-xs font-medium ${
              filter === tab.id
                ? "bg-foreground text-background"
                : "border border-border text-muted hover:text-foreground"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {visible.length === 0 ? (
        <p className="mt-8 rounded-xl border border-dashed border-border px-4 py-10 text-center text-sm text-muted">
          {t("menu.empty")}
        </p>
      ) : (
        <div className="mt-5 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {visible.map((dish) => (
            <DishCard
              key={dish.id}
              dish={dish}
              onEdit={() => setEditor(dish)}
              onToggle={() => toggleAvailable(dish.id)}
            />
          ))}
        </div>
      )}

      {editor ? (
        <DishFormModal
          key={editor === "new" ? "new" : editor.id}
          dish={editor}
          onClose={() => setEditor(null)}
          onSave={async (draft, id) => {
            if (id) {
              await updateDish(id, draft);
              return;
            }
            await addDish(draft);
          }}
          onDelete={removeDish}
        />
      ) : null}
    </section>
  );
}
