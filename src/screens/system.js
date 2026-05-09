import React from "react";
import { release, arch, cpus, totalmem } from "node:os";
import { Box, Text } from "ink";
import SelectInput from "ink-select-input";
import { Header } from "../components/Header.js";
import { RUNTIMES } from "../utils/runtimes.js";
import {
  HOSTNAME,
  USERNAME,
  IS_ROOT,
  DISK,
  getGPUs,
  getPackageManagers,
} from "../utils/system.js";

function Row({ label, value, color, dim }) {
  const valueProps = dim
    ? { dimColor: true }
    : color
      ? { color }
      : null;
  return React.createElement(
    Box,
    null,
    React.createElement(
      Box,
      { width: 14 },
      React.createElement(Text, { dimColor: true }, label)
    ),
    React.createElement(Text, valueProps, value)
  );
}

function Section({ title, rows }) {
  return React.createElement(
    Box,
    { flexDirection: "column", marginTop: 1 },
    React.createElement(Text, { color: "cyan", bold: true }, title),
    React.createElement(
      Box,
      { flexDirection: "column", paddingLeft: 2 },
      rows
    )
  );
}

export function SystemScreen({ version, unhinged, onBack }) {
  const platformStr = `${process.platform}/${arch()} (${release()})`;
  const shell = (process.env.SHELL || "").split("/").pop() || "shell";
  const cwd = process.cwd();

  const gpus = getGPUs();
  const pms = getPackageManagers();

  const cpuList = cpus();
  const cpuModel = cpuList?.[0]?.model?.trim() || "unknown";
  const cpuCount = cpuList?.length || 0;
  const cpuSpeed = cpuList?.[0]?.speed || 0;
  const cpuStr = cpuSpeed
    ? `${cpuCount} cores @ ${(cpuSpeed / 1000).toFixed(2)} GHz (${cpuModel})`
    : `${cpuCount} cores (${cpuModel})`;
  const ramStr = `${(totalmem() / 1024 ** 3).toFixed(1)} GB`;
  const diskStr = DISK
    ? `${(DISK.used / 1024 ** 3).toFixed(1)} GB used / ${(DISK.total / 1024 ** 3).toFixed(1)} GB total`
    : "unknown";

  const systemRows = [
    React.createElement(Row, {
      key: "host",
      label: "Hostname:",
      value: HOSTNAME,
    }),
    React.createElement(Row, {
      key: "user",
      label: "User:",
      value: USERNAME + (IS_ROOT ? " (root)" : ""),
      color: IS_ROOT ? "red" : undefined,
    }),
    React.createElement(Row, {
      key: "platform",
      label: "Platform:",
      value: platformStr,
    }),
    React.createElement(Row, { key: "shell", label: "Shell:", value: shell }),
    React.createElement(Row, {
      key: "cwd",
      label: "Working dir:",
      value: cwd,
    }),
  ];

  const pmRows = [];
  if (pms.system.length > 0) {
    pmRows.push(
      React.createElement(Row, {
        key: "pm-system",
        label: "System:",
        value: pms.system.join(", "),
      })
    );
  }
  if (pms.language.length > 0) {
    pmRows.push(
      React.createElement(Row, {
        key: "pm-language",
        label: "Language:",
        value: pms.language.join(", "),
      })
    );
  }
  if (pms.container.length > 0) {
    pmRows.push(
      React.createElement(Row, {
        key: "pm-container",
        label: "Container:",
        value: pms.container.join(", "),
      })
    );
  }

  const hardwareRows = [
    React.createElement(Row, { key: "cpu", label: "CPU:", value: cpuStr }),
    React.createElement(Row, { key: "mem", label: "Memory:", value: ramStr }),
  ];
  if (gpus.length > 0) {
    hardwareRows.push(
      React.createElement(Row, {
        key: "gpu",
        label: "GPU:",
        value: gpus.join(", "),
      })
    );
  }
  if (DISK) {
    hardwareRows.push(
      React.createElement(Row, { key: "disk", label: "Disk:", value: diskStr })
    );
  }

  const runtimeRows = Object.entries(RUNTIMES)
    .filter(([, value]) => value !== "not installed")
    .map(([key, value]) =>
      React.createElement(Row, {
        key,
        label: `${key}:`,
        value,
        color: "green",
      })
    );

  return React.createElement(
    Box,
    { flexDirection: "column", paddingBottom: 1 },
    React.createElement(Header, { version, unhinged }),
    React.createElement(
      Box,
      { flexDirection: "column", paddingX: 1 },
      React.createElement(Section, { title: "System", rows: systemRows }),
      React.createElement(Section, { title: "Hardware", rows: hardwareRows }),
      React.createElement(Section, { title: "Runtimes", rows: runtimeRows }),
      React.createElement(Section, {
        title: "Package Managers",
        rows: pmRows,
      }),
      React.createElement(
        Box,
        { marginTop: 1 },
        React.createElement(SelectInput, {
          items: [{ label: "Back", value: "back" }],
          onSelect: onBack,
        })
      )
    )
  );
}
