import { catalogId } from "../../lib/catalog-labels";
import { typeCatalog } from "../../locales/en";

const typeSpriteRoot =
  "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/types/generation-ix/scarlet-violet/small";

export function typeClassName(type: string): string | undefined {
  const typeId = catalogId(type);
  return Object.hasOwn(typeCatalog, typeId) ? `type-${typeId}` : undefined;
}

export function TypeIcon({ type, size = 20 }: { type: string; size?: number }) {
  const typeDetails = typeCatalog[catalogId(type)];
  if (!typeDetails) return null;

  return (
    <img
      className="pokemon-type-icon"
      src={`${typeSpriteRoot}/${typeDetails.spriteId}.png`}
      width={size}
      height={size}
      alt=""
      aria-hidden="true"
      draggable="false"
      onError={(event) => { event.currentTarget.hidden = true; }}
    />
  );
}
