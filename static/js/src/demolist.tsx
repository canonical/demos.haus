import React from "react";
import ReactDOM from "react-dom";

import DemoCard from "./demoCard";
import DemoSearch from "./demoSearch";
import { DemoUpdateStates, DemoService } from "./types";

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
