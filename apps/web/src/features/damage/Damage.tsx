import { useEffect, useMemo, useRef, useState } from "react";
import {
  damageRequestSchema,
  damageResponseSchema,
  statIds,
  pokemonSetSchema,
  type CatalogResponse,
  type DamageResponse,
  type PokemonSet
} from "@pokemon-tools/contracts";
import { api } from "../../lib/api";
import { formatUiError } from "../../lib/errors";
import { locale } from "../../i18n/presentation";
import { copyPokemonSet, emptySet, type DamageTransfer } from "../teams/team-model";
import { isCatalogMove, validatePokemonSet } from "../teams/set-validation";
import {
  DamageForm,
  type DamageConditionKey,
  type DamageField,
  type DamageSetField
} from "./DamageForm";
import { DamageResult } from "./DamageResult";
import { blankDamageSpreadDraft, mergeDamageSpreadOverrides, type DamageSpreadDraft, type DamageSpreadId } from "./damage-spreads";

type DamageProps = {
  catalog: CatalogResponse | null;
  initialAttacker?: PokemonSet;
  initialDefender?: PokemonSet;
  transfer?: DamageTransfer;
  onTransferConsumed?: (id: string) => void;
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
export function Damage({ catalog, initialAttacker, initialDefender, transfer, onTransferConsumed }: DamageProps) {
  const speciesNames = useMemo(
    () => catalog?.species.map((entry) => entry.name) ?? noOptions,
    [catalog]
  );
  const [attacker, setAttacker] = useState<PokemonSet>(initialAttacker ?? emptySet());
  const [defender, setDefender] = useState<PokemonSet>(initialDefender ?? createFallbackDefender());
  const [transferSummary, setTransferSummary] = useState<{ attacker: PokemonSet; defender: PokemonSet } | null>(null);
  const [attackerOverrides, setAttackerOverrides] = useState<DamageSpreadDraft>(blankDamageSpreadDraft);
  const [defenderOverrides, setDefenderOverrides] = useState<DamageSpreadDraft>(blankDamageSpreadDraft);
  const [move, setMove] = useState("Thunderbolt");
  const [field, setField] = useState<DamageField>({ ...damageDefaults });
  const [result, setResult] = useState<{
    key: string;
    value: DamageResponse;
    attacker: PokemonSet;
    defender: PokemonSet;
  } | null>(null);
  const [error, setError] = useState<{ key: string; cause: unknown } | null>(null);
  const [pendingKey, setPendingKey] = useState<string | null>(null);
  const requestId = useRef(0);
  const appliedTransferId = useRef<string | null>(null);
  const currentKey = JSON.stringify({ attacker, defender, attackerOverrides, defenderOverrides, move, field });
  const currentKeyRef = useRef(currentKey);
  currentKeyRef.current = currentKey;

  useEffect(() => {
    if (!transfer || appliedTransferId.current === transfer.id) return;
    appliedTransferId.current = transfer.id;
    const nextAttacker = copyPokemonSet(transfer.attacker);
    const nextDefender = copyPokemonSet(transfer.defender);
    requestId.current++;
    setAttacker(nextAttacker);
    setDefender(nextDefender);
    setTransferSummary({ attacker: nextAttacker, defender: nextDefender });
    setAttackerOverrides(blankDamageSpreadDraft());
    setDefenderOverrides(blankDamageSpreadDraft());
    setMove(transfer.move);
    setField({ ...damageDefaults });
    setResult(null);
    setError(null);
    setPendingKey(null);
    onTransferConsumed?.(transfer.id);
  }, [transfer, onTransferConsumed]);

  async function handleCalculate() {
    const attackerInput = mergeDamageSpreadOverrides(attacker, attackerOverrides);
    const defenderInput = mergeDamageSpreadOverrides(defender, defenderOverrides);
    if (!catalog || validatePokemonSet(attackerInput, catalog).length > 0 ||
      validatePokemonSet(defenderInput, catalog).length > 0 || !isCatalogMove(move, catalog)) return;

    const id = ++requestId.current;
    const requestKey = currentKey;
    setError(null);
    setResult(null);
    setPendingKey(requestKey);

    try {
      const input = damageRequestSchema.parse({
        attacker: attackerInput,
        defender: defenderInput,
        move,
        field
      });
      const calculated = await api<DamageResponse>(
        "/damage",
        { method: "POST", body: JSON.stringify(input) },
        damageResponseSchema
      );

      if (id === requestId.current && requestKey === currentKeyRef.current) {
        setResult({ key: requestKey, value: calculated, attacker: input.attacker, defender: input.defender });
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

  function handleSpreadChange(side: DamageSpreadId, spread: "evs" | "ivs", stat: (typeof statIds)[number], value: string) {
    const update = (current: DamageSpreadDraft): DamageSpreadDraft => ({
      ...current,
      [spread]: { ...current[spread], [stat]: value }
    });
    if (side === "attacker") setAttackerOverrides(update);
    else setDefenderOverrides(update);
  }

  function handleResetSpreadOverrides(side: DamageSpreadId) {
    if (side === "attacker") setAttackerOverrides(blankDamageSpreadDraft());
    else setDefenderOverrides(blankDamageSpreadDraft());
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

  function handleSpikesChange(value: number | null) {
    if (value !== null) setField((current) => ({ ...current, spikes: value }));
  }

  const visibleResult = result?.key === currentKey ? result : null;
  const visibleError = error?.key === currentKey ? formatUiError(error.cause, locale) : null;
  const isCalculating = pendingKey === currentKey;
  return (
    <div className="damage-layout">
      <DamageForm
        catalog={catalog}
        speciesNames={speciesNames}
        attacker={attacker}
        defender={defender}
        attackerIssues={validatePokemonSet(mergeDamageSpreadOverrides(attacker, attackerOverrides), catalog)}
        defenderIssues={validatePokemonSet(mergeDamageSpreadOverrides(defender, defenderOverrides), catalog)}
        attackerOverrides={attackerOverrides}
        defenderOverrides={defenderOverrides}
        move={move}
        field={field}
        transferSummary={transferSummary}
        isCalculating={isCalculating}
        error={visibleError}
        onAttackerFieldChange={handleAttackerFieldChange}
        onDefenderFieldChange={handleDefenderFieldChange}
        onSpreadChange={handleSpreadChange}
        onResetSpreadOverrides={handleResetSpreadOverrides}
        onMoveChange={handleMoveChange}
        onGameTypeChange={handleGameTypeChange}
        onWeatherChange={handleWeatherChange}
        onTerrainChange={handleTerrainChange}
        onConditionChange={handleConditionChange}
        onSpikesChange={handleSpikesChange}
        onCalculate={() => void handleCalculate()}
      />
      <DamageResult
        result={visibleResult?.value ?? null}
        attackerName={attacker.species}
        defenderName={defender.species}
        attacker={visibleResult?.attacker ?? attacker}
        defender={visibleResult?.defender ?? defender}
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
