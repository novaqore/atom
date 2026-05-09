import React from "react";
import { arch } from "node:os";
import { Box, Text } from "ink";

const TAGLINE = "A code agent that writes industry-standard code.";

export function Header({ version }) {
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
    React.createElement(Text, { color: "cyan", bold: true }, "NovaQore"),
    React.createElement(
      Box,
      { marginTop: 1 },
      React.createElement(
        Box,
        { flexDirection: "column", marginRight: 2 },
        React.createElement(Text, { color: "blue", bold: true }, " ╲│╱ "),
        React.createElement(Text, { color: "blue", bold: true }, "─ ● ─"),
        React.createElement(Text, { color: "blue", bold: true }, " ╱│╲ ")
      ),
      React.createElement(
        Box,
        { flexDirection: "column" },
        React.createElement(
          Box,
          null,
          React.createElement(Text, { bold: true }, "Atom "),
          React.createElement(Text, { dimColor: true }, `v${version}`)
        ),
        React.createElement(Text, { dimColor: true }, TAGLINE),
        React.createElement(
          Text,
          { dimColor: true },
          `${platform} · node ${nodeVersion} · ${shell}`
        )
      )
    )
  );
}
