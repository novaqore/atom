import React from "react";
import { Box, Text } from "ink";

export function UserMessage({ content }) {
  return React.createElement(
    Box,
    { marginBottom: 1 },
    React.createElement(
      Text,
      null,
      React.createElement(Text, { bold: true, color: "white" }, "You:"),
      " ",
      React.createElement(Text, { dimColor: true }, content)
    )
  );
}
