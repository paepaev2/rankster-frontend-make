import Link from "next/link";

export default function NotFound() {
  return (
    <div className="min-h-screen bg-gray-50 px-4 pt-20 pb-24">
      <div className="mx-auto max-w-md rounded-3xl border border-gray-100 bg-white p-6 text-center shadow-sm">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-violet-50 text-2xl font-black text-violet-500">
          404
        </div>
        <h1 className="mt-4 text-xl font-black text-gray-900">Page not found</h1>
        <p className="mt-2 text-sm leading-6 text-gray-500">
          This ranking page may have moved, been deleted, or never existed.
        </p>
        <Link
          href="/"
          className="mt-5 inline-flex items-center justify-center rounded-2xl bg-violet-600 px-5 py-3 text-sm font-bold text-white shadow-sm transition-colors hover:bg-violet-700"
        >
          Back to home
        </Link>
      </div>
    </div>
  );
}
