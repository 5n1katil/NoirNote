"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { onAuthStateChanged, type User } from "firebase/auth";
import { getFirebaseClient } from "@/lib/firebase.client";
import { getUserDoc, updateUserDoc } from "@/lib/userDoc.client";
import { AVATAR_OPTIONS, getAvatarById } from "@/lib/avatars";
import { textsTR } from "@/lib/texts.tr";

export default function ProfileSetupClient() {
  const router = useRouter();
  const { auth } = getFirebaseClient();

  const [user, setUser] = useState<User | null>(auth.currentUser);
  const [username, setUsername] = useState("");
  const [selectedAvatar, setSelectedAvatar] = useState<string>(AVATAR_OPTIONS[0].id);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      if (!currentUser) {
        router.replace("/login");
        return;
      }

      // Check if profile setup is already completed
      try {
        const userDoc = await getUserDoc(currentUser.uid);
        if (userDoc?.profileSetupCompleted) {
          router.replace("/dashboard");
          return;
        }
        setLoading(false);
      } catch (err) {
        console.error("[ProfileSetup] Error checking profile:", err);
        setLoading(false);
      }
    });

    return () => unsub();
  }, [auth, router]);

  function validateUsername(value: string): string | null {
    if (!value.trim()) {
      return textsTR.profileSetup.usernameRequired;
    }
    if (value.length < 3) {
      return textsTR.profileSetup.usernameMinLength;
    }
    if (value.length > 20) {
      return textsTR.profileSetup.usernameMaxLength;
    }
    // Only allow alphanumeric, underscore, and Turkish characters
    if (!/^[a-zA-Z0-9_çğıöşüÇĞIİÖŞÜ]+$/.test(value)) {
      return textsTR.profileSetup.usernameInvalid;
    }
    return null;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!user) {
      setError("Kullanıcı oturumu bulunamadı.");
      return;
    }

    const validationError = validateUsername(username);
    if (validationError) {
      setError(validationError);
      return;
    }

    setSaving(true);

    try {
      await updateUserDoc(user.uid, {
        detectiveUsername: username.trim(),
        avatar: selectedAvatar,
        profileSetupCompleted: true,
      });

      // Redirect to dashboard
      router.replace("/dashboard");
    } catch (err: any) {
      console.error("[ProfileSetup] Error saving profile:", err);
      setError(err?.message || "Profil kaydedilirken bir hata oluştu.");
      setSaving(false);
    }
  }

  if (loading || !user) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="text-zinc-400">{textsTR.common.loading}</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white">
      <div className="max-w-2xl mx-auto px-6 py-12">
        <div className="rounded-xl border border-zinc-800 bg-gradient-to-br from-zinc-900 to-zinc-950 p-8 shadow-lg shadow-black/20">
          <h1 className="text-3xl font-bold text-white mb-2">{textsTR.profileSetup.title}</h1>
          <p className="text-zinc-400 mb-8">{textsTR.profileSetup.subtitle}</p>

          <form onSubmit={handleSubmit} className="space-y-8">
            {/* Username Field */}
            <div>
              <label htmlFor="username" className="block text-sm font-semibold text-zinc-300 mb-2">
                {textsTR.profileSetup.usernameLabel}
              </label>
              <input
                id="username"
                type="text"
                value={username}
                onChange={(e) => {
                  setUsername(e.target.value);
                  setError(null);
                }}
                placeholder={textsTR.profileSetup.usernamePlaceholder}
                className="w-full rounded-lg border border-zinc-800 bg-zinc-950 px-4 py-3 text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-white/30 focus:border-zinc-700 transition-all"
                maxLength={20}
                disabled={saving}
              />
              <p className="mt-1 text-xs text-zinc-500">
                {username.length}/20 karakter
              </p>
            </div>

            {/* Avatar Selection */}
            <div>
              <label className="block text-sm font-semibold text-zinc-300 mb-4">
                {textsTR.profileSetup.avatarLabel}
              </label>
              <div className="grid grid-cols-4 sm:grid-cols-8 gap-3">
                {AVATAR_OPTIONS.map((avatar) => (
                  <button
                    key={avatar.id}
                    type="button"
                    onClick={() => setSelectedAvatar(avatar.id)}
                    disabled={saving}
                    className={`aspect-square rounded-lg border-2 transition-all ${
                      selectedAvatar === avatar.id
                        ? "border-white bg-white/10 scale-110"
                        : "border-zinc-800 bg-zinc-950 hover:border-zinc-700 hover:bg-zinc-900"
                    } disabled:opacity-50 disabled:cursor-not-allowed`}
                    title={avatar.label}
                  >
                    <span className="text-2xl">{avatar.emoji}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Error Message */}
            {error && (
              <div
                role="alert"
                className="rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-400"
              >
                {error}
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={saving || !username.trim()}
              className="w-full rounded-lg bg-white text-black px-6 py-3 text-sm font-semibold hover:bg-zinc-200 active:scale-95 transition-all duration-200 shadow-lg shadow-black/20 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-white"
            >
              {saving ? textsTR.profileSetup.saving : textsTR.profileSetup.saveButton}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
