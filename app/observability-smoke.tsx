import React, { useState } from "react";
import { View, Text, Pressable, ScrollView } from "react-native";
import { reportError } from "@/observability/client";

function ThrowOnRender(): React.ReactElement {
  throw new Error("forced-render-error");
}

export default function ObservabilitySmoke(): React.ReactElement | null {
  const [renderError, setRenderError] = useState(false);
  const [lastAction, setLastAction] = useState<string>("—");

  if (!__DEV__) return null;

  const log = (msg: string) =>
    setLastAction(`${new Date().toISOString()}: ${msg}`);

  const handleInitSmoke = () => {
    const id = reportError(new Error("init-smoke"), { where: "unknown" });
    log(`reportError returned ${id ?? "null (disabled or not initialized)"}`);
  };

  const handleForcedJsException = () => {
    log("throwing synchronous JS exception");
    throw new Error("forced-js-exception");
  };

  const handleForcedUnhandledRejection = () => {
    log("triggering unhandled promise rejection");
    void Promise.reject(new Error("forced-unhandled"));
  };

  const handleForcedRenderError = () => {
    log("flipping render-error flag (boundary should catch)");
    setRenderError(true);
  };

  const handleForcedHang = () => {
    log("blocking JS thread for 5s (App Hang on iOS, ANR on Android)");
    const start = Date.now();
    while (Date.now() - start < 5000) {
      // intentional busy loop
    }
    log("hang ended after 5s");
  };

  return (
    <ScrollView contentContainerStyle={styles.scroll}>
      <Text style={styles.h1}>Observability smoke</Text>
      <Text style={styles.body}>
        Dev-only screen. Fires the five acceptance-criteria scenarios from
        docs/06-observability.md. Verify each appears in the uh-oh dashboard within 60s.
      </Text>
      <View style={styles.spacer} />

      <SmokeButton
        label="1. Init smoke (reportError direct)"
        onPress={handleInitSmoke}
      />
      <SmokeButton
        label="2. Forced JS exception"
        onPress={handleForcedJsException}
      />
      <SmokeButton
        label="3. Forced unhandled promise rejection"
        onPress={handleForcedUnhandledRejection}
      />
      <SmokeButton
        label="4. Forced render error"
        onPress={handleForcedRenderError}
      />
      <SmokeButton
        label="5. Forced 5s hang (iOS App Hang / Android ANR)"
        onPress={handleForcedHang}
      />

      <View style={styles.spacer} />
      <Text style={styles.label}>Last action:</Text>
      <Text style={styles.mono}>{lastAction}</Text>

      {renderError ? <ThrowOnRender /> : null}
    </ScrollView>
  );
}

function SmokeButton({
  label,
  onPress,
}: {
  label: string;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.button, pressed && styles.buttonPressed]}
      accessibilityRole="button"
      accessibilityLabel={label}
    >
      <Text style={styles.buttonText}>{label}</Text>
    </Pressable>
  );
}

const styles = {
  scroll: { padding: 24, gap: 12 },
  h1: {
    fontSize: 22,
    fontWeight: "600" as const,
    color: "#111111",
    marginBottom: 4,
  },
  body: { fontSize: 14, color: "#444444" },
  spacer: { height: 16 },
  button: {
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: "#111111",
    borderRadius: 12,
    marginBottom: 8,
  },
  buttonPressed: { opacity: 0.6 },
  buttonText: { color: "#ffffff", fontSize: 15, fontWeight: "500" as const },
  label: { fontSize: 13, color: "#666666", marginTop: 8 },
  mono: { fontSize: 12, color: "#222222", fontFamily: "Courier" },
};
