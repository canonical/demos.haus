import React, { useState } from "react";
import ReactDOM from "react-dom";

interface DemoService {
  name: string;
  status: number;
  running_time: string;
  pr_url: string;
  host: string;
}

enum DemoUpdateStates {
  RESTART = "restart",
  DELETE = "delete",
}

enum CardStates {
  RUNNING = 0,
  BUILDING = 1,
  FAILED = 2,
}

const CardStatus = (status: CardStates) => {
  if (status === CardStates.RUNNING) {
    return <div class="p-status-label--positive">Running</div>;
  } else if (status === CardStates.BUILDING) {
    return <div class="p-status-label--caution">Builing</div>;
  } else if (status === CardStates.FAILED) {
    return <div class="p-status-label--negative">Failed</div>;
  }
};

const DemoButton = (props: {
  name: string;
  type: DemoUpdateStates;
  onClick: (name: string, type: DemoUpdateStates) => void;
}) => {
  const [isLoading, setIsLoading] = useState(false);

  const handleClick = () => {
    // setIsLoading(true);
    setTimeout(() => {
      console.log("Demo updated");
    }, 5000);
    // props.onClick(props.name, props.type);
    setIsLoading(false);
  };

  React.useEffect(() => {
    if (isLoading) {
      console.log("SHOULD REFRESH");
    }
  }, [isLoading]);

  return (
    <button
      class={`${
        props.type == DemoUpdateStates.DELETE
          ? "p-button--negative"
          : "p-button--positive"
      } js-processing-button`}
      onClick={handleClick}
    >
      {isLoading ? (
        <i class="p-icon--spinner u-animation--spin is-light"></i>
      ) : (
        <span id="button-label">
          {props.type == DemoUpdateStates.DELETE ? "Stop demo" : "Restart demo"}
        </span>
      )}
    </button>
  );
};

const DemoCard = (props: {
  demo: DemoService;
  handleSubmit: (name: string, state: DemoUpdateStates) => void;
}) => {
  const { demo, handleSubmit } = props;

  return (
    <div class="p-card">
      <div
        style={{
          display: "flex",
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <div
          class="status-id-1"
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
          <p class="p-heading--4">{demo.running_time}</p>
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
          <div class="p-chip">
            <a href={demo.pr_url}>
              <img
                height="32"
                width="32"
                src="static/images/gh.png"
                alt={demo.name}
              />
            </a>
          </div>
          <div class="p-chip">
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
            type={DemoUpdateStates.DELETE}
            onClick={handleSubmit}
          />
          <DemoButton
            name={demo.name}
            type={DemoUpdateStates.RESTART}
            onClick={handleSubmit}
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
    return fetch(`/demo/update?name=${name}&state=${state}`).then(() => {
      getDemoStatus(name).then((status) => {
        // Update the demo in the list
        setDemos(
          demos.map((demo: DemoService) => {
            if (demo.name === name) {
              return { ...demo, status: status };
            }
            return demo;
          })
        );
      });
    });
  };

  const handleSearch = (query: string) => {
    setDemosList(demos.filter((demo) => demo.name.includes(query)));
  };

  React.useEffect(() => {
    getDemos().then((data) => {
      setDemos(data); // Load static list of demos
      setDemosList(data);
      setIsLoading(false);
    });
  }, []);

  React.useEffect(() => {
    // Refresh the list of demos every 5 seconds
    const timeout = setTimeout(() => {
      getDemos().then((data) => {
        setDemos(data);
      });
    }, 5 * 1000);

    return () => clearTimeout(timeout);
  }, []);

  React.useEffect(() => {
    handleSearch(searchInput);
  }, [searchInput]);

  return (
    <div class="p-strip">
      <div class="row">
        <h1 class="p-heading--3">Running demos</h1>
        <form class="p-search-box">
          <label class="u-off-screen" for="search">
            Search
          </label>
          <input
            type="search"
            id="search"
            class="p-search-box__input"
            name="search"
            placeholder="Search"
            required=""
            autocomplete="on"
            onChange={(e) => setSearchInput(e.target.value)}
            value={searchInput}
          />
          <button type="reset" class="p-search-box__reset">
            <i class="p-icon--close">Close</i>
          </button>
          <button type="submit" class="p-search-box__button">
            <i class="p-icon--search">Search</i>
          </button>
        </form>
      </div>
      <div class="row">
        {isLoading ? (
          <div class="u-align--center">
            <i class="p-icon--spinner u-animation--spin"></i>
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
