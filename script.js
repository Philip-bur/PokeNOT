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

function getRollDamageMultiplier(roll) {
  if (roll > 100) return 1.2; // Kritischer Treffer

  // Zwischen den angegebenen Tabellenwerten linear interpolieren:
  if (roll <= 50) {
    return 0.75 + ((roll - 1) / 49) * 0.125;
  }

  if (roll <= 99) {
    return 0.875 + ((roll - 50) / 49) * 0.12;
  }

  return 1; // Wurf 100 = 100 % Schaden
}

function resolveAttack(attacker, defender, baseDamage, player, enemy, createNextOpponent) {
  const critical = Math.random() < 0.5;
  const roll = critical
    ? 101 + Math.floor(Math.random() * attacker.level)
    : Math.floor(Math.random() * 100) + 1;
  const typeMultiplier = getTypeMultiplier(attacker.type, defender.type);
  const rollMultiplier = getRollDamageMultiplier(roll);
  const levelDamageMultiplier = 1 + ((attacker.level - 1) * 0.05);

  const damage = Math.round(
    baseDamage * levelDamageMultiplier * typeMultiplier * rollMultiplier
  );

  defender.hp = Math.max(0, defender.hp - damage);

  const result = {
    roll,
    critical,
    damage,
    defenderHp: defender.hp
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

  // Gegner besiegt: Level erhöhen, maximales Leben anpassen und 30 % heilen.
  player.level += 1;
  player.maxHp = 100 + ((player.level - 1) * 10);
  player.hp = Math.min(
    player.maxHp,
    player.hp + Math.round(player.maxHp * 0.30)
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