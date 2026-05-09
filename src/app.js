import React, { useState } from "react";
import { accessSync } from "node:fs";
import { unlink } from "node:fs/promises";
import { OnboardingScreen } from "./screens/onboarding.js";
import { MainMenuScreen } from "./screens/main-menu.js";
import { ChatScreen } from "./screens/chat.js";
import { SystemScreen } from "./screens/system.js";
import { UnhingedWarningScreen } from "./screens/unhinged-warning.js";
import { SERVICE_FILE } from "./utils/paths.js";

function hasOnboardedSync() {
  try {
    accessSync(SERVICE_FILE);
    return true;
  } catch {
    return false;
  }
}

export function App({ version, unhinged }) {
  const [onboarded, setOnboarded] = useState(hasOnboardedSync);
  const [unhingedConfirmed, setUnhingedConfirmed] = useState(!unhinged);
  const [screen, setScreen] = useState(() =>
    unhinged && !unhingedConfirmed ? "unhinged-warning" : "main-menu"
  );

  const handleReset = async () => {
    await unlink(SERVICE_FILE).catch(() => {});
    setOnboarded(false);
  };

  if (screen === "unhinged-warning") {
    return React.createElement(UnhingedWarningScreen, {
      onConfirm: () => {
        setUnhingedConfirmed(true);
        setScreen("main-menu");
      },
    });
  }
  if (screen === "main-menu") {
    return React.createElement(MainMenuScreen, {
      version,
      unhinged,
      onboarded,
      onChat: () => setScreen("chat"),
      onGetStarted: () => setScreen("onboarding"),
      onSystem: () => setScreen("system"),
      onReset: handleReset,
    });
  }
  if (screen === "onboarding") {
    return React.createElement(OnboardingScreen, {
      version,
      unhinged,
      onComplete: () => {
        setOnboarded(true);
        setScreen("main-menu");
      },
      onBack: () => setScreen("main-menu"),
    });
  }
  if (screen === "chat") {
    return React.createElement(ChatScreen, { version, unhinged });
  }
  if (screen === "system") {
    return React.createElement(SystemScreen, {
      version,
      unhinged,
      onBack: () => setScreen("main-menu"),
    });
  }
  return null;
}
