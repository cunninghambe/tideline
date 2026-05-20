import React from "react";
import { View, Text, Pressable } from "react-native";
import { reportError } from "./client";

type Props = { children: React.ReactNode };
type State = { error: Error | null };

export class RootErrorBoundary extends React.Component<Props, State> {
  state: State = { error: null };
  fallbackFailed = false;

  static getDerivedStateFromError(error: Error): Partial<State> {
    return { error };
  }

  componentDidCatch(error: Error): void {
    if (this.fallbackFailed) return;
    try {
      reportError(error, { where: "render" });
    } catch {
      // reportError should never throw, but be defensive
    }
  }

  handleTryAgain = (): void => {
    this.setState({ error: null });
  };

  render(): React.ReactNode {
    if (this.fallbackFailed) {
      return (
        <View style={hardFallbackStyles.root}>
          <Text style={hardFallbackStyles.text}>
            Tideline crashed. Force-quit and reopen.
          </Text>
        </View>
      );
    }
    if (this.state.error) {
      try {
        return (
          <View
            style={fallbackStyles.root}
            testID="root-error-boundary-fallback"
          >
            <Text style={fallbackStyles.title}>Something went wrong</Text>
            <Text style={fallbackStyles.body}>
              Tideline hit an error. Your data is safe.
            </Text>
            <Pressable
              onPress={this.handleTryAgain}
              style={fallbackStyles.button}
              accessibilityRole="button"
              accessibilityLabel="Try again"
              testID="root-error-boundary-try-again"
            >
              <Text style={fallbackStyles.buttonText}>Try again</Text>
            </Pressable>
          </View>
        );
      } catch {
        this.fallbackFailed = true;
        return (
          <View style={hardFallbackStyles.root}>
            <Text style={hardFallbackStyles.text}>
              Tideline crashed. Force-quit and reopen.
            </Text>
          </View>
        );
      }
    }
    return this.props.children;
  }
}

const fallbackStyles = {
  root: {
    flex: 1,
    alignItems: "center" as const,
    justifyContent: "center" as const,
    padding: 24,
    backgroundColor: "#ffffff",
  },
  title: {
    fontSize: 20,
    fontWeight: "600" as const,
    color: "#111111",
    marginBottom: 8,
    textAlign: "center" as const,
  },
  body: {
    fontSize: 15,
    color: "#444444",
    marginBottom: 24,
    textAlign: "center" as const,
  },
  button: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    backgroundColor: "#111111",
    borderRadius: 12,
  },
  buttonText: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "500" as const,
  },
};

const hardFallbackStyles = {
  root: {
    flex: 1,
    alignItems: "center" as const,
    justifyContent: "center" as const,
    padding: 24,
    backgroundColor: "#ffffff",
  },
  text: {
    fontSize: 16,
    color: "#111111",
    textAlign: "center" as const,
  },
};
