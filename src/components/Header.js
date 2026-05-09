import React from "react";
import { arch, cpus, totalmem } from "node:os";
import { Box, Text } from "ink";
import { DISK } from "../utils/system.js";
import { RUNTIMES } from "../utils/runtimes.js";

export function Header({ version, unhinged }) {
  const cpuList = cpus();
  const cpuCount = cpuList?.length || 0;
  const cpuSpeed = cpuList?.[0]?.speed || 0;
  const cpuInfo = cpuSpeed
    ? `${cpuCount}c @ ${(cpuSpeed / 1000).toFixed(2)} GHz`
    : `${cpuCount} cores`;
  const ramInfo = `${(totalmem() / 1024 ** 3).toFixed(1)} GB`;
  const diskInfo = DISK
    ? `${(DISK.used / 1024 ** 3).toFixed(0)}/${(DISK.total / 1024 ** 3).toFixed(0)} GB`
    : null;

  const runtimeParts = [arch(), `node ${RUNTIMES.node}`];
  if (RUNTIMES.python !== "not installed") {
    runtimeParts.push(`python ${RUNTIMES.python}`);
  }

  const hardwareParts = [cpuInfo, ramInfo];
  if (diskInfo) hardwareParts.push(diskInfo);

  return React.createElement(
    Box,
    {
      borderStyle: "round",
      borderColor: "cyan",
      paddingX: 2,
      marginBottom: 1,
    },
    React.createElement(
      Box,
      { flexDirection: "column", marginRight: 2 },
      React.createElement(Text, { color: "cyan", bold: true }, " ╲│╱ "),
      React.createElement(Text, { color: "cyan", bold: true }, "─ ● ─"),
      React.createElement(Text, { color: "cyan", bold: true }, " ╱│╲ ")
    ),
    React.createElement(
      Box,
      { flexDirection: "column" },
      React.createElement(
        Box,
        null,
        React.createElement(Text, { color: "cyan", bold: true }, "Atom "),
        React.createElement(Text, { dimColor: true }, `v${version}  ·  `),
        React.createElement(Text, { color: "white", bold: true }, "NovaQore"),
        React.createElement(Text, { dimColor: true }, "  ·  mode: "),
        React.createElement(
          Text,
          unhinged
            ? { color: "red", bold: true }
            : { color: "green", bold: true },
          unhinged ? "unhinged" : "normal"
        )
      ),
      React.createElement(Text, { dimColor: true }, runtimeParts.join(" · ")),
      React.createElement(Text, { dimColor: true }, hardwareParts.join(" · "))
    )
  );
}
