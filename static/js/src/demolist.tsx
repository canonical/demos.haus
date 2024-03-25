import React from "react";
import ReactDOM from "react-dom";
import DemoSearch from "./demoSearch";
import { DemoUpdateStates, DemoService, DemoStates } from "./types";

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

const DemoButton = (props: {
  name: string;
  updateState: DemoUpdateStates;
  onClick: (name: string, updateState: DemoUpdateStates) => Promise<void>;
  disabled?: boolean;
}) => {
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
};

const DemoCard = (props: {
  demo: DemoService;
  handleSubmit: (name: string, state: DemoUpdateStates) => Promise<void>;
}) => {
  const { demo, handleSubmit } = props;

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
        </div>
      </div>
    </div>
  );
};

function App() {
  const [demos, setDemos] = React.useState([]);
  const [demosList, setDemosList] = React.useState([]);
  const [searchInput, setSearchInput] = React.useState("");
  const [filterCache, setFilterCache] = React.useState([]);
  const [isLoading, setIsLoading] = React.useState(true);

  const getDemos = () => {
    return fetch("/demos").then((response) => response.json());
  };

  const getDemoStatus = (name: string) => {
    return fetch(`/demo/status?name=${name}`).then((response) =>
      response.json()
    );
  };

  const handleUpdateDemoStatus = (name: string, state: DemoUpdateStates) => {
    return fetch(`/demo/update?name=${name}&state=${state}`)
      .then((response) => response.json())
      .then((data) => {
        // Remove the demo from the list
        if (data.state === DemoUpdateStates.DELETE) {
          setDemosList(
            demosList.filter((demo: DemoService) => demo.name !== name)
          );
        } else {
          // Update the demo in the list
          getDemoStatus(name).then((status) => {
            let updatedDemos = demosList.map((demo: DemoService) => {
              if (demo.name === name) {
                return { ...demo, status: status };
              }
              return demo;
            });
            setDemosList(updatedDemos);
          });
        }
      });
  };

  const handleSearch = (query: string) => {
    setDemosList(demos.filter((demo) => demo.name.includes(query)));
    setFilterCache(demosList); // Cache the filtered list
  };

  const handleFilter = (query: string, filterKey: keyof DemoService) => {
    setDemosList(filterCache.filter((demo) => demo[filterKey].includes(query)));
  };

  React.useEffect(() => {
    getDemos().then((data) => {
      setDemos(data); // Load static list of demos
      setDemosList(data);
      setIsLoading(false);
    });
  }, []);

  React.useEffect(() => {
    // Refresh the list of demos every 10 seconds
    const interval = setInterval(() => {
      getDemos().then((data) => {
        setDemos(data);
      });
    }, 10 * 1000);
    return () => clearTimeout(interval);
  }, []);

  React.useEffect(() => {
    handleSearch(searchInput);
  }, [searchInput]);

  return (
    <div className="p-strip">
      <div className="row">
        <h1 className="p-heading--3">Running demos</h1>
        <DemoSearch
          value={searchInput}
          onChange={setSearchInput}
          onFilter={handleFilter}
        />
      </div>
      <div className="row">
        {isLoading ? (
          <div className="u-align--center p-strip">
            <i className="p-icon--spinner u-animation--spin"></i>
          </div>
        ) : (
          demosList.map((demo: DemoService) => {
            return (
              <DemoCard demo={demo} handleSubmit={handleUpdateDemoStatus} />
            );
          })
        )}
      </div>
    </div>
  );
}

const appRoot = document.getElementById("demolist");
if (appRoot) {
  ReactDOM.render(<App />, appRoot);
}
