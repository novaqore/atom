import React, { useState, useEffect } from "react";
import { access } from "node:fs/promises";
import { OnboardingScreen } from "./screens/onboarding.js";
import { MainMenuScreen } from "./screens/main-menu.js";
import { ChatScreen } from "./screens/chat.js";
import { UnhingedWarningScreen } from "./screens/unhinged-warning.js";
import { SERVICE_FILE } from "./utils/paths.js";

async function hasOnboarded() {
  try {
    await access(SERVICE_FILE);
    return true;
  } catch {
    return false;
  }
}

export function App({ version, unhinged }) {
  const [screen, setScreen] = useState("loading");
  const [unhingedConfirmed, setUnhingedConfirmed] = useState(!unhinged);

  useEffect(() => {
    if (unhinged && !unhingedConfirmed) {
      setScreen("unhinged-warning");
      return;
    }
    hasOnboarded().then((complete) =>
      setScreen(complete ? "main-menu" : "onboarding")
    );
  }, [unhinged, unhingedConfirmed]);

  if (screen === "loading") return null;
  if (screen === "unhinged-warning") {
    return React.createElement(UnhingedWarningScreen, {
      onConfirm: () => setUnhingedConfirmed(true),
    });
  }
  if (screen === "onboarding") {
    return React.createElement(OnboardingScreen, {
      version,
      onComplete: () => setScreen("main-menu"),
    });
  }
  if (screen === "main-menu") {
    return React.createElement(MainMenuScreen, {
      version,
      onChat: () => setScreen("chat"),
      onReset: () => setScreen("onboarding"),
    });
  }
  if (screen === "chat") {
    return React.createElement(ChatScreen, { version, unhinged });
  }
  return null;
}
