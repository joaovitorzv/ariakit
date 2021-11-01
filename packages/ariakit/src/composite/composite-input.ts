import { FocusEvent, KeyboardEvent, useCallback } from "react";
import {
  createHook,
  createComponent,
  createElement,
} from "ariakit-utils/system";
import {
  getDocument,
  getTextboxSelection,
  isTextField,
} from "ariakit-utils/dom";
import { As, Options, Props } from "ariakit-utils/types";
import { useEventCallback } from "ariakit-utils/hooks";
import { CompositeState } from "./composite-state";
import { selectTextField } from "./__utils";

function getValueLength(element: HTMLElement) {
  if (isTextField(element)) {
    return element.value.length;
  } else if (element.isContentEditable) {
    const range = getDocument(element).createRange();
    range.selectNodeContents(element);
    return range.toString().length;
  }
  return 0;
}

/**
 * A component hook that returns props that can be passed to `Role` or any other
 * Ariakit component to render an input as a composite item. This should be used
 * in conjunction with the `CompositeItem` component, the `useCompositeItem`
 * hook, or any other component/hook that uses `CompositeItem` underneath.
 * @see https://ariakit.org/docs/composite
 * @example
 * ```jsx
 * const state = useCompositeState();
 * const props = useCompositeInput({ state });
 * <Composite state={state}>
 *   <CompositeItem {...props} />
 * </Composite>
 * ```
 */
export const useCompositeInput = createHook<CompositeInputOptions>(
  ({ state, ...props }) => {
    const onKeyDownCaptureProp = useEventCallback(props.onKeyDownCapture);

    const onKeyDownCapture = useCallback(
      (event: KeyboardEvent<HTMLInputElement>) => {
        onKeyDownCaptureProp(event);
        if (event.defaultPrevented) return;
        const element = event.currentTarget;
        if (!element.isContentEditable && !isTextField(element)) return;
        const selection = getTextboxSelection(element);
        if (event.key === "ArrowRight" || event.key === "ArrowDown") {
          if (selection.end !== getValueLength(element)) {
            event.stopPropagation();
          }
        } else if (event.key === "ArrowLeft" || event.key === "ArrowUp") {
          if (selection.start !== 0) {
            event.stopPropagation();
          }
        }
      },
      [onKeyDownCaptureProp]
    );

    const onFocusProp = useEventCallback(props.onFocus);

    const onFocus = useCallback(
      (event: FocusEvent<HTMLInputElement>) => {
        onFocusProp(event);
        if (event.defaultPrevented) return;
        selectTextField(event.currentTarget);
      },
      [onFocusProp]
    );

    props = {
      ...props,
      onKeyDownCapture,
      onFocus,
    };

    return props;
  }
);

/**
 * A component that renders an input as a composite item. This should be used in
 * conjunction with the `CompositeItem` component or a component that uses
 * `CompositeItem` underneath.
 * @see https://ariakit.org/docs/composite
 * @example
 * ```jsx
 * const composite = useCompositeState();
 * <Composite state={composite}>
 *   <CompositeItem as={CompositeInput} />
 * </Composite>
 * ```
 */
export const CompositeInput = createComponent<CompositeInputOptions>(
  (props) => {
    const htmlProps = useCompositeInput(props);
    return createElement("input", htmlProps);
  }
);

export type CompositeInputOptions<T extends As = "input"> = Options<T> & {
  /**
   * Object returned by the `useCompositeState` hook. If not provided, the
   * parent `Composite` component's context will be used.
   */
  state?: CompositeState;
};

export type CompositeInputProps<T extends As = "input"> = Props<
  CompositeInputOptions<T>
>;