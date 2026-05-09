import React from "react";
import { Box, useApp } from "ink";
import SelectInput from "ink-select-input";
import { unlink } from "node:fs/promises";
import { SERVICE_FILE } from "../utils/paths.js";
import { Header } from "../components/Header.js";

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
    { flexDirection: "column", paddingBottom: 1 },
    React.createElement(Header, { version }),
    React.createElement(
      Box,
      { marginTop: 1, paddingX: 1 },
      React.createElement(SelectInput, { items, onSelect: handleSelect })
    )
  );
}
