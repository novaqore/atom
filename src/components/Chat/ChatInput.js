import React, { useState, useEffect } from "react";
import { homedir } from "node:os";
import { Box, Text } from "ink";
import TextInput from "ink-text-input";

const SPINNER_FRAMES = ["⠋", "⠙", "⠹", "⠸", "⠼", "⠴", "⠦", "⠧", "⠇", "⠏"];

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

export function ChatInput({ value, onChange, onSubmit, cwd, totalTokens, loading }) {
  const [cursorOn, setCursorOn] = useState(true);

  useEffect(() => {
    setCursorOn(true);
    const id = setInterval(() => setCursorOn((v) => !v), 500);
    return () => clearInterval(id);
  }, [value]);

  return React.createElement(
    Box,
    { flexDirection: "column", marginTop: 1 },
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
        showCursor: cursorOn,
      })
    ),
    React.createElement(
      Box,
      null,
      React.createElement(Text, { color: "yellow" }, shortPath(cwd)),
      React.createElement(
        Text,
        { dimColor: true },
        `  ${totalTokens.toLocaleString()} tokens`
      )
    )
  );
}
