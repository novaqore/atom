import React from "react";
import { Box, Text } from "ink";

function formatMs(ms) {
  return ms < 1000 ? `${ms}ms` : `${(ms / 1000).toFixed(1)}s`;
}

export function RunningIndicator({ elapsed }) {
  return React.createElement(
    Box,
    { paddingLeft: 2, marginBottom: 1 },
    React.createElement(
      Text,
      { dimColor: true },
      `⎿  running ${formatMs(elapsed)}`
    )
  );
}
