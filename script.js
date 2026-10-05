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
  damageMultiplier = 1
) {
  const roll = Math.floor(Math.random() * (100 + attacker.level)) + 1;
  const critical = roll > 100;
  const typeMultiplier = getTypeMultiplier(attackType, defender.type);
  const rollMultiplier = getRollDamageMultiplier(Math.min(roll, 100), critical);
  const levelDamageMultiplier = 1 + ((attacker.level - 1) * 0.05);

  const damage = Math.round(
    baseDamage *
    levelDamageMultiplier *
    typeMultiplier *
    rollMultiplier *
    damageMultiplier
  );

  defender.hp = Math.max(0, defender.hp - damage);

  const result = {
    roll,
    critical,
    damage,
    typeMultiplier,
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