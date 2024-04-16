import React from "react";
import DemoButton from "./demoButton";
import { DemoService, DemoUpdateStates, DemoStates } from "./types";

const CardStatus = (status: DemoStates) => {
  if (status === DemoStates.RUNNING) {
    return <div className="p-status-label--positive">Running</div>;
  } else if (status === DemoStates.BUILDING) {
    return <div className="p-status-label--caution">Builing</div>;
  } else if (status === DemoStates.FAILED) {
    return <div className="p-status-label--negative">Failed</div>;
  }
  return <div className="p-status-label">Unknown</div>;
};

export default function DemoCard(props: {
  demo: DemoService;
  handleSubmit: (name: string, state: DemoUpdateStates) => Promise<void>;
}) {
  const { demo, handleSubmit } = props;

  const [isLoading, setIsLoading] = React.useState(true);
  const [logsData, setLogsData] = React.useState("No logs available");
  const [logsVisible, setLogsVisible] = React.useState(false);

  const getLogs = () => {
    return fetch(`/demo/logs?name=${demo.name}`).then((response) =>
      response.json()
    );
  };

  const getRecentLogs = (range: number, logData: string) => {
    // This is the equivalent of tail -n {range}
    // We split log entries by newlines.
    // Note that this means newlines within logs will be split.
    let logsList = logData.split("\n").slice(-1 * range);

    return logsList.join("\n");
  };

  const toggleLogs = () => {
    if (logsVisible) {
      setLogsVisible(false);
      return;
    }

    setLogsVisible(true);
    setIsLoading(true);

    getLogs().then((data) => {
      setLogsData(getRecentLogs(20, data.logs || "No logs available"));
      setIsLoading(false);
    });
  };

  return (
    <div className="p-card">
      <div
        style={{
          display: "flex",
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          {CardStatus(demo.status)}
        </div>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <p className="p-heading--4">{demo.running_time}</p>
        </div>
      </div>
      <div
        style={{
          display: "flex",
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "flex-start",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <a>
            <h3>{demo.name}</h3>
          </a>
        </div>
      </div>

      <div
        style={{
          display: "flex",
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <div className="p-chip">
            <a href={demo.pr_url}>
              <img
                height="32"
                width="32"
                src="static/images/gh.png"
                alt={demo.name}
              />
            </a>
          </div>
          <div className="p-chip">
            <a href={demo.host}>
              <img
                height="32"
                width="32"
                src="static/images/jenkins.png"
                alt={demo.name}
              />
            </a>
          </div>
        </div>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <DemoButton
            name={demo.name}
            updateState={DemoUpdateStates.DELETE}
            onClick={handleSubmit}
            disabled={demo.status === DemoStates.FAILED}
          />
          <DemoButton
            name={demo.name}
            updateState={DemoUpdateStates.RESTART}
            onClick={handleSubmit}
            disabled={demo.status === DemoStates.RUNNING}
          />
          <button className="p-button has-icon" onClick={toggleLogs}>
            <span>Logs</span>
            {logsVisible ? (
              <i className="p-icon--collapse"></i>
            ) : (
              <i className="p-icon--expand"></i>
            )}
          </button>
        </div>
      </div>
      {logsVisible && (
        <div className="p-code-snippet">
          <div className="p-code-snippet__header">
            <h5 className="p-code-snippet__title">Kubernetes logs</h5>
          </div>
          {isLoading ? (
            <div className="u-align--center p-strip">
              <i className="p-icon--spinner u-animation--spin"></i>
            </div>
          ) : (
            <pre className="p-code-snippet__code" data-language="javascript">
              <p>{logsData}</p>
            </pre>
          )}
        </div>
      )}
    </div>
  );
}
