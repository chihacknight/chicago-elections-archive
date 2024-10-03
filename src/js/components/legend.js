import { For } from "solid-js"
import { useMapStore } from "../providers/map"

const Legend = (props) => {
  const width = 100 / props.colors.length
  const firstLastWidth = width * 1.5
  const widthBasis = `${width}%`
  const firstLastWidthBasis = `${firstLastWidth}%`
  return (
    <>
      <div style={{}}>
        <div class="horizontal-bars">
          <For each={props.colors}>
            {(color, index) => (
              <div
                class="color-bar"
                style={{
                  "background-color": color,
                }}
              />
            )}
          </For>
        </div>
        <div
          class="horizontal-bars"
          style={{
            padding: `0 ${100 / props.colors.length / 2}%`,
          }}
        >
          <For each={props.values}>
            {(value, index) => (
              <p
                style={{
                  textAlign: "center",
                  flex: 1,
                }}
              >
                {Math.round(value)}%
              </p>
            )}
          </For>
        </div>
        {/* <span class="ramp-label">0%</span>
        <span class="ramp-label">100%</span> */}
      </div>
      <For each={props.candidates}>
        {({ name, color, votes }) => (
          <div class="legend-row">
            <div class="legend-row-details">
              <span class="color" style={{ "background-color": color }} />{" "}
              <span class="label">{props.displayOverrides[name] || name}</span>
            </div>
            <div class="numbers">
              <div>{votes.toLocaleString()}</div>
              <div class="percent">
                {((votes / props.totalVotes) * 100)
                  .toFixed(1)
                  .replace("100.0", "100")}
                %
              </div>
            </div>
          </div>
        )}
      </For>
    </>
  )
}

export default Legend
