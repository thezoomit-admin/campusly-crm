import type { ButtonProps as AntButtonProps } from "antd";
import { Button as AntButton } from "antd";
import type { ReactNode } from "react";

type ButtonVariant = "primary" | "secondary" | "ghost";
type AppButtonSize = "sm" | "md" | "lg";
type HtmlButtonType = "button" | "submit" | "reset";
type AntButtonType = NonNullable<AntButtonProps["type"]>;

const VARIANT_TO_TYPE: Record<ButtonVariant, AntButtonType> = {
  primary: "primary",
  secondary: "default",
  ghost: "text",
};

const SIZE_MAP: Record<AppButtonSize, NonNullable<AntButtonProps["size"]>> = {
  sm: "small",
  md: "middle",
  lg: "large",
};

function isHtmlButtonType(value: unknown): value is HtmlButtonType {
  return value === "button" || value === "submit" || value === "reset";
}

function isAppSize(value: unknown): value is AppButtonSize {
  return value === "sm" || value === "md" || value === "lg";
}

export type PrimaryButtonProps = Omit<AntButtonProps, "type" | "size"> & {
  /** App visual style mapped to Ant Design `type`. */
  variant?: ButtonVariant;
  /** App sizes (`sm`/`md`/`lg`) or Ant Design sizes. */
  size?: AppButtonSize | AntButtonProps["size"];
  /**
   * HTML button type (`button`/`submit`/`reset`), or Ant Design visual type
   * (`primary`/`default`/`dashed`/`link`/`text`) when not using `variant`.
   */
  type?: HtmlButtonType | AntButtonType;
  fullWidth?: boolean;
  icon?: ReactNode;
};

export default function PrimaryButton({
  variant = "primary",
  size = "sm",
  type = "button",
  fullWidth = false,
  block,
  htmlType,
  className,
  ...rest
}: PrimaryButtonProps) {
  const antType = isHtmlButtonType(type) ? VARIANT_TO_TYPE[variant] : type;
  const resolvedHtmlType =
    htmlType ?? (isHtmlButtonType(type) ? type : "button");
  const antSize = isAppSize(size) ? SIZE_MAP[size] : size;

  return (
    <AntButton
      type={antType}
      htmlType={resolvedHtmlType}
      size={antSize}
      block={block ?? fullWidth}
      className={['rounded-lg', className].filter(Boolean).join(' ')}
      {...rest}
    />
  );
}
