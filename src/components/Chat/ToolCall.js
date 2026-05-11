import React from "react";
import { Text } from "ink";

function formatName(name) {
  return name.charAt(0).toUpperCase() + name.slice(1);
}

function formatArgs(rawArgs) {
  try {
    const parsed = JSON.parse(rawArgs || "{}");
    const keys = Object.keys(parsed);
    if (keys.length === 1) return String(parsed[keys[0]]);
    return keys.map((k) => `${k}=${JSON.stringify(parsed[k])}`).join(", ");
  } catch {
    return rawArgs || "";
  }
}

export const ToolCall = React.memo(function ToolCall({ tc }) {
  return React.createElement(
    Text,
    null,
    React.createElement(
      Text,
      { bold: true, color: "yellow" },
      formatName(tc.function.name)
    ),
    React.createElement(Text, { dimColor: true }, "("),
    formatArgs(tc.function.arguments),
    React.createElement(Text, { dimColor: true }, ")")
  );
});
