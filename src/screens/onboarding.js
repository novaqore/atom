import React, { useState, useEffect, useRef } from "react";
import { Box, Text, useApp, useStdin } from "ink";
import SelectInput from "ink-select-input";
import { writeFile, mkdir } from "node:fs/promises";
import { ATOM_DIR, SERVICE_FILE } from "../utils/paths.js";

const STEPS = [
  { key: "uid", label: "Enter your UID" },
  { key: "keyId", label: "Enter your Key ID" },
  { key: "quantumKey", label: "Enter your Quantum Key" },
];

const welcomeItems = [
  { label: "Get Started", value: "start" },
  { label: "Exit", value: "exit" },
];

function PasteInput({ onSubmit }) {
  const { stdin, setRawMode } = useStdin();
  const [value, setValue] = useState("");
  const valueRef = useRef("");

  useEffect(() => {
    setRawMode(true);
    const handler = (data) => {
      const str = data.toString();

      const newlineIdx = str.search(/\r|\n/);
      if (newlineIdx >= 0) {
        const before = str.slice(0, newlineIdx).replace(/[\x00-\x1f\x7f]/g, "");
        valueRef.current += before;
        onSubmit(valueRef.current);
        return;
      }
      if (str === "\x7f" || str === "\b") {
        valueRef.current = valueRef.current.slice(0, -1);
        setValue(valueRef.current);
        return;
      }
      if (str === "\x03") {
        process.exit(0);
      }
      const cleaned = str.replace(/[\x00-\x1f\x7f]/g, "");
      if (cleaned) {
        valueRef.current += cleaned;
        setValue(valueRef.current);
      }
    };
    stdin.on("data", handler);
    return () => {
      stdin.off("data", handler);
      setRawMode(false);
    };
  }, [onSubmit, stdin, setRawMode]);

  return React.createElement(Text, null, value);
}

export function OnboardingScreen({ version, onComplete }) {
  const [phase, setPhase] = useState("welcome");
  const [step, setStep] = useState(0);
  const [values, setValues] = useState({});
  const [saved, setSaved] = useState(false);
  const { exit } = useApp();

  useEffect(() => {
    if (phase !== "steps" || step < STEPS.length || saved) return;
    setSaved(true);
    mkdir(ATOM_DIR, { recursive: true, mode: 0o700 })
      .then(() =>
        writeFile(SERVICE_FILE, JSON.stringify(values, null, 2), { mode: 0o600 })
      )
      .then(() => onComplete());
  }, [phase, step, saved, values, onComplete]);

  const header = [
    React.createElement(Text, { bold: true, key: "title" }, "Welcome to Atom"),
    React.createElement(
      Text,
      { dimColor: true, key: "tagline" },
      "A code agent that writes industry-standard code."
    ),
    React.createElement(Text, { dimColor: true, key: "version" }, `v${version}`),
  ];

  if (phase === "welcome") {
    return React.createElement(
      Box,
      { flexDirection: "column", padding: 1 },
      ...header,
      React.createElement(
        Box,
        { marginTop: 1 },
        React.createElement(SelectInput, {
          items: welcomeItems,
          onSelect: (item) => {
            if (item.value === "start") setPhase("steps");
            if (item.value === "exit") exit();
          },
        })
      )
    );
  }

  const isComplete = step >= STEPS.length;

  return React.createElement(
    Box,
    { flexDirection: "column", padding: 1 },
    ...header,
    React.createElement(
      Box,
      { marginTop: 1 },
      isComplete
        ? React.createElement(Text, { color: "green" }, "Saving...")
        : React.createElement(
            Box,
            null,
            React.createElement(
              Text,
              null,
              `${STEPS[step].label} (${step + 1}/${STEPS.length}): `
            ),
            React.createElement(PasteInput, {
              key: step,
              onSubmit: (val) => {
                setValues({ ...values, [STEPS[step].key]: val });
                setStep(step + 1);
              },
            })
          )
    )
  );
}
