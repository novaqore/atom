import React from "react";
import { Box, Text } from "ink";

const MAX_OUTPUT_LINES = 2;

function formatMs(ms) {
  return ms < 1000 ? `${ms}ms` : `${(ms / 1000).toFixed(1)}s`;
}

export const ToolResult = React.memo(function ToolResult({ msg, duration }) {
  const content = (msg.content || "").trimEnd();
  const dur = duration ? ` · ${formatMs(duration)}` : "";

  if (!content) {
    return React.createElement(
      Box,
      { paddingLeft: 2, marginBottom: 1 },
      React.createElement(Text, { dimColor: true }, `⎿  (No output)${dur}`)
    );
  }

  const lines = content.split("\n");
  const visible = lines.slice(0, MAX_OUTPUT_LINES);
  const overflow = lines.length - MAX_OUTPUT_LINES;

  const children = visible.map((line, idx) => {
    const isLastShown = idx === visible.length - 1 && overflow === 0;
    const suffix = isLastShown ? dur : "";
    return React.createElement(
      Text,
      { key: `line-${idx}`, dimColor: true },
      idx === 0 ? `⎿  ${line}${suffix}` : `   ${line}${suffix}`
    );
  });
  if (overflow > 0) {
    children.push(
      React.createElement(
        Text,
        { key: "overflow", dimColor: true },
        `   … +${overflow} lines${dur}`
      )
    );
  }

  return React.createElement(
    Box,
    { flexDirection: "column", paddingLeft: 2, marginBottom: 1 },
    children
  );
});
