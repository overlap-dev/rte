import React, { useCallback, useEffect, useRef, useState } from "react";
import { isUrlSafe } from "../utils/sanitize";
import { Icon } from "./Icons";

interface LinkTooltipProps {
    editorElement: HTMLElement | null;
}

interface TooltipState {
    visible: boolean;
    top: number;
    left: number;
    href: string;
    anchor: HTMLAnchorElement | null;
}

/**
 * Shows a tooltip with URL, edit link, and open link actions
 * when hovering over an <a> element in the editor.
 */
export const LinkTooltip: React.FC<LinkTooltipProps> = ({ editorElement }) => {
    const [state, setState] = useState<TooltipState>({
        visible: false,
        top: 0,
        left: 0,
        href: "",
        anchor: null,
    });
    const tooltipRef = useRef<HTMLDivElement>(null);
    const hideTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    const show = useCallback((anchor: HTMLAnchorElement) => {
        if (hideTimeoutRef.current) {
            clearTimeout(hideTimeoutRef.current);
            hideTimeoutRef.current = null;
        }
        const rect = anchor.getBoundingClientRect();
        const tooltipH = 36;
        const pad = 6;

        let top = rect.bottom + pad;
        if (top + tooltipH > window.innerHeight - pad) {
            top = rect.top - tooltipH - pad;
        }

        const left = Math.max(pad, Math.min(rect.left, window.innerWidth - 400 - pad));

        setState({
            visible: true,
            top,
            left,
            href: anchor.href,
            anchor,
        });
    }, []);

    const scheduleHide = useCallback(() => {
        hideTimeoutRef.current = setTimeout(() => {
            setState((prev) => ({ ...prev, visible: false, anchor: null }));
        }, 200);
    }, []);

    useEffect(() => {
        if (!editorElement) return;

        const handleMouseOver = (e: MouseEvent) => {
            const target = e.target as HTMLElement;
            const anchor = target.closest("a") as HTMLAnchorElement | null;
            if (anchor && editorElement.contains(anchor)) {
                show(anchor);
            }
        };

        const handleMouseOut = (e: MouseEvent) => {
            const target = e.relatedTarget as HTMLElement | null;
            if (!target) {
                scheduleHide();
                return;
            }
            // If moving to the tooltip itself, don't hide
            if (tooltipRef.current?.contains(target)) return;
            // If still on a link, don't hide
            if (target.closest?.("a") && editorElement.contains(target)) return;
            scheduleHide();
        };

        editorElement.addEventListener("mouseover", handleMouseOver);
        editorElement.addEventListener("mouseout", handleMouseOut);

        return () => {
            editorElement.removeEventListener("mouseover", handleMouseOver);
            editorElement.removeEventListener("mouseout", handleMouseOut);
            if (hideTimeoutRef.current) clearTimeout(hideTimeoutRef.current);
        };
    }, [editorElement, show, scheduleHide]);

    const handleTooltipMouseEnter = () => {
        if (hideTimeoutRef.current) {
            clearTimeout(hideTimeoutRef.current);
            hideTimeoutRef.current = null;
        }
    };

    const handleTooltipMouseLeave = () => {
        scheduleHide();
    };

    const handleOpen = () => {
        if (state.href && isUrlSafe(state.href)) {
            window.open(state.href, "_blank", "noopener,noreferrer");
        }
    };

    const handleCopy = () => {
        if (state.href) {
            navigator.clipboard.writeText(state.href).catch(() => {
                // Fallback: do nothing
            });
        }
    };

    if (!state.visible) return null;

    return (
        <div
            ref={tooltipRef}
            className="rte-link-tooltip"
            style={{
                position: "fixed",
                top: state.top,
                left: state.left,
            }}
            onMouseEnter={handleTooltipMouseEnter}
            onMouseLeave={handleTooltipMouseLeave}
        >
            <span className="rte-link-tooltip-url" title={state.href}>
                {state.href}
            </span>
            <div className="rte-link-tooltip-actions">
                <button
                    type="button"
                    className="rte-link-tooltip-btn"
                    title="Open link"
                    aria-label="Open link"
                    onClick={handleOpen}
                >
                    <Icon icon="mdi:open-in-new" width={14} height={14} />
                </button>
                <button
                    type="button"
                    className="rte-link-tooltip-btn"
                    title="Copy link"
                    aria-label="Copy link"
                    onClick={handleCopy}
                >
                    <Icon icon="mdi:content-copy" width={14} height={14} />
                </button>
            </div>
        </div>
    );
};
