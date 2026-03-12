import GrassTile from "./GrassTile";
import { MY_GARDEN_TILE_SCALE } from "./gardenConstants";

export default function GardenGrid({ onTileDrop, canPlace }) {

  const gridSize = 6;
  const spacing = 2;
  const tiles = [];

  for (let x = 0; x < gridSize; x++) {
    for (let z = 0; z < gridSize; z++) {

      const offset = (gridSize * spacing) / 2;

      tiles.push(
        <GrassTile
          key={`${x}-${z}`}
          position={[
            x * spacing - offset,
            0,
            z * spacing - offset
          ]}
          tileScale={MY_GARDEN_TILE_SCALE}
          canPlace={canPlace}
          onDrop={() => onTileDrop(x, z)}
        />
      );
    }
  }

  return <>{tiles}</>;
}