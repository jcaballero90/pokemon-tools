import { useMemo, useState } from "react";
import type { PokedexResponse } from "@pokemon-tools/contracts";
import { t } from "../../i18n/presentation";

export type PokemonGender = "male" | "female";

export function PokemonArtwork({ name, detail, shiny, onShinyChange, gender, onGenderChange }: {
  name: string;
  detail: PokedexResponse | null;
  shiny: boolean;
  onShinyChange: (value: boolean) => void;
  gender: PokemonGender;
  onGenderChange: (value: PokemonGender) => void;
}) {
  const genderVariants = detail?.artwork?.genderVariants;
  const maleAvailable = genderVariants
    ? genderVariants.male.normal.length > 0
    : Boolean(detail?.artwork?.normal.length || detail?.sprite);
  const femaleAvailable = Boolean(genderVariants?.female.normal.length);
  const activeGender: PokemonGender = gender === "male" && !maleAvailable && femaleAvailable ? "female" : gender;
  const activeGenderArtwork = genderVariants?.[activeGender];
  const candidates = useMemo(() => {
    if (!detail) return [];
    if (activeGenderArtwork) return shiny ? activeGenderArtwork.shiny : activeGenderArtwork.normal;
    if (activeGender === "female") return [];
    if (shiny) return detail.artwork?.shiny ?? [];
    return detail.artwork?.normal.length ? detail.artwork.normal : detail.sprite ? [detail.sprite] : [];
  }, [activeGender, activeGenderArtwork, detail, shiny]);
  const candidateKey = `${name}\u0000${activeGender}\u0000${shiny}\u0000${candidates.join("\u0000")}`;
  const [candidateFailure, setCandidateFailure] = useState<{ key: string; index: number } | null>(null);
  const failedCandidates = candidateFailure?.key === candidateKey ? candidateFailure.index : 0;

  const src = candidates[failedCandidates];
  const hasShiny = activeGenderArtwork
    ? activeGenderArtwork.shiny.length > 0
    : activeGender === "male" && Boolean(detail?.artwork?.shiny.length);
  function selectGender(next: PokemonGender) {
    if (next === activeGender || (next === "male" ? !maleAvailable : !femaleAvailable)) return;
    if (shiny && !genderVariants?.[next].shiny.length) onShinyChange(false);
    onGenderChange(next);
  }

  return (
    <aside className="pokemon-artwork" aria-label={`${name} artwork`}>
      <div className="pokemon-artwork-frame">
        {src ? (
          <img
            key={`${name}-${shiny}-${src}`}
            src={src}
            alt={name}
            width="360"
            height="360"
            onError={() => setCandidateFailure((current) => {
              const currentIndex = current?.key === candidateKey ? current.index : 0;
              return { key: candidateKey, index: Math.min(currentIndex + 1, candidates.length) };
            })}
          />
        ) : (
          <div className="artwork-placeholder" role="img" aria-label={t.pokedex.artworkUnavailable}>
            <span aria-hidden="true">◇</span>
            <span>{t.pokedex.artworkUnavailable}</span>
          </div>
        )}
      </div>
      <div className="artwork-controls">
        <div className="artwork-control-row" role="group" aria-label={t.pokedex.artworkControls}>
          <button
            type="button"
            className="gender-toggle"
            aria-label={t.pokedex.maleArtwork}
            aria-pressed={activeGender === "male"}
            disabled={!maleAvailable}
            onClick={() => selectGender("male")}
          >
            {t.pokedex.maleArtwork}
          </button>
          <button
            type="button"
            className="gender-toggle"
            aria-label={t.pokedex.femaleArtwork}
            aria-pressed={activeGender === "female"}
            disabled={!femaleAvailable}
            onClick={() => selectGender("female")}
          >
            {t.pokedex.femaleArtwork}
          </button>
          <button
            type="button"
            className="shiny-toggle"
            aria-pressed={shiny}
            disabled={!hasShiny}
            onClick={() => onShinyChange(!shiny)}
          >
            <span className="shiny-sparkle" aria-hidden="true">✦</span>
            {t.pokedex.shinyArtwork}
          </button>
        </div>
        {!hasShiny && detail && <span className="shiny-note">{t.pokedex.shinyUnavailable}</span>}
      </div>
    </aside>
  );
}
