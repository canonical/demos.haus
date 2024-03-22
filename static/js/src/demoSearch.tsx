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
      },
      {
        filterKey: "status",
        value: "failed",
      },
      {
        filterKey: "status",
        value: "building",
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

  const getChipState = (item) => {
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
    <div class="p-search-and-filter__panel">
      {props.data.map((item) => {
        return (
          <div class="p-filter-panel-section">
            <h3 class="p-filter-panel-section__heading">{item.sectionName}</h3>
            <div class="p-filter-panel-section__chips" aria-expanded="false">
              {item.items.map((item) => (
                <button
                  class="p-chip"
                  aria-pressed={`${getChipState(item)?.chipState}`}
                  onClick={() => handleChipClick(item)}
                >
                  <span class="p-chip__lead">{item.filterKey}</span>
                  <span class="p-chip__value">
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
      <div class="p-search-and-filter">
        <div
          class="p-search-and-filter__search-container"
          aria-expanded="false"
          data-active="true"
          data-empty="true"
        >
          <form class="p-search-and-filter__box" data-overflowing="false">
            <label class="u-off-screen" for="search">
              Search and filter
            </label>
            <input
              autocomplete="off"
              class="p-search-and-filter__input"
              id="search"
              name="search"
              placeholder="Search and filter"
              type="search"
              onChange={(e) => props.onChange(e.target.value)}
              value={props.value}
            />
            <button alt="search" class="u-off-screen" type="submit">
              Search
            </button>
          </form>
        </div>
        {props.value.length > 0 && (
          <>
            <SearchPanel data={panelData} onFilter={props.onFilter} />
            <div class="p-strip"></div>
            <div class="p-strip"></div>
          </>
        )}
      </div>
    </>
  );
}
