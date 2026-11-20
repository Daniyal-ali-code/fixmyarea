"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import dynamic from "next/dynamic";
import { useAuth } from "@/components/AuthProvider";
import {
  Alert,
  LoadingNote,
  PinIcon,
  CameraIcon,
  labelClass,
  helperClass,
  inputClass,
  textareaClass,
  textLinkClass,
  chipActive,
  chipInactive,
  btnPrimary,
  btnSecondary,
  eyebrowClass,
} from "@/components/ui";

const LocationPicker = dynamic(
  () => import("@/components/LocationPicker"),
  {
    ssr: false,
    loading: () => (
      <div
        className="rounded-sm border border-stone-300 dark:border-stone-700 bg-stone-100 dark:bg-stone-800 animate-pulse"
        style={{ height: 320 }}
      />
    ),
  }
);

const FALLBACK_CATEGORIES = [
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
  const [address, setAddress] = useState("");

  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [locating, setLocating] = useState(false);
  const [duplicates, setDuplicates] = useState(null);
  const [photos, setPhotos] = useState([]);
  const [photoPreviews, setPhotoPreviews] = useState([]);
  const [categories, setCategories] = useState(FALLBACK_CATEGORIES);

  // Categories come from the API; the hardcoded list is only a fallback
  // so the form still works if the fetch fails.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/categories", { credentials: "include" });
        if (!res.ok) return;
        const data = await res.json();
        if (!cancelled && Array.isArray(data.categories) && data.categories.length > 0) {
          setCategories(data.categories);
        }
      } catch (err) {
        console.error("Failed to load categories:", err);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!loading && !user) {
      router.push("/login");
    } else if (!loading && user && user.role === "admin") {
      router.push("/admin");
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
        setError("Could not get your location. Click on the map or enter coordinates manually.");
        setLocating(false);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  }

  function handleMapPick(lat, lng) {
    setLatitude(lat.toFixed(6));
    setLongitude(lng.toFixed(6));
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
      setError("Please select a location on the map or use your current location.");
      setSubmitting(false);
      return;
    }

    if (lat < -90 || lat > 90) {
      setError("Latitude must be between -90 and 90.");
      setSubmitting(false);
      return;
    }

    if (lng < -180 || lng > 180) {
      setError("Longitude must be between -180 and 180.");
      setSubmitting(false);
      return;
    }

    try {
      const url = force ? "/api/reports?force=true" : "/api/reports";

      const res = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          title,
          description,
          category_id: categoryId,
          latitude: lat,
          longitude: lng,
          severity,
          address: address.trim() || null,
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

      const newReportId = data.report.id;

      if (photos.length > 0) {
        try {
          const imgForm = new FormData();
          photos.forEach((p) => imgForm.append("images", p));

          const imgRes = await fetch(`/api/reports/${newReportId}/images`, {
            method: "POST",
            credentials: "include",
            body: imgForm,
          });

          if (!imgRes.ok) {
            const imgData = await imgRes.json().catch(() => ({}));
            setError(
              imgData.error ||
                "Report saved, but the photo upload failed. Please add photos from the report page."
            );
            setSubmitting(false);
            return;
          }
        } catch (imgErr) {
          console.error("Image upload error:", imgErr);
          setError(
            "Report saved, but the photo upload failed. Please add photos from the report page."
          );
          setSubmitting(false);
          return;
        }
      }

      router.push(`/reports/${newReportId}`);
    } catch (err) {
      console.error("Submit error:", err);
      setError("Something went wrong. Please try again.");
      setSubmitting(false);
    }
  }

  function handlePhotosChange(e) {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    const valid = files.filter((f) => {
      if (!["image/jpeg", "image/png", "image/webp"].includes(f.type)) {
        setError(`"${f.name}" is not a JPEG, PNG, or WEBP image.`);
        return false;
      }
      if (f.size > 5 * 1024 * 1024) {
        setError(`"${f.name}" is larger than 5 MB.`);
        return false;
      }
      return true;
    });
    if (valid.length === 0) return;

    const combined = [...photos, ...valid].slice(0, 3);
    setPhotos(combined);

    const previews = combined.map((f) => URL.createObjectURL(f));
    photoPreviews.forEach((p) => URL.revokeObjectURL(p));
    setPhotoPreviews(previews);
  }

  function removePhoto(index) {
    const newPhotos = photos.filter((_, i) => i !== index);
    const newPreviews = photoPreviews.filter((_, i) => i !== index);
    URL.revokeObjectURL(photoPreviews[index]);
    setPhotos(newPhotos);
    setPhotoPreviews(newPreviews);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    await submitReport(false);
  }

  if (loading || !user) {
    return (
      <main className="min-h-screen bg-amber-50 dark:bg-stone-900">
        <LoadingNote>Loading...</LoadingNote>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-amber-50 dark:bg-stone-900">
        <div className="max-w-2xl mx-auto px-4 py-8">
          <Link
            href="/reports"
            className={`${textLinkClass} mb-6`}
          >
            ← Back to reports
          </Link>

          <div className="mb-6">
            <p className={eyebrowClass}>
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
                  className={btnPrimary}
                >
                  Submit Anyway
                </button>
                <button
                  onClick={() => setDuplicates(null)}
                  className={btnSecondary}
                >
                  Edit My Report
                </button>
              </div>
            </div>
          )}

          {error && <Alert className="mb-4">{error}</Alert>}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label
                htmlFor="title"
                className={labelClass}
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
                className={inputClass}
                placeholder="e.g. Pothole on Main Street"
              />
              <p className={helperClass}>
                {title.length}/150 characters
              </p>
            </div>

            <div>
              <label className={labelClass}>
                Category *
              </label>
              <div className="flex flex-wrap gap-2">
                {categories.map((c) => (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => setCategoryId(c.id)}
                    aria-pressed={categoryId === c.id}
                    className={categoryId === c.id ? chipActive : chipInactive}
                  >
                    {c.name}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label
                htmlFor="description"
                className={labelClass}
              >
                Description *
              </label>
              <textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                required
                rows={4}
                className={textareaClass}
                placeholder="Describe the issue in detail. When did you notice it? How bad is it?"
              />
            </div>

            <div>
              <label className={labelClass}>
                Severity: {severity}/5
              </label>
              <div className="flex items-center gap-2">
                {[1, 2, 3, 4, 5].map((n) => (
                  <button
                    key={n}
                    type="button"
                    onClick={() => setSeverity(n)}
                    aria-pressed={severity === n}
                    aria-label={`Severity ${n} of 5`}
                    className={`h-11 w-11 flex items-center justify-center text-sm font-semibold rounded-sm border transition active:scale-95 ${
                      n <= severity
                        ? "bg-amber-600 text-stone-900 border-amber-700"
                        : "bg-amber-50 dark:bg-stone-800 text-stone-600 dark:text-stone-400 border-stone-400 dark:border-stone-600 hover:border-amber-600"
                    }`}
                  >
                    {n}
                  </button>
                ))}
              </div>
              <p className={helperClass}>
                1 = minor annoyance, 5 = urgent/safety risk
              </p>
            </div>

            <div>
              <label className={labelClass}>
                Location *
              </label>
              <p className="text-xs text-stone-600 dark:text-stone-400 mb-3 font-serif italic">
                Click anywhere on the map to place a pin, or drag the pin to adjust. You can also use your device&apos;s GPS below.
              </p>

              <LocationPicker
                latitude={latitude}
                longitude={longitude}
                onPick={handleMapPick}
              />

              <div className="flex flex-wrap items-center gap-3 mt-3">
                <button
                  type="button"
                  onClick={handleUseLocation}
                  disabled={locating}
                  className={`${btnSecondary} gap-2`}
                >
                  {locating ? (
                    "Locating..."
                  ) : (
                    <>
                      <PinIcon className="w-4 h-4" /> Use my current location
                    </>
                  )}
                </button>

                {latitude && longitude && (
                  <span className="text-xs font-mono text-stone-600 dark:text-stone-400">
                    {latitude}, {longitude}
                  </span>
                )}
              </div>

              <details className="mt-3">
                <summary className="text-xs text-stone-500 dark:text-stone-500 cursor-pointer font-serif italic">
                  Enter coordinates manually ▾
                </summary>
                <div className="grid grid-cols-2 gap-3 mt-2">
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
                      className="w-full px-3 py-2 text-sm font-mono bg-amber-50 dark:bg-stone-900 border border-stone-300 dark:border-stone-600 rounded-sm text-stone-900 dark:text-stone-50 transition"
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
                      className="w-full px-3 py-2 text-sm font-mono bg-amber-50 dark:bg-stone-900 border border-stone-300 dark:border-stone-600 rounded-sm text-stone-900 dark:text-stone-50 transition"
                      placeholder="67.0011"
                    />
                  </div>
                </div>
              </details>
            </div>

            <div>
              <label
                htmlFor="address"
                className={labelClass}
              >
                Address (optional)
              </label>
              <input
                id="address"
                type="text"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                maxLength={250}
                className={inputClass}
                placeholder="e.g. Street 5, Block B, Korangi"
              />
              <p className={helperClass}>
                Helps others find the exact spot.
              </p>
            </div>

            <div>
              <label className={labelClass}>
                Photos (optional, up to 3)
              </label>

              {photoPreviews.length > 0 && (
                <div className="grid grid-cols-3 gap-3 mb-3">
                  {photoPreviews.map((preview, idx) => (
                    <div
                      key={idx}
                      className="relative aspect-square bg-stone-100 dark:bg-stone-900 border border-stone-300 dark:border-stone-700 rounded-sm overflow-hidden"
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={preview}
                        alt={`Photo ${idx + 1}`}
                        className="w-full h-full object-cover"
                      />
                      <button
                        type="button"
                        onClick={() => removePhoto(idx)}
                        className="absolute top-1 right-1 h-8 w-8 flex items-center justify-center bg-stone-900/80 text-white text-sm rounded-full hover:bg-red-600 transition active:scale-95"
                        aria-label="Remove photo"
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {photos.length < 3 && (
                <label className="inline-flex items-center gap-2 px-4 py-2.5 min-h-11 text-xs font-semibold uppercase tracking-wider text-stone-900 dark:text-stone-100 bg-amber-50 dark:bg-stone-800 rounded-sm hover:bg-amber-100 dark:hover:bg-stone-700 border border-stone-400 dark:border-stone-600 transition cursor-pointer">
                  <CameraIcon className="w-4 h-4" /> Add Photo {photos.length > 0 && `(${photos.length}/3)`}
                  <input
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    capture="environment"
                    multiple
                    onChange={handlePhotosChange}
                    className="hidden"
                  />
                </label>
              )}

              <p className="text-xs text-stone-500 dark:text-stone-500 mt-2">
                On mobile, tap to open your camera or choose from gallery. Max 3 photos, 5 MB each.
              </p>
            </div>

            <div className="pt-4 border-t border-stone-300 dark:border-stone-700">
              <button
                type="submit"
                disabled={submitting}
                className={`${btnPrimary} w-full`}
              >
                {submitting ? "Submitting..." : "Submit Report"}
              </button>
            </div>
          </form>
        </div>
    </main>
  );
}
