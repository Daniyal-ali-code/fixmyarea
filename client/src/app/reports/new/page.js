"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Header from "@/components/Header";
import { useAuth } from "@/components/AuthProvider";

const CATEGORIES = [
  { id: 1, name: "Road" },
  { id: 2, name: "Garbage" },
  { id: 3, name: "Water" },
  { id: 4, name: "Streetlight" },
  { id: 5, name: "Other" },
];

export default function NewReportPage() {
  const router = useRouter();
  const { user, loading } = useAuth();

  const [title, setTitle] = useState("");
  const [categoryId, setCategoryId] = useState(null);
  const [description, setDescription] = useState("");
  const [severity, setSeverity] = useState(3);
  const [latitude, setLatitude] = useState("");
  const [longitude, setLongitude] = useState("");

  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [locating, setLocating] = useState(false);
  const [duplicates, setDuplicates] = useState(null);

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!loading && !user) {
      router.push("/login");
    }
  }, [loading, user, router]);

  function handleUseLocation() {
    if (!navigator.geolocation) {
      setError("Geolocation is not supported by your browser.");
      return;
    }

    setLocating(true);
    setError("");

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setLatitude(position.coords.latitude.toFixed(6));
        setLongitude(position.coords.longitude.toFixed(6));
        setLocating(false);
      },
      (err) => {
        console.error("Geolocation error:", err);
        setError("Could not get your location. Please enter coordinates manually.");
        setLocating(false);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  }

  async function submitReport(force = false) {
    setError("");
    setDuplicates(null);
    setSubmitting(true);

    if (!categoryId) {
      setError("Please select a category.");
      setSubmitting(false);
      return;
    }

    const lat = parseFloat(latitude);
    const lng = parseFloat(longitude);

    if (isNaN(lat) || isNaN(lng)) {
      setError("Please enter valid coordinates or use your location.");
      setSubmitting(false);
      return;
    }

    try {
      const token = localStorage.getItem("token");
      const url = force ? "/api/reports?force=true" : "/api/reports";

      const res = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          title,
          description,
          category_id: categoryId,
          latitude: lat,
          longitude: lng,
          severity,
        }),
      });

      const data = await res.json();

      if (res.status === 409 && data.duplicates) {
        setDuplicates(data.duplicates);
        setSubmitting(false);
        return;
      }

      if (!res.ok) {
        setError(data.error || "Failed to submit report");
        setSubmitting(false);
        return;
      }

      router.push(`/reports/${data.report.id}`);
    } catch (err) {
      console.error("Submit error:", err);
      setError("Something went wrong. Please try again.");
      setSubmitting(false);
    }
  }

  async function handleSubmit(e) {
    e.preventDefault();
    await submitReport(false);
  }

  // If loading auth or redirecting
  if (loading || !user) {
    return (
      <>
        <Header />
        <main className="min-h-screen bg-amber-50 dark:bg-stone-900 flex items-center justify-center">
          <p className="font-serif italic text-stone-600 dark:text-stone-400">
            Loading...
          </p>
        </main>
      </>
    );
  }

  return (
    <>
      <Header />

      <main className="min-h-screen bg-amber-50 dark:bg-stone-900">
        <div className="max-w-2xl mx-auto px-4 py-8">
          <Link
            href="/reports"
            className="font-serif italic text-sm text-slate-800 dark:text-slate-400 hover:text-amber-600 dark:hover:text-amber-500 underline underline-offset-2 inline-block mb-6"
          >
            ← Back to reports
          </Link>

          <div className="mb-6">
            <p className="font-serif italic text-xs uppercase tracking-[0.3em] text-stone-600 dark:text-stone-400 mb-2 border-b-2 border-amber-600 pb-1 inline-block">
              Report an Issue
            </p>
            <h1 className="font-serif text-3xl md:text-4xl font-bold text-stone-900 dark:text-stone-50 mt-3">
              What&apos;s the problem?
            </h1>
            <p className="font-serif italic text-base text-stone-700 dark:text-stone-300 mt-2">
              Help your community by reporting local issues. Take a minute —
              your report might be the one that gets it fixed.
            </p>
          </div>

          {/* Duplicate warning */}
          {duplicates && duplicates.length > 0 && (
            <div className="bg-amber-50 dark:bg-amber-950 border-2 border-amber-600 dark:border-amber-700 rounded-sm p-5 mb-6">
              <p className="font-serif text-lg font-bold text-stone-900 dark:text-stone-50 mb-2">
                Similar reports found nearby
              </p>
              <p className="font-serif italic text-sm text-stone-700 dark:text-stone-300 mb-4">
                Someone may have already reported this issue. Consider
                supporting an existing report instead, or submit yours anyway.
              </p>
              <div className="space-y-3 mb-4">
                {duplicates.map((d) => (
                  <Link
                    key={d.id}
                    href={`/reports/${d.id}`}
                    className="block bg-stone-50 dark:bg-stone-800 border border-stone-300 dark:border-stone-700 rounded-sm p-3 hover:border-amber-600 dark:hover:border-amber-500 transition"
                  >
                    <p className="font-serif font-semibold text-stone-900 dark:text-stone-50">
                      {d.title}
                    </p>
                    <p className="text-xs text-stone-600 dark:text-stone-400">
                      {d.distance_m}m away · {Math.round(d.similarity * 100)}%
                      similar
                    </p>
                  </Link>
                ))}
              </div>
              <div className="flex gap-3 flex-wrap">
                <button
                  onClick={() => submitReport(true)}
                  disabled={submitting}
                  className="px-4 py-2 text-xs font-semibold uppercase tracking-wider text-stone-900 bg-amber-600 rounded-sm hover:bg-amber-500 border border-amber-700 transition disabled:opacity-50"
                >
                  Submit Anyway
                </button>
                <button
                  onClick={() => setDuplicates(null)}
                  className="px-4 py-2 text-xs font-semibold uppercase tracking-wider text-stone-900 dark:text-stone-100 bg-amber-50 dark:bg-stone-800 rounded-sm hover:bg-amber-100 dark:hover:bg-stone-700 border border-stone-400 dark:border-stone-600 transition"
                >
                  Edit My Report
                </button>
              </div>
            </div>
          )}

          {error && (
            <div className="bg-red-50 dark:bg-red-950 border border-red-300 dark:border-red-800 text-red-800 dark:text-red-200 text-sm p-3 rounded-sm mb-4">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Title */}
            <div>
              <label
                htmlFor="title"
                className="block text-xs font-semibold uppercase tracking-wider text-stone-700 dark:text-stone-300 mb-2"
              >
                Title *
              </label>
              <input
                id="title"
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
                maxLength={150}
                className="w-full px-4 py-3 text-base bg-stone-50 dark:bg-stone-800 border border-stone-300 dark:border-stone-600 rounded-sm text-stone-900 dark:text-stone-50 focus:outline-none focus:border-slate-800 dark:focus:border-slate-500 transition"
                placeholder="e.g. Pothole on Main Street"
              />
              <p className="text-xs text-stone-500 dark:text-stone-500 mt-1">
                {title.length}/150 characters
              </p>
            </div>

            {/* Category */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-stone-700 dark:text-stone-300 mb-2">
                Category *
              </label>
              <div className="flex flex-wrap gap-2">
                {CATEGORIES.map((c) => (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => setCategoryId(c.id)}
                    className={`px-4 py-2 text-xs font-semibold uppercase tracking-wider rounded-sm border transition ${
                      categoryId === c.id
                        ? "bg-amber-600 text-stone-900 border-amber-700 shadow-sm shadow-amber-600/30"
                        : "bg-amber-50 dark:bg-stone-800 text-stone-700 dark:text-stone-300 border-stone-400 dark:border-stone-600 hover:border-amber-600 dark:hover:border-amber-500"
                    }`}
                  >
                    {c.name}
                  </button>
                ))}
              </div>
            </div>

            {/* Description */}
            <div>
              <label
                htmlFor="description"
                className="block text-xs font-semibold uppercase tracking-wider text-stone-700 dark:text-stone-300 mb-2"
              >
                Description *
              </label>
              <textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                required
                rows={4}
                className="w-full px-4 py-3 text-base bg-stone-50 dark:bg-stone-800 border border-stone-300 dark:border-stone-600 rounded-sm text-stone-900 dark:text-stone-50 focus:outline-none focus:border-slate-800 dark:focus:border-slate-500 transition resize-y"
                placeholder="Describe the issue in detail. When did you notice it? How bad is it?"
              />
            </div>

            {/* Severity */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-stone-700 dark:text-stone-300 mb-2">
                Severity: {severity}/5
              </label>
              <div className="flex items-center gap-2">
                {[1, 2, 3, 4, 5].map((n) => (
                  <button
                    key={n}
                    type="button"
                    onClick={() => setSeverity(n)}
                    className={`h-10 w-10 flex items-center justify-center text-sm font-semibold rounded-sm border transition ${
                      n <= severity
                        ? "bg-amber-600 text-stone-900 border-amber-700"
                        : "bg-amber-50 dark:bg-stone-800 text-stone-600 dark:text-stone-400 border-stone-400 dark:border-stone-600 hover:border-amber-600"
                    }`}
                  >
                    {n}
                  </button>
                ))}
              </div>
              <p className="text-xs text-stone-500 dark:text-stone-500 mt-1">
                1 = minor annoyance, 5 = urgent/safety risk
              </p>
            </div>

            {/* Location */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-stone-700 dark:text-stone-300 mb-2">
                Location *
              </label>
              <button
                type="button"
                onClick={handleUseLocation}
                disabled={locating}
                className="mb-3 px-4 py-2 text-xs font-semibold uppercase tracking-wider text-stone-900 dark:text-stone-100 bg-amber-50 dark:bg-stone-800 rounded-sm hover:bg-amber-100 dark:hover:bg-stone-700 border border-stone-400 dark:border-stone-600 transition disabled:opacity-50"
              >
                {locating ? "Locating..." : "📍 Use my current location"}
              </button>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label
                    htmlFor="latitude"
                    className="block text-xs text-stone-600 dark:text-stone-400 mb-1"
                  >
                    Latitude
                  </label>
                  <input
                    id="latitude"
                    type="number"
                    step="any"
                    value={latitude}
                    onChange={(e) => setLatitude(e.target.value)}
                    required
                    className="w-full px-3 py-2 text-sm font-mono bg-stone-50 dark:bg-stone-800 border border-stone-300 dark:border-stone-600 rounded-sm text-stone-900 dark:text-stone-50 focus:outline-none focus:border-slate-800 dark:focus:border-slate-500 transition"
                    placeholder="24.8607"
                  />
                </div>
                <div>
                  <label
                    htmlFor="longitude"
                    className="block text-xs text-stone-600 dark:text-stone-400 mb-1"
                  >
                    Longitude
                  </label>
                  <input
                    id="longitude"
                    type="number"
                    step="any"
                    value={longitude}
                    onChange={(e) => setLongitude(e.target.value)}
                    required
                    className="w-full px-3 py-2 text-sm font-mono bg-stone-50 dark:bg-stone-800 border border-stone-300 dark:border-stone-600 rounded-sm text-stone-900 dark:text-stone-50 focus:outline-none focus:border-slate-800 dark:focus:border-slate-500 transition"
                    placeholder="67.0011"
                  />
                </div>
              </div>
              <p className="text-xs text-stone-500 dark:text-stone-500 mt-2">
                Interactive map picker coming in Phase 6e
              </p>
            </div>

            {/* Submit */}
            <div className="pt-4 border-t border-stone-300 dark:border-stone-700">
              <button
                type="submit"
                disabled={submitting}
                className="w-full px-6 py-4 text-sm font-semibold uppercase tracking-wider text-stone-900 bg-amber-600 rounded-sm hover:bg-amber-500 shadow-md shadow-amber-600/30 hover:shadow-lg hover:shadow-amber-600/40 transition-all border border-amber-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {submitting ? "Submitting..." : "Submit Report"}
              </button>
            </div>
          </form>
        </div>
      </main>

      <footer className="bg-slate-900 dark:bg-slate-950 text-amber-50 py-6 border-t-4 border-amber-600 mt-12">
        <div className="max-w-6xl mx-auto px-4 text-center">
          <p className="font-serif italic text-sm">
            FixMyArea · Built for communities
          </p>
        </div>
      </footer>
    </>
  );
}
