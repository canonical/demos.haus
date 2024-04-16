import React from "react";
import { DemoService } from "./types";

interface DemoSearchProps {
  value: string;
  onChange: (query) => void;
  onFilter: (query: string, filterKey: keyof DemoService) => void;
}

interface SearchChip {
  filterKey: keyof DemoService;
  value: string;
  color: "caution" | "negative" | "positive" | "information" | "";
}

interface SearchPanelData {
  sectionName: string;
  items: SearchChip[];
}

const panelData: SearchPanelData[] = [
  {
    sectionName: "Status",
    items: [
      {
        filterKey: "status",
        value: "running",
        color: "positive",
      },
      {
        filterKey: "status",
        value: "failed",
        color: "negative",
      },
      {
        filterKey: "status",
        value: "building",
        color: "caution",
      },
    ],
  },
];

const SearchPanel = (props: {
  data: SearchPanelData[];
  onFilter: (query: string, filterKey: keyof DemoService) => void;
}) => {
  const [chipStates, setChipStates] = React.useState([]);

  const handleChipClick = (item) => {
    props.onFilter(item.value, item.filterKey);

    const newChipStates = chipStates.map((chipStateItem, _) => {
      if (chipStateItem.id === getId(item)) {
        return { ...chipStateItem, chipState: !chipStateItem.chipState };
      }
      return { ...chipStateItem, chipState: false };
    });

    setChipStates(newChipStates);
  };

  const getId = (item) => {
    return item.filterKey + item.value;
  };

  const getChip = (item) => {
    return chipStates.find((chipState) => chipState.id === getId(item));
  };

  React.useEffect(() => {
    let states = new Array();
    props.data.map((section) =>
      section.items.map((item) => {
        states.push({ id: getId(item), chipState: false });
      })
    );
    setChipStates(states);
  }, []);

  return (
    <div className="p-card">
      {props.data.map((item) => {
        return (
          <div>
            <h3 className="p-heading--3">{item.sectionName}</h3>
            <div
              className="p-filter-panel-section__chips"
              aria-expanded="false"
            >
              {item.items.map((item) => (
                <button
                  className={`p-chip--${item.color}`}
                  aria-pressed={`${getChip(item)?.chipState}`}
                  onClick={() => handleChipClick(item)}
                >
                  <span className="p-chip__lead">{item.filterKey}</span>
                  <span className="p-chip__value">
                    {item.value.charAt(0).toLocaleUpperCase() +
                      item.value.slice(1)}
                  </span>
                </button>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default function DemoSearch(props: DemoSearchProps) {
  return (
    <>
      <div className="p-search-and-filter">
        <div
          className="p-search-and-filter__search-container"
          aria-expanded="false"
          data-active="true"
          data-empty="true"
        >
          <div className="p-search-and-filter__box" data-overflowing="false">
            <label className="u-off-screen" htmlFor="search">
              Search
            </label>
            <input
              autoComplete="off"
              className="p-search-and-filter__input"
              id="search"
              name="search"
              placeholder="Search"
              type="search"
              onChange={(e) => props.onChange(e.target.value)}
              value={props.value}
            />
          </div>
        </div>
        <div>
          <SearchPanel data={panelData} onFilter={props.onFilter} />
        </div>
      </div>
    </>
  );
}
