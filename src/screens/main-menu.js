import React from "react";
import { Box, Text, useApp } from "ink";
import SelectInput from "ink-select-input";
import { unlink } from "node:fs/promises";
import { SERVICE_FILE } from "../utils/paths.js";

const items = [
  { label: "Chat", value: "chat" },
  { label: "Reset", value: "reset" },
  { label: "Exit", value: "exit" },
];

export function MainMenuScreen({ version, onChat, onReset }) {
  const { exit } = useApp();

  const handleSelect = async (item) => {
    if (item.value === "chat") onChat();
    if (item.value === "reset") {
      await unlink(SERVICE_FILE).catch(() => {});
      onReset();
    }
    if (item.value === "exit") exit();
  };

  return React.createElement(
    Box,
    { flexDirection: "column", paddingX: 1, paddingBottom: 1 },
    React.createElement(Text, { bold: true }, "Welcome to Atom"),
    React.createElement(
      Text,
      { dimColor: true },
      "A code agent that writes industry-standard code."
    ),
    React.createElement(Text, { dimColor: true }, `v${version}`),
    React.createElement(
      Box,
      { marginTop: 1 },
      React.createElement(SelectInput, { items, onSelect: handleSelect })
    )
  );
}
