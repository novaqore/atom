import React, { useState, useEffect } from "react";
import { homedir } from "node:os";
import { Box, Text } from "ink";
import TextInput from "ink-text-input";
import { HOSTNAME, USERNAME } from "../../utils/system.js";

const SPINNER_FRAMES = ["⠋", "⠙", "⠹", "⠸", "⠼", "⠴", "⠦", "⠧", "⠇", "⠏"];
const CONTEXT_TOTAL = 262144;

function Spinner() {
  const [i, setI] = useState(0);
  useEffect(() => {
    const id = setInterval(
      () => setI((n) => (n + 1) % SPINNER_FRAMES.length),
      80
    );
    return () => clearInterval(id);
  }, []);
  return React.createElement(Text, { color: "cyan" }, SPINNER_FRAMES[i]);
}

function shortPath(p) {
  const home = homedir();
  if (p === home) return "~";
  if (p.startsWith(home + "/")) return "~" + p.slice(home.length);
  return p;
}

export function ChatInput({
  value,
  onChange,
  onSubmit,
  cwd,
  totalTokens,
  loading,
  disabled,
}) {
  return React.createElement(
    Box,
    { flexDirection: "column" },
    loading
      ? React.createElement(
          Box,
          null,
          React.createElement(Spinner),
          React.createElement(Text, { dimColor: true }, " Responding...")
        )
      : null,
    React.createElement(
      Box,
      null,
      React.createElement(
        Text,
        { color: "white" },
        `${USERNAME}@${HOSTNAME} `
      ),
      React.createElement(Text, { color: "yellow" }, shortPath(cwd)),
      React.createElement(
        Text,
        { dimColor: true },
        `  ${totalTokens.toLocaleString()}/${CONTEXT_TOTAL.toLocaleString()} tokens`
      )
    ),
    React.createElement(
      Box,
      {
        borderStyle: "single",
        borderTop: true,
        borderBottom: true,
        borderLeft: false,
        borderRight: false,
        borderColor: "gray",
      },
      React.createElement(Text, { dimColor: true }, "❯ "),
      React.createElement(TextInput, {
        value,
        onChange,
        onSubmit,
        showCursor: !disabled,
        focus: !disabled,
      })
    )
  );
}
