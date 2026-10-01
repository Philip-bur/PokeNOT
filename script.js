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
  const maxRoll = 100 + attacker.level;
  const roll = Math.floor(Math.random() * maxRoll) + 1;

  const critical = roll > 100;
  const typeMultiplier = getTypeMultiplier(attacker.type, defender.type);
  const rollMultiplier = getRollDamageMultiplier(roll);

  const damage = Math.round(
    baseDamage * typeMultiplier * rollMultiplier
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

  // Gegner besiegt: 30 % der maximalen HP heilen und ein Level aufsteigen.
  player.hp = Math.min(
    player.maxHp,
    player.hp + Math.round(player.maxHp * 0.30)
  );
  player.level += 1;

  const nextEnemy = createNextOpponent(player.level);

  return {
    ...result,
    status: "enemy-defeated",
    playerHp: player.hp,
    playerLevel: player.level,
    nextEnemy
  };
}

const player = {
  type: "Feuer",
  level: 10,
  hp: 80,
  maxHp: 100
};

const enemy = {
  type: "Wasser",
  level: 11,
  hp: 100,
  maxHp: 100
};