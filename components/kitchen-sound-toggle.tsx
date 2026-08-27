"use client";

import { Volume2, VolumeOff, VolumeX } from "lucide-react";
import { useLocale } from "@/components/locale-provider";
import {
  armKitchenSound,
  isKitchenSoundMuted,
  playKitchenAlert,
  setKitchenSoundMuted,
} from "@/lib/audio";

export function KitchenSoundToggle({
  armed,
  muted,
  onArmed,
  onMuted,
}: {
  armed: boolean;
  muted: boolean;
  onArmed: (armed: boolean) => void;
  onMuted: (muted: boolean) => void;
}) {
  const { t } = useLocale();

  async function enable() {
    const ok = await armKitchenSound();
    if (!ok) {
      return;
    }
    setKitchenSoundMuted(false);
    onMuted(false);
    onArmed(true);
    playKitchenAlert();
  }

  function mute() {
    setKitchenSoundMuted(true);
    onMuted(true);
  }

  function unmute() {
    setKitchenSoundMuted(false);
    onMuted(false);
    void armKitchenSound().then(() => {
      playKitchenAlert();
    });
  }

  if (!armed) {
    return (
      <button
        type="button"
        onClick={() => void enable()}
        className="inline-flex h-9 items-center gap-2 rounded-md bg-accent px-3 text-xs font-medium text-accent-foreground"
      >
        <VolumeX className="size-3.5" />
        {t("kitchen.soundEnable")}
      </button>
    );
  }

  if (muted || isKitchenSoundMuted()) {
    return (
      <button
        type="button"
        onClick={unmute}
        className="inline-flex h-9 items-center gap-2 rounded-md border border-border px-3 text-xs font-medium hover:bg-subtle"
      >
        <VolumeOff className="size-3.5" />
        {t("kitchen.soundUnmute")}
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={mute}
      className="inline-flex h-9 items-center gap-2 rounded-md border border-accent/40 bg-accent/10 px-3 text-xs font-medium text-accent"
    >
      <Volume2 className="size-3.5" />
      {t("kitchen.soundMute")}
    </button>
  );
}
