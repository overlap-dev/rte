import React, { useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { MentionPopupState } from "../hooks/useMentions";
import { MentionItem } from "../types";

interface MentionPopupProps {
    state: MentionPopupState;
    trigger: string;
    renderItem?: (item: MentionItem, isActive: boolean) => React.ReactNode;
    onSelect: (item: MentionItem) => void;
    onHover: (index: number) => void;
}

/**
 * Suggestion list shown below the caret while a mention query is open.
 * Rendered into document.body with position:fixed (same approach as the
 * FloatingToolbar) so it is never clipped by overflow containers.
 */
export const MentionPopup: React.FC<MentionPopupProps> = ({
    state,
    trigger,
    renderItem,
    onSelect,
    onHover,
}) => {
    const listRef = useRef<HTMLDivElement>(null);

    // Keep the active row visible while navigating with the keyboard.
    useEffect(() => {
        if (!state.open) return;
        const el = listRef.current?.children[state.activeIndex] as
            | HTMLElement
            | undefined;
        el?.scrollIntoView?.({ block: "nearest" });
    }, [state.open, state.activeIndex]);

    if (!state.open || typeof document === "undefined") return null;

    return createPortal(
        <div
            ref={listRef}
            className="rte-mention-popup"
            role="listbox"
            style={{ position: "fixed", top: state.top, left: state.left }}
            // Keep the editor selection: do not steal focus on click.
            onMouseDown={(e) => e.preventDefault()}
        >
            {state.items.map((item, index) => {
                const isActive = index === state.activeIndex;
                return (
                    <div
                        key={`${item.id}-${index}`}
                        role="option"
                        aria-selected={isActive}
                        className={`rte-mention-item ${
                            isActive ? "rte-mention-item-active" : ""
                        }`}
                        onMouseEnter={() => onHover(index)}
                        onClick={() => onSelect(item)}
                    >
                        {renderItem
                            ? renderItem(item, isActive)
                            : `${trigger}${item.label}`}
                    </div>
                );
            })}
        </div>,
        document.body,
    );
};
