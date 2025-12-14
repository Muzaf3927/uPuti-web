import React from "react";

import { Card, CardContent } from "@/components/ui/card";

function EmptyState({
  icon = null,
  title = "",
  description = "",
  action = null,
  className = "",
}) {
  const isCompact = className.includes("compact");
  
  return (
    <Card className={`rounded-3xl border shadow-lg bg-card/90 backdrop-blur-sm ${className}`}>
      <CardContent className={`${isCompact ? 'py-4 sm:py-5' : 'py-10 sm:py-12'} flex flex-col items-center text-center gap-3`}>
        {icon ? (
          <div className={`rounded-full bg-accent ${isCompact ? 'w-12 h-12 sm:w-14 sm:h-14' : 'w-16 h-16 sm:w-20 sm:h-20'} flex items-center justify-center`}>
            {icon}
          </div>
        ) : null}
        {title ? (
          <h2 className={`${isCompact ? 'text-xs sm:text-sm' : 'text-base sm:text-lg'} font-semibold text-foreground`}>{title}</h2>
        ) : null}
        {description ? (
          <p className={`${isCompact ? 'text-xs' : 'text-sm'} text-muted-foreground max-w-[32ch]`}>{description}</p>
        ) : null}
        {action ? <div className="mt-2">{action}</div> : null}
      </CardContent>
    </Card>
  );
}

export default EmptyState;


