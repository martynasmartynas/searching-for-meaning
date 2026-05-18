import { revalidatePath } from "next/cache";
import { generateImage } from "@/lib/fake/generateImage";
import { ingestRawImages } from "@/lib/ingest/ingestImages";

async function seed(formData: FormData) {
  "use server";
  const count = Math.min(
    Math.max(Number(formData.get("count") ?? 100), 1),
    5000,
  );
  await ingestRawImages(Array.from({ length: count }, generateImage));
  revalidatePath("/admin/images");
}

export default function SeedPage() {
  return (
    <>
      <h1 className="text-2xl font-semibold tracking-tight">
        Seed fake images
      </h1>
      <p className="mt-2 text-sm text-zinc-500">
        Inserts randomly generated IMAGO-style image metadata into Postgres.
        Sequin will propagate to Meilisearch once we configure the sink.
      </p>

      <form action={seed} className="mt-8 flex items-end gap-3">
        <label className="flex flex-col text-sm">
          <span className="mb-1 text-zinc-600 dark:text-zinc-400">Count</span>
          <input
            name="count"
            type="number"
            defaultValue={100}
            min={1}
            max={5000}
            className="w-32 rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-900"
          />
        </label>
        <button
          type="submit"
          className="rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200"
        >
          Generate
        </button>
      </form>
    </>
  );
}
