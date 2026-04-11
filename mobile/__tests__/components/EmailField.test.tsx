import React from "react";
import { render, fireEvent } from "@testing-library/react-native";
import EmailField from "@/components/auth/EmailField";
import type { ThemeColors } from "@/lib/theme/colors";

const mockColors = {
  input: "#F2F2F7",
  text: "#000000",
  textMuted: "#8E8E93",
  danger: "#FF3B30",
} as ThemeColors;

const defaultProps = {
  email: "",
  emailError: "",
  emailChecking: false,
  onChangeEmail: jest.fn(),
  colors: mockColors,
};

describe("EmailField", () => {
  it("renders email input with placeholder", () => {
    const { getByPlaceholderText } = render(<EmailField {...defaultProps} />);
    // The placeholder comes from the t() mock which returns the key
    expect(getByPlaceholderText("auth.emailPlaceholder")).toBeTruthy();
  });

  it("shows error message when emailError is set", () => {
    const { getByText } = render(
      <EmailField {...defaultProps} emailError="Email invalide" />
    );
    expect(getByText("Email invalide")).toBeTruthy();
  });

  it("does not show error message when emailError is empty", () => {
    const { queryByText } = render(
      <EmailField {...defaultProps} emailError="" />
    );
    expect(queryByText("Email invalide")).toBeNull();
  });

  it("calls onChangeEmail on text change", () => {
    const onChangeEmail = jest.fn();
    const { getByPlaceholderText } = render(
      <EmailField {...defaultProps} onChangeEmail={onChangeEmail} />
    );
    fireEvent.changeText(getByPlaceholderText("auth.emailPlaceholder"), "test@example.com");
    expect(onChangeEmail).toHaveBeenCalledWith("test@example.com");
  });
});
