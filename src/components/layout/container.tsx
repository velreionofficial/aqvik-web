import type * as React from "react";

import { cn } from "@/lib/utils";

export type ContainerProps = React.ComponentPropsWithoutRef<"div">;

/** Single horizontal measure shared by every band on the site. */
export function Container({ className, ...props }: ContainerProps) {
  return (
    <div className={cn("mx-auto w-full max-w-[76rem] px-5 sm:px-8 lg:px-10", className)} {...props} />
  );
}
