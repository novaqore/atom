import React from "react";
import { Box, Text } from "ink";
import SelectInput from "ink-select-input";

const items = [
  { label: "Yes", value: true },
  { label: "No", value: false },
];

export function ConfirmDangorusCommand({ command, onAnswer }) {
  return React.createElement(
    Box,
    {
      flexDirection: "column",
      borderStyle: "single",
      borderColor: "red",
      borderLeft: false,
      borderRight: false,
    },
    React.createElement(Text, { color: "red", bold: true }, `Run: ${command}`),
    React.createElement(SelectInput, {
      items,
      onSelect: (item) => onAnswer(item.value),
    })
  );
}
