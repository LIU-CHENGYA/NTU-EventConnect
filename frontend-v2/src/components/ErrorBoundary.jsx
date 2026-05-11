import { Component } from "react";
import i18n from "../i18n";

export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { error: null };
  }

  static getDerivedStateFromError(error) {
    return { error };
  }

  componentDidCatch(error, info) {
    // eslint-disable-next-line no-console
    console.error("UI crash:", error, info);
  }

  handleReload = () => {
    this.setState({ error: null });
    window.location.reload();
  };

  render() {
    if (this.state.error) {
      return (
        <div style={{
          minHeight: "100vh", display: "flex", flexDirection: "column",
          alignItems: "center", justifyContent: "center", padding: 24,
          fontFamily: "sans-serif", textAlign: "center",
        }}>
          <h2>{i18n.t("errors.boundary")}</h2>
          <p style={{ color: "#666", maxWidth: 480 }}>
            {i18n.t("errors.boundaryDetail")}
          </p>
          <button
            onClick={this.handleReload}
            style={{
              marginTop: 16, padding: "10px 24px", fontSize: 16,
              border: "none", borderRadius: 20, background: "#1a237e",
              color: "white", cursor: "pointer",
            }}
          >
            {i18n.t("errors.refresh")}
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
