import React from "react";
import { Box, Text, useApp } from "ink";
import SelectInput from "ink-select-input";
import { Header } from "../components/Header.js";
import { HOSTNAME, USERNAME, IS_ROOT } from "../utils/system.js";

function YellowIndicator({ isSelected }) {
  return React.createElement(
    Box,
    { marginRight: 1 },
    isSelected
      ? React.createElement(Text, { color: "yellow" }, "❯")
      : React.createElement(Text, null, " ")
  );
}

function YellowItem({ isSelected, label }) {
  const text = React.createElement(
    Text,
    isSelected ? { color: "yellow" } : null,
    label
  );
  if (label === "Exit") {
    return React.createElement(
      Box,
      { flexDirection: "column" },
      React.createElement(Text, { dimColor: true }, "──────"),
      text
    );
  }
  return text;
}

export function MainMenuScreen({
  version,
  unhinged,
  onboarded,
  onChat,
  onGetStarted,
  onSystem,
  onReset,
}) {
  const { exit } = useApp();

  const items = onboarded
    ? [
        { label: "Chat", value: "chat" },
        { label: "System", value: "system" },
        { label: "Reset", value: "reset" },
        { label: "Exit", value: "exit" },
      ]
    : [
        { label: "Get Started", value: "start" },
        { label: "System", value: "system" },
        { label: "Exit", value: "exit" },
      ];

  const handleSelect = (item) => {
    if (item.value === "chat") onChat();
    if (item.value === "start") onGetStarted();
    if (item.value === "system") onSystem();
    if (item.value === "reset") onReset();
    if (item.value === "exit") exit();
  };

  return React.createElement(
    Box,
    { flexDirection: "column", paddingBottom: 1 },
    React.createElement(Header, { version, unhinged }),
    React.createElement(
      Box,
      { paddingX: 1, marginTop: 1, flexDirection: "column" },
      React.createElement(
        Text,
        null,
        "Welcome. Atom will run as ",
        React.createElement(
          Text,
          { color: IS_ROOT ? "red" : "cyan", bold: true },
          USERNAME
        ),
        " on the ",
        React.createElement(
          Text,
          { color: "cyan", bold: true },
          HOSTNAME
        ),
        " system, with full access to read, write, and execute anything here."
      ),
      React.createElement(
        Text,
        null,
        "This is experimental, so use it at your own risk and have fun."
      )
    ),
    React.createElement(
      Box,
      { marginTop: 1, paddingX: 1 },
      React.createElement(SelectInput, {
        items,
        onSelect: handleSelect,
        indicatorComponent: YellowIndicator,
        itemComponent: YellowItem,
      })
    )
  );
}
