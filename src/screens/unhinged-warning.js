import React from "react";
import { Box, Text, useApp } from "ink";
import SelectInput from "ink-select-input";

const items = [
  { label: "I understand, continue", value: true },
  { label: "Cancel", value: false },
];

export function UnhingedWarningScreen({ onConfirm }) {
  const { exit } = useApp();

  return React.createElement(
    Box,
    { flexDirection: "column", paddingX: 1, paddingBottom: 1 },
    React.createElement(Text, { color: "red", bold: true }, "UNHINGED MODE"),
    React.createElement(
      Box,
      { marginTop: 1, flexDirection: "column" },
      React.createElement(
        Text,
        null,
        "Atom will run shell commands on this machine without asking for confirmation, including destructive ones like rm and sudo."
      ),
      React.createElement(Text, null, ""),
      React.createElement(
        Text,
        null,
        "Best used on isolated environments such as AWS instances, DigitalOcean droplets, or disposable containers."
      ),
      React.createElement(Text, null, ""),
      React.createElement(
        Text,
        { dimColor: true },
        "Do not run on a personal machine with important files, production systems, or anywhere with credentials you care about."
      )
    ),
    React.createElement(
      Box,
      { marginTop: 1 },
      React.createElement(SelectInput, {
        items,
        onSelect: (item) => (item.value ? onConfirm() : exit()),
      })
    )
  );
}
