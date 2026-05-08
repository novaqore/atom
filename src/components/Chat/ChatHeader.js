import React from "react";
import { arch } from "node:os";
import { Box, Text } from "ink";

export function ChatHeader({ version }) {
  const platform = `${process.platform}/${arch()}`;
  const nodeVersion = process.version;
  const shell = (process.env.SHELL || "").split("/").pop() || "shell";

  return React.createElement(
    Box,
    {
      borderStyle: "round",
      borderColor: "blue",
      paddingX: 2,
      flexDirection: "column",
    },
    React.createElement(
      Box,
      null,
      React.createElement(Text, { color: "cyan", bold: true }, "</>"),
      React.createElement(Text, null, "  Atom  "),
      React.createElement(Text, { dimColor: true }, `v${version}`)
    ),
    React.createElement(
      Text,
      { dimColor: true },
      `${platform} · node ${nodeVersion} · ${shell}`
    )
  );
}
