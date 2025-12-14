import * as React from "react"
import * as DialogPrimitive from "@radix-ui/react-dialog"
import { XIcon } from "lucide-react"

import { cn } from "@/lib/utils"
import { useKeyboardInsets } from "@/hooks/useKeyboardInsets"

function Dialog({
  ...props
}) {
  return <DialogPrimitive.Root data-slot="dialog" {...props} />;
}

function DialogTrigger({
  ...props
}) {
  return <DialogPrimitive.Trigger data-slot="dialog-trigger" {...props} />;
}

function DialogPortal({
  ...props
}) {
  return <DialogPrimitive.Portal data-slot="dialog-portal" {...props} />;
}

function DialogClose({
  ...props
}) {
  return <DialogPrimitive.Close data-slot="dialog-close" {...props} />;
}

function DialogOverlay({
  className,
  ...props
}) {
  return (
    <DialogPrimitive.Overlay
      data-slot="dialog-overlay"
      className={cn(
        "data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 fixed inset-0 z-[99999] bg-black/50 overscroll-contain touch-none",
        className
      )}
      {...props} />
  );
}

function DialogContent({
  className,
  children,
  showCloseButton = true,
  // Prevent accidental close when the iOS keyboard is dismissed or user taps around
  preventOutsideClose = true,
  // Scroll focused input into view inside dialog; disabled by default to avoid jumps on iOS
  autoFocusScroll = false,
  // If true, жестко блокирует прокрутку фона (html/body). По умолчанию включено
  // для предотвращения скролла фона при открытой модалке.
  lockBackgroundScroll = true,
  ...props
}) {
  // Optionally lock background scroll while dialog is open
  React.useEffect(() => {
    if (!lockBackgroundScroll) return;
    const html = document.documentElement;
    const body = document.body;
    const scrollY = window.scrollY || window.pageYOffset;
    const prevHtmlOverflow = html.style.overflow;
    const prevBodyOverflow = body.style.overflow;
    const prevBodyPosition = body.style.position;
    const prevBodyTop = body.style.top;
    const prevBodyWidth = body.style.width;
    html.style.overflow = "hidden";
    body.style.overflow = "hidden";
    body.style.position = "fixed";
    body.style.top = `-${scrollY}px`;
    body.style.width = "100%";
    return () => {
      html.style.overflow = prevHtmlOverflow;
      body.style.overflow = prevBodyOverflow;
      body.style.position = prevBodyPosition;
      body.style.top = prevBodyTop;
      body.style.width = prevBodyWidth;
      window.scrollTo(0, scrollY);
    };
  }, [lockBackgroundScroll]);

  // Use visualViewport height to size the portal container on iOS to avoid jumps
  const [portalHeight, setPortalHeight] = React.useState(null);
  const { keyboardInset } = useKeyboardInsets();
  React.useEffect(() => {
    const vv = window.visualViewport;
    if (!vv) return;
    const handler = () => setPortalHeight(Math.floor(vv.height));
    handler();
    vv.addEventListener("resize", handler);
    vv.addEventListener("scroll", handler);
    return () => {
      vv.removeEventListener("resize", handler);
      vv.removeEventListener("scroll", handler);
    };
  }, []);

  // Optionally ensure focused input is scrolled into view within dialog (not the page)
  const contentRef = React.useRef(null);
  React.useEffect(() => {
    if (!autoFocusScroll) return;
    const node = contentRef.current;
    if (!node) return;
    const getScrollableAncestor = (el) => {
      let cur = el;
      while (cur && cur !== document.body) {
        const style = window.getComputedStyle(cur);
        const hasScroll = /(auto|scroll)/.test(style.overflowY || "") || /(auto|scroll)/.test(style.overflow || "");
        if (hasScroll && cur.scrollHeight > cur.clientHeight) return cur;
        cur = cur.parentElement;
      }
      return null;
    };
    const onFocusIn = (e) => {
      const target = e.target;
      if (!(target instanceof HTMLElement)) return;
      setTimeout(() => {
        try {
          const scroller = getScrollableAncestor(target) || node;
          const rect = target.getBoundingClientRect();
          const sRect = scroller.getBoundingClientRect();
          const offsetTop = scroller.scrollTop + (rect.top - sRect.top) - Math.max(0, (sRect.height - rect.height) / 2);
          scroller.scrollTo({ top: Math.max(0, offsetTop), behavior: "smooth" });
        } catch {}
      }, 60);
    };
    node.addEventListener("focusin", onFocusIn);
    return () => node.removeEventListener("focusin", onFocusIn);
  }, [autoFocusScroll]);
  return (
    <DialogPortal data-slot="dialog-portal">
      <DialogOverlay />
      {/* Use full-screen flex container to avoid iOS visualViewport/translate glitches */}
      <div
        className="fixed inset-0 z-[99999] flex items-start justify-center p-4 overscroll-contain touch-pan-y"
        style={{
          // Prefer stable viewport height to avoid shrinking on keyboard open
          height: "100svh",
          // Fallback for environments without svh support
          minHeight: portalHeight ? `${portalHeight}px` : undefined,
          // Provide safe space for on-screen keyboard overlap when needed
          paddingBottom: keyboardInset ? `${keyboardInset}px` : undefined,
        }}
      >
      <DialogPrimitive.Content
        ref={contentRef}
        data-slot="dialog-content"
        className={cn(
          "bg-background data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 grid w-full max-w-[calc(100%-2rem)] gap-4 rounded-lg border p-6 shadow-lg duration-200 sm:max-w-lg mt-4 sm:mt-8 max-h-[calc(100svh-2rem)] overflow-y-auto",
          className
        )}
        // Avoid closing when tapping outside (iOS can fire this when dismissing keyboard)
        onInteractOutside={preventOutsideClose ? (e) => e.preventDefault() : undefined}
        onPointerDownOutside={preventOutsideClose ? (e) => e.preventDefault() : undefined}
        onEscapeKeyDown={preventOutsideClose ? (e) => e.preventDefault() : undefined}
        // Prevent focus return that may reopen inputs/keyboard unexpectedly
        onCloseAutoFocus={(e) => e.preventDefault()}
        {...props}>
        {children}
        {showCloseButton && (
          <DialogPrimitive.Close
            data-slot="dialog-close"
            className="ring-offset-background focus:ring-ring data-[state=open]:bg-accent data-[state=open]:text-muted-foreground absolute top-4 right-4 rounded-xs opacity-70 transition-opacity hover:opacity-100 focus:ring-2 focus:ring-offset-2 focus:outline-hidden disabled:pointer-events-none [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4">
            <XIcon />
            <span className="sr-only">Close</span>
          </DialogPrimitive.Close>
        )}
      </DialogPrimitive.Content>
      </div>
    </DialogPortal>
  );
}

function DialogHeader({
  className,
  ...props
}) {
  return (
    <div
      data-slot="dialog-header"
      className={cn("flex flex-col gap-2 text-center sm:text-left", className)}
      {...props} />
  );
}

function DialogFooter({
  className,
  ...props
}) {
  return (
    <div
      data-slot="dialog-footer"
      className={cn("flex flex-col-reverse gap-2 sm:flex-row sm:justify-end", className)}
      {...props} />
  );
}

function DialogTitle({
  className,
  ...props
}) {
  return (
    <DialogPrimitive.Title
      data-slot="dialog-title"
      className={cn("text-lg leading-none font-semibold", className)}
      {...props} />
  );
}

function DialogDescription({
  className,
  ...props
}) {
  return (
    <DialogPrimitive.Description
      data-slot="dialog-description"
      className={cn("text-muted-foreground text-sm", className)}
      {...props} />
  );
}

export {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogOverlay,
  DialogPortal,
  DialogTitle,
  DialogTrigger,
}
