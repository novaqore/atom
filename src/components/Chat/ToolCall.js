import React from "react";
import { Text } from "ink";

function formatName(name) {
  return name.charAt(0).toUpperCase() + name.slice(1);
}

function parseArgs(rawArgs) {
  if (!rawArgs) return null;
  try {
    const parsed = JSON.parse(rawArgs);
    const keys = Object.keys(parsed);
    if (keys.length === 0) return "";
    if (keys.length === 1) return String(parsed[keys[0]]);
    return keys.map((k) => `${k}=${JSON.stringify(parsed[k])}`).join(", ");
  } catch {}
  const m = rawArgs.match(/"[^"]+"\s*:\s*"((?:\\.|[^"\\])*)/);
  if (m) {
    try {
      return JSON.parse('"' + m[1] + '"');
    } catch {
      return m[1];
    }
  }
  return null;
}

export const ToolCall = React.memo(function ToolCall({ tc, streaming = false }) {
  const parsed = parseArgs(tc.function.arguments);
  const name = React.createElement(
    Text,
    { bold: true, color: "yellow" },
    formatName(tc.function.name)
  );

  let args;
  if (parsed !== null) {
    args = parsed;
  } else if (streaming) {
    return React.createElement(Text, null, name);
  } else {
    args = tc.function.arguments || "";
  }

  return React.createElement(
    Text,
    null,
    name,
    React.createElement(Text, { dimColor: true }, "("),
    args,
    React.createElement(Text, { dimColor: true }, ")")
  );
});
