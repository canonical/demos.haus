import React from "react";
import { DemoUpdateStates } from "./types";

export default function DemoButton(props: {
  name: string;
  updateState: DemoUpdateStates;
  onClick: (name: string, updateState: DemoUpdateStates) => Promise<void>;
  disabled?: boolean;
}) {
  const [isLoading, setIsLoading] = React.useState(false);

  const handleClick = () => {
    setIsLoading(true);

    props.onClick(props.name, props.updateState).then(() => {
      setIsLoading(false);
    });
  };

  if (isLoading) {
    return (
      <button
        disabled=""
        class={`${
          props.updateState == DemoUpdateStates.DELETE
            ? "p-button--negative"
            : "p-button--positive"
        } is-processing`}
      >
        <i class="p-icon--spinner u-animation--spin is-light"></i>
      </button>
    );
  }
  return (
    <button
      className={`${
        props.updateState == DemoUpdateStates.DELETE
          ? "p-button--negative"
          : "p-button--positive"
      } js-processing-button`}
      onClick={handleClick}
      disabled={props.disabled}
    >
      <span id="button-label">
        {props.updateState == DemoUpdateStates.DELETE
          ? "Stop demo"
          : "Restart demo"}
      </span>
    </button>
  );
}
