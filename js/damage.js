function getTypeMultiplier(attackerType, defenderType) {
  const strengths = {
    Feuer: "Pflanze",
    Pflanze: "Wasser",
    Wasser: "Feuer"
  };

  const weaknesses = {
    Feuer: "Wasser",
    Pflanze: "Feuer",
    Wasser: "Pflanze"
  };

  if (strengths[attackerType] === defenderType) return 1.5;
  if (weaknesses[attackerType] === defenderType) return 0.8;
  return 1;
}

function getRollDamageMultiplier(roll, critical) {
  if (critical) return 1.2; // Kritischer Treffer

  // Zwischen den angegebenen Tabellenwerten linear interpolieren:
  if (roll <= 50) {
    return 0.75 + ((roll - 1) / 49) * 0.125;
  }

  if (roll <= 99) {
    return 0.875 + ((roll - 50) / 49) * 0.12;
  }

  return 1; // Wurf 100 = 100 % Schaden
}

function resolveAttack(
  attacker,
  defender,
  baseDamage,
  player,
  enemy,
  createNextOpponent,
  attackType = "Normal",
  damageMultiplier = 1,
  effect = null
) {
  if (attacker.paralyzed && Math.random() < 0.25) {
    return {
      roll: null,
      critical: false,
      dodged: false,
      paralyzedAttack: true,
      dodgeChance: Math.min(25, Math.min(defender.level, 10) + (defender.dodgeBonus || 0)),
      damage: 0,
      typeMultiplier: getTypeMultiplier(attackType, defender.type),
      defenderHp: defender.hp,
      effectApplied: "paralysis-failed",
      status: "next-turn"
    };
  }

  const roll = Math.floor(Math.random() * (100 + attacker.level)) + 1;
  const critical = roll > 100;
  const dodgeChance = Math.min(25, Math.min(defender.level, 10) + (defender.dodgeBonus || 0));
  const dodged = !critical && effect?.cannotDodge !== true && Math.random() * 100 < dodgeChance;
  const typeMultiplier = getTypeMultiplier(attackType, defender.type);
  const rollMultiplier = getRollDamageMultiplier(Math.min(roll, 100), critical);
  const levelDamageBonus = attacker === enemy
    ? Math.min(0.30, (attacker.level - 1) * 0.05)
    : Math.min(0.50, (attacker.level - 1) * 0.05);
  const levelDamageMultiplier = 1 + levelDamageBonus;

  const damage = Math.round(
    baseDamage *
    levelDamageMultiplier *
    typeMultiplier *
    rollMultiplier *
    damageMultiplier
  );

  const paralysisApplied = !dodged
    && effect?.type === "paralysis"
    && Math.random() < 0.75;
  const dealtDamage = dodged || paralysisApplied ? 0 : damage;
  defender.hp = Math.max(0, defender.hp - dealtDamage);
  if (paralysisApplied) {
    defender.paralyzed = true;
  }
  if (!dodged && effect?.type === "burn") {
    defender.burnTurns = 5;
    const burnSourceDamage = Math.round(
      (effect.burnBaseDamage || baseDamage) *
      levelDamageMultiplier *
      typeMultiplier *
      rollMultiplier
    );
    defender.burnDamage = Math.max(1, Math.round(burnSourceDamage * 0.2));
  }
  if (effect?.type === "muddy-water") {
    attacker.dodgeBonus = 25;
    attacker.dodgeBonusTurns = 3;
  }

  const result = {
    roll,
    critical,
    dodged,
    dodgeChance,
    damage: dealtDamage,
    typeMultiplier,
    defenderHp: defender.hp,
    paralyzedAttack: false,
    effectApplied: paralysisApplied
      ? "paralysis"
      : !dodged && effect?.type === "paralysis"
        ? "paralysis-damage"
        : !dodged && effect?.type !== "muddy-water"
          ? effect?.type
          : effect?.type === "muddy-water"
            ? "muddy-water"
            : null,
    burnDamage: !dodged && effect?.type === "burn" ? defender.burnDamage : 0,
    burnTurns: !dodged && effect?.type === "burn" ? defender.burnTurns : 0,
    dodgeBonus: effect?.type === "muddy-water" ? attacker.dodgeBonus : 0,
    dodgeBonusTurns: effect?.type === "muddy-water" ? attacker.dodgeBonusTurns : 0,
    paralysisApplied,
    paralyzed: paralysisApplied ? defender.paralyzed : false
  };

  if (defender.hp > 0) {
    return { ...result, status: "next-turn" };
  }

  if (defender === player) {
    return { ...result, status: "game-over" };
  }

  if (defender !== enemy) {
    throw new Error("Der Verteidiger muss das eigene oder das gegnerische Pokémon sein.");
  }

  // Gegner besiegt: Level erhöhen, maximales Leben anpassen und 50 % heilen.
  player.level += 1;
  player.maxHp = 100 + ((player.level - 1) * 10);
  player.hp = Math.min(
    player.maxHp,
    player.hp + Math.round(player.maxHp * 0.50)
  );

  const nextEnemy = createNextOpponent(player.level);

  return {
    ...result,
    status: "enemy-defeated",
    playerHp: player.hp,
    playerLevel: player.level,
    playerMaxHp: player.maxHp,
    nextEnemy
  };
}