import React from "react";
import { Box, Text } from "ink";
import SelectInput from "ink-select-input";

const items = [
  { label: "Yes", value: true },
  { label: "No", value: false },
];

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
  return React.createElement(
    Text,
    isSelected ? { color: "yellow" } : null,
    label
  );
}

export function ConfirmDangerousCommand({ command, onAnswer }) {
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
      indicatorComponent: YellowIndicator,
      itemComponent: YellowItem,
    })
  );
}
