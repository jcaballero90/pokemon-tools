import { useMemo, useRef, useState } from "react";
import {
  damageRequestSchema,
  damageResponseSchema,
  pokemonSetSchema,
  type CatalogResponse,
  type DamageResponse,
  type PokemonSet
} from "@pokemon-tools/contracts";
import { api } from "../../lib/api";
import { formatUiError } from "../../lib/errors";
import { locale } from "../../i18n/presentation";
import { emptySet, submittedSet } from "../teams/team-model";
import {
  DamageForm,
  type DamageConditionKey,
  type DamageField,
  type DamageSetField
} from "./DamageForm";
import { DamageResult } from "./DamageResult";

type DamageProps = {
  catalog: CatalogResponse | null;
  initialAttacker?: PokemonSet;
  initialDefender?: PokemonSet;
};
const noOptions: string[] = [];
const damageDefaults: DamageField = {
  gameType: "Singles",
  weather: "",
  terrain: "",
  reflect: false,
  lightScreen: false,
  auroraVeil: false,
  helpingHand: false,
  critical: false,
  attackerTerastallized: false,
  defenderTerastallized: false,
  friendGuard: false,
  stealthRock: false,
  spikes: 0
};
export function Damage({ catalog, initialAttacker, initialDefender }: DamageProps) {
  const speciesNames = useMemo(
    () => catalog?.species.map((entry) => entry.name) ?? noOptions,
    [catalog]
  );
  const [attacker, setAttacker] = useState<PokemonSet>(initialAttacker ?? emptySet());
  const [defender, setDefender] = useState<PokemonSet>(initialDefender ?? createFallbackDefender());
  const [move, setMove] = useState("Thunderbolt");
  const [field, setField] = useState<DamageField>({ ...damageDefaults });
  const [result, setResult] = useState<{ key: string; value: DamageResponse } | null>(null);
  const [error, setError] = useState<{ key: string; cause: unknown } | null>(null);
  const [pendingKey, setPendingKey] = useState<string | null>(null);
  const requestId = useRef(0);
  const currentKey = JSON.stringify({ attacker, defender, move, field });
  const currentKeyRef = useRef(currentKey);
  currentKeyRef.current = currentKey;

  async function handleCalculate() {
    const id = ++requestId.current;
    const requestKey = currentKey;
    setError(null);
    setResult(null);
    setPendingKey(requestKey);

    try {
      const input = damageRequestSchema.parse({
        attacker: submittedSet(attacker),
        defender: submittedSet(defender),
        move,
        field
      });
      const calculated = await api<DamageResponse>(
        "/damage",
        { method: "POST", body: JSON.stringify(input) },
        damageResponseSchema
      );

      if (id === requestId.current && requestKey === currentKeyRef.current) {
        setResult({ key: requestKey, value: calculated });
      }
    } catch (cause) {
      if (id === requestId.current && requestKey === currentKeyRef.current) {
        setError({ key: requestKey, cause });
      }
    } finally {
      if (id === requestId.current) setPendingKey(null);
    }
  }

  function handleAttackerFieldChange(fieldName: DamageSetField, value: string) {
    setAttacker((current) => ({ ...current, [fieldName]: value }));
  }

  function handleDefenderFieldChange(fieldName: DamageSetField, value: string) {
    setDefender((current) => ({ ...current, [fieldName]: value }));
  }

  function handleMoveChange(nextMove: string) {
    setMove(nextMove);
  }

  function handleGameTypeChange(value: string) {
    setField((current) => ({ ...current, gameType: value as DamageField["gameType"] }));
  }

  function handleWeatherChange(value: string) {
    setField((current) => ({ ...current, weather: value as DamageField["weather"] }));
  }

  function handleTerrainChange(value: string) {
    setField((current) => ({ ...current, terrain: value as DamageField["terrain"] }));
  }

  function handleConditionChange(key: DamageConditionKey, checked: boolean) {
    setField((current) => ({ ...current, [key]: checked }));
  }

  function handleSpikesChange(value: string) {
    setField((current) => ({ ...current, spikes: Number(value) }));
  }

  const visibleResult = result?.key === currentKey ? result.value : null;
  const visibleError = error?.key === currentKey ? formatUiError(error.cause, locale) : null;
  const isCalculating = pendingKey === currentKey;
  return (
    <div className="damage-layout">
      <DamageForm
        catalog={catalog}
        speciesNames={speciesNames}
        attacker={attacker}
        defender={defender}
        move={move}
        field={field}
        isCalculating={isCalculating}
        error={visibleError}
        onAttackerFieldChange={handleAttackerFieldChange}
        onDefenderFieldChange={handleDefenderFieldChange}
        onMoveChange={handleMoveChange}
        onGameTypeChange={handleGameTypeChange}
        onWeatherChange={handleWeatherChange}
        onTerrainChange={handleTerrainChange}
        onConditionChange={handleConditionChange}
        onSpikesChange={handleSpikesChange}
        onCalculate={() => void handleCalculate()}
      />
      <DamageResult
        result={visibleResult}
        attackerName={attacker.species}
        defenderName={defender.species}
        attacker={attacker}
        defender={defender}
        field={field}
        moveName={move}
        isCalculating={isCalculating}
        hasCatalog={catalog !== null}
      />
    </div>
  );
}

function createFallbackDefender(): PokemonSet {
  return pokemonSetSchema.parse({ species: "Charizard", moves: ["Flamethrower"] });
}
