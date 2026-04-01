import React from "react";
import { View, Text, TouchableOpacity } from "react-native";
import { Sentry } from "@/lib/sentry";
import i18n from "@/lib/i18n";

interface Props {
  children: React.ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export default class ErrorBoundary extends React.Component<Props, State> {
  state: State = { hasError: false, error: null };

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    Sentry.captureException(error, { extra: { componentStack: info.componentStack } });
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      return (
        <View style={{ flex: 1, justifyContent: "center", alignItems: "center", padding: 24, backgroundColor: "#0a0a0a" }}>
          <Text style={{ fontSize: 50, marginBottom: 16 }}>!</Text>
          <Text style={{ fontSize: 22, fontWeight: "bold", color: "#f9fafb", marginBottom: 8, textAlign: "center" }}>
            {i18n.t("error.boundaryTitle")}
          </Text>
          <Text style={{ fontSize: 16, color: "#9ca3af", textAlign: "center", marginBottom: 24 }}>
            {i18n.t("error.boundaryMessage")}
          </Text>
          {__DEV__ && this.state.error && (
            <View style={{ backgroundColor: "#dc262615", padding: 12, marginBottom: 24, width: "100%", maxWidth: 400 }}>
              <Text style={{ fontSize: 14, color: "#f87171", fontFamily: "monospace" }}>
                {this.state.error.message}
              </Text>
            </View>
          )}
          <TouchableOpacity
            onPress={this.handleRetry}
            accessibilityRole="button"
            style={{ backgroundColor: "#00815d", paddingHorizontal: 32, paddingVertical: 12 }}
          >
            <Text style={{ color: "#fff", fontWeight: "600", fontSize: 18 }}>
              {i18n.t("common.retry")}
            </Text>
          </TouchableOpacity>
        </View>
      );
    }

    return this.props.children;
  }
}
