import Link from "next/link";
import type { AnchorHTMLAttributes, ButtonHTMLAttributes, ReactNode } from "react";
import { buildExternalLinkProps } from "@/lib/portfolio-selectors";

type ButtonVariant = "primary" | "secondary" | "ghost" | "text" | "icon" | "external";
type ButtonSize = "small" | "medium" | "large";

interface BaseProps {
  children: ReactNode;
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  className?: string;
}

type NativeButtonProps = Omit<ButtonHTMLAttributes<HTMLButtonElement>, "className" | "children">;
type NativeAnchorProps = Omit<
  AnchorHTMLAttributes<HTMLAnchorElement>,
  "className" | "children" | "href"
>;

type ActionButtonProps = BaseProps &
  NativeButtonProps & {
    href?: undefined;
  };

type LinkButtonProps = BaseProps &
  NativeAnchorProps & {
    href: string;
  };

export type ButtonProps = ActionButtonProps | LinkButtonProps;

export function Button(props: ButtonProps) {
  const variant = props.variant ?? "secondary";
  const size = props.size ?? "medium";
  const className = ["button", `button-${variant}`, `button-${size}`, props.className]
    .filter(Boolean)
    .join(" ");

  if (props.href) {
    return <ButtonLink props={props} className={className} />;
  }

  return <NativeButton props={props as ActionButtonProps} className={className} />;
}

function ButtonLink({ props, className }: { props: LinkButtonProps; className: string }) {
  const { href, children, loading, variant, size, ...linkProps } = props;
  const externalProps = buildExternalLinkProps(href);

  void variant;
  void size;

  return (
    <Link
      {...linkProps}
      {...externalProps}
      aria-disabled={loading ? true : undefined}
      className={className}
      href={href}
    >
      <span>{children}</span>
    </Link>
  );
}

function NativeButton({ props, className }: { props: ActionButtonProps; className: string }) {
  const { children, loading, variant, size, disabled, type = "button", ...buttonProps } = props;

  void variant;
  void size;

  return (
    <button {...buttonProps} className={className} disabled={disabled || loading} type={type}>
      <span>{loading ? "Loading" : children}</span>
    </button>
  );
}
