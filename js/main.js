        let pokemonPool = {};
        let pokemonImages = {};

        const pokemonSelection = document.querySelector('.pokemon-selection');
        const pokemonOptions = document.querySelector('.pokemon-options');
        const battleScreen = document.querySelector('.battle-screen');
        const settingsScreen = document.querySelector('.settings-screen');
        const patchNotesScreen = document.querySelector('.patch-notes-screen');
        const patchNotesButton = document.querySelector('.patch-notes-button');
        const patchNotesCloseButton = document.querySelector('.patch-notes-close');
        const inventoryButton = document.querySelector('.inventory-button');
        const inventoryScreen = document.querySelector('.inventory-screen');
        const inventoryCloseButton = document.querySelector('.inventory-close');
        const inventoryUseButton = document.querySelector('.inventory-use-button');
        const inventoryItemCount = document.querySelector('.inventory-item-count strong');
        const diceGrid = document.querySelector('.dice-grid');
        const volumeValue = document.querySelector('.volume-value');
        const rollVolumeButton = document.querySelector('.roll-volume-button');
        const themeAudio = document.querySelector('#theme-audio');
        const playerPokemonName = document.querySelector('.player-pokemon-name');
        const playerPokemonImage = document.querySelector('.player-pokemon-image');
        const playerPokemonLevel = document.querySelector('.player-pokemon-level');
        const opponentPokemonName = document.querySelector('.opponent-pokemon-name');
        const opponentPokemonImage = document.querySelector('.opponent-pokemon-image');
        const opponentPokemonLevel = document.querySelector('.opponent-pokemon-level');
        const playerBattleCard = document.querySelector('.battle-card.player');
        const opponentBattleCard = document.querySelector('.battle-card.opponent');
        const playerHealthFill = document.querySelector('.player-health-fill');
        const opponentHealthFill = document.querySelector('.opponent-health-fill');
        const playerHealthPoints = document.querySelector('.player-health-points');
        const opponentHealthPoints = document.querySelector('.opponent-health-points');
        const playerCombatStats = document.querySelector('.player-combat-stats');
        const opponentCombatStats = document.querySelector('.opponent-combat-stats');
        const scoreList = document.querySelector('.score-list');
        const battleStatus = document.querySelector('.battle-status');
        const tackleButton = document.querySelector('.tackle-button');
        const specialAttackButton = document.querySelector('.special-attack-button');
        const stunButton = document.querySelector('.stun-button');
        const highscoreSaveButton = document.querySelector('.highscore-save-button');
        const highscoreEntry = document.querySelector('.highscore-entry');
        const highscoreNameInput = document.querySelector('.highscore-name-input');
        const highscoreConfirmButton = document.querySelector('.highscore-confirm-button');
        const autoBattleButton = document.querySelector('.auto-battle-button');
        const attackNames = {
            Feuer: 'Blazing Destruction',
            Wasser: 'Bubble',
            Pflanze: 'Leech Seed'
        };
        const attackDescriptions = {
            Feuer: 'Verursacht Feuerschaden und kann kritisch treffen.',
            Wasser: 'Verursacht Wasserschaden und kann kritisch treffen.',
            Pflanze: 'Verursacht Pflanzenschaden und kann kritisch treffen.'
        };
        const abilityDescriptions = {
            Feuer: 'Aktiviert Burn: Verursacht 20% des Blazing-Destruction-Schadens pro Runde für 5 Runden. Verursacht keinen direkten Schaden und kann nicht kritisch treffen.',
            Wasser: 'Erhöht die eigene Dodge-Rate für 3 Runden auf 25%. Verursacht keinen direkten Schaden und kann nicht kritisch treffen.',
            Pflanze: 'Hat eine 75% Chance, den Gegner zu paralysieren. Andernfalls verursacht sie 50% des Tackle-Schadens.'
        };
        const battleMessageDelay = 1200;
        let playerPokemon = null;
        let playerCombatant = null;
        let opponentCombatant = null;
        let opponentCount = 0;
        let isPlayerTurn = true;
        let autoBattleEnabled = false;
        let healingPotionCount = 0;
        let gameOverRecorded = false;
        const highscoreStorageKey = 'pokenot-highscore';
        const volumeStorageKey = 'pokenot-volume';
        const volumeDiceStorageKey = 'pokenot-volume-dice';
        const volumeDice = Array.from({ length: 10 }, () => 1);

        async function loadPokemonData() {
            const response = await fetch('data/pokemon.json');
            if (!response.ok) {
                throw new Error(`Pokémon-Daten konnten nicht geladen werden (${response.status}).`);
            }

            const data = await response.json();
            if (!Array.isArray(data.pokemon) || data.pokemon.length === 0) {
                throw new Error('Die Pokémon-JSON enthält keine gültigen Pokémon.');
            }

            pokemonPool = {};
            pokemonImages = {};
            data.pokemon.forEach(({ name, type, image }) => {
                if (!name || !type || !image) {
                    throw new Error('Ein Pokémon in der JSON enthält unvollständige Daten.');
                }
                if (!pokemonPool[type]) pokemonPool[type] = [];
                pokemonPool[type].push(name);
                pokemonImages[name] = image;
            });
        }

        function getSpecialAttack(type) {
            return {
                name: attackNames[type],
                type
            };
        }

        function getTypeAbility(type) {
            return {
                Feuer: {
                    name: 'Burn',
                    type: 'Feuer',
                    baseDamage: 0,
                    damageMultiplier: 1,
                    effect: { type: 'burn', burnBaseDamage: 20, cannotDodge: true }
                },
                Wasser: {
                    name: 'Muddy Water',
                    type: 'Wasser',
                    baseDamage: 0,
                    damageMultiplier: 1,
                    effect: { type: 'muddy-water', cannotDodge: true }
                },
                Pflanze: {
                    name: 'Stun Spore',
                    type: 'Pflanze',
                    baseDamage: 20,
                    damageMultiplier: 0.5,
                    effect: { type: 'paralysis' }
                }
            }[type];
        }

        function getTackleAttack() {
            return {
                name: 'Tackle',
                type: 'Normal'
            };
        }

        function applyWebsiteVolume(volume) {
            document.querySelectorAll('audio').forEach((audio) => {
                audio.volume = volume / 100;
            });
        }

        function playThemeMusic() {
            themeAudio.play().catch(() => {
                console.warn('Der Theme-Soundtrack konnte noch nicht automatisch gestartet werden.');
            });
        }

        function updateVolumeDisplay() {
            const volume = volumeDice.reduce((total, value) => total + value, 0);
            volumeValue.textContent = volume;
            applyWebsiteVolume(volume);
            localStorage.setItem(volumeStorageKey, String(volume));
            localStorage.setItem(volumeDiceStorageKey, JSON.stringify(volumeDice));
        }

        function renderVolumeDice(heldDice = []) {
            diceGrid.replaceChildren();
            volumeDice.forEach((value, index) => {
                const control = document.createElement('label');
                control.className = 'dice-control';
                control.innerHTML = `
                    <span class="volume-die" aria-label="Würfel ${index + 1}: ${value}">${value}</span>
                    <span><input class="dice-hold" type="checkbox" ${heldDice[index] ? 'checked' : ''}> Hold</span>
                `;
                diceGrid.appendChild(control);
            });
        }

        function rollVolumeDice() {
            const heldDice = Array.from(diceGrid.querySelectorAll('.dice-hold'))
                .map((checkbox) => checkbox.checked);
            diceGrid.querySelectorAll('.dice-control').forEach((control, index) => {
                const holdCheckbox = control.querySelector('.dice-hold');
                if (!holdCheckbox.checked) {
                    volumeDice[index] = Math.floor(Math.random() * 10) + 1;
                }
            });
            renderVolumeDice(heldDice);
            updateVolumeDisplay();
        }

        function openSettings() {
            const storedDice = localStorage.getItem(volumeDiceStorageKey);
            if (storedDice) {
                try {
                    const parsedDice = JSON.parse(storedDice);
                    if (Array.isArray(parsedDice) && parsedDice.length === 10
                        && parsedDice.every((value) => Number.isInteger(value) && value >= 1 && value <= 10)) {
                        parsedDice.forEach((value, index) => {
                            volumeDice[index] = value;
                        });
                    }
                } catch (error) {
                    console.error('Gespeicherte Lautstärke-Würfel konnten nicht gelesen werden.', error);
                }
            }
            settingsScreen.classList.add('is-visible');
            renderVolumeDice();
            updateVolumeDisplay();
        }

        function updateSpecialAttackButton(type) {
            specialAttackButton.textContent = attackNames[type];
            specialAttackButton.className = `special-attack-button ${getTypeClass(type)}`;
            specialAttackButton.title = attackDescriptions[type];
            stunButton.textContent = getTypeAbility(type).name;
            stunButton.className = `stun-button ${getTypeClass(type)}`;
            stunButton.title = abilityDescriptions[type];
        }

        function setAttackButtonsDisabled(disabled) {
            tackleButton.disabled = disabled || autoBattleEnabled;
            specialAttackButton.disabled = disabled || autoBattleEnabled;
            stunButton.disabled = disabled || autoBattleEnabled;
            inventoryButton.disabled = disabled || autoBattleEnabled;
        }

        function updateInventoryDisplay() {
            inventoryButton.textContent = `INVENTAR (${healingPotionCount})`;
            inventoryButton.disabled = !isPlayerTurn || autoBattleEnabled;
            inventoryItemCount.textContent = healingPotionCount;
            inventoryUseButton.disabled = !isPlayerTurn || autoBattleEnabled || healingPotionCount === 0;
        }

        function searchForHealingPotion() {
            if (Math.random() >= 0.05) return false;

            healingPotionCount++;
            updateInventoryDisplay();
            return true;
        }

        function useHealingPotion() {
            if (!isPlayerTurn || healingPotionCount === 0 || !playerCombatant || !opponentCombatant) return;
            if (playerCombatant.hp >= playerCombatant.maxHp) {
                battleStatus.textContent = 'Dein Pokémon hat bereits volle HP.';
                return;
            }

            inventoryScreen.classList.remove('is-visible');
            inventoryScreen.setAttribute('aria-hidden', 'true');
            isPlayerTurn = false;
            setAttackButtonsDisabled(true);
            const healedHp = Math.min(
                playerCombatant.maxHp,
                Math.round(playerCombatant.maxHp * 0.20)
            );
            const previousHp = playerCombatant.hp;
            playerCombatant.hp = Math.min(playerCombatant.maxHp, playerCombatant.hp + healedHp);
            const actualHeal = playerCombatant.hp - previousHp;
            healingPotionCount--;
            updateHealthBars();
            updateInventoryDisplay();
            battleStatus.textContent = `Heiltrank benutzt: +${actualHeal} HP geheilt!`;
            window.setTimeout(performEnemyAttack, battleMessageDelay);
        }

        function scheduleAutoBattleTurn() {
            if (!autoBattleEnabled || !isPlayerTurn || !playerCombatant || !opponentCombatant) return;

            window.setTimeout(() => {
                if (!autoBattleEnabled || !isPlayerTurn || !playerCombatant || !opponentCombatant) return;

                if (Math.random() < 0.25) {
                    performTypeAbility();
                    return;
                }

                const attack = Math.random() < 0.5
                    ? getTackleAttack()
                    : getSpecialAttack(playerPokemon.type);
                performPlayerAttack(attack);
            }, battleMessageDelay);
        }

        function setAutoBattleEnabled(enabled) {
            autoBattleEnabled = enabled;
            autoBattleButton.classList.toggle('is-active', enabled);
            autoBattleButton.setAttribute('aria-pressed', String(enabled));
            autoBattleButton.textContent = `AUTO BATTLE: ${enabled ? 'AN' : 'AUS'}`;
            setAttackButtonsDisabled(!isPlayerTurn);
            if (enabled) scheduleAutoBattleTurn();
        }

        function getHighscores() {
            const storedHighscores = localStorage.getItem(highscoreStorageKey);
            if (!storedHighscores) return [];

            const highscores = JSON.parse(storedHighscores);
            return Array.isArray(highscores) ? highscores : [];
        }

        function renderHighscores() {
            scoreList.replaceChildren();
            getHighscores().forEach((entry, index) => {
                const item = document.createElement('li');
                item.className = 'score-item';
                item.innerHTML = `
                    <span class="score-rank">${index + 1}.</span>
                    <span class="score-name"></span>
                    <span class="score-points">LEVEL ${entry.level}</span>
                `;
                item.querySelector('.score-name').textContent = entry.name;
                scoreList.appendChild(item);
            });

            if (!scoreList.children.length) {
                const emptyItem = document.createElement('li');
                emptyItem.className = 'score-item';
                emptyItem.textContent = 'Noch keine Einträge';
                scoreList.appendChild(emptyItem);
            }
        }

        function saveHighscore() {
            if (gameOverRecorded || !playerCombatant) return;

            const name = highscoreNameInput.value.trim().slice(0, 18);
            if (!name) return;

            gameOverRecorded = true;
            const highscores = [
                ...getHighscores(),
                { name, level: playerCombatant.level }
            ]
                .sort((first, second) => second.level - first.level)
                .slice(0, 5);

            localStorage.setItem(highscoreStorageKey, JSON.stringify(highscores));
            renderHighscores();
            highscoreSaveButton.classList.remove('is-visible');
            highscoreEntry.classList.remove('is-visible');
            highscoreNameInput.value = '';
        }

        function showAttackResult(attackerName, attack, result) {
            const attackMessage = document.createElement('div');
            attackMessage.textContent = result.effectApplied === 'paralysis-failed'
                ? `${attackerName}s ${attack.name} schlägt wegen Paralyse fehl!`
                : result.effectApplied && result.damage === 0
                ? `${attackerName} setzt ${attack.name} ein!`
                : result.dodged
                ? `${attackerName} macht ${attack.name} – AUSGEWICHEN!`
                : result.critical
                ? `${attackerName} macht ${attack.name} – KRITISCHER TREFFER! (-${result.damage} HP)`
                : `${attackerName} macht ${attack.name} (-${result.damage} HP)`;
            battleStatus.replaceChildren(attackMessage);

            const effectivenessMessage = document.createElement('span');
            effectivenessMessage.className = 'attack-effectiveness';
            effectivenessMessage.textContent = result.typeMultiplier === 1.5
                ? '(Effektiv +50% Damage)'
                : result.typeMultiplier === 0.8
                    ? '(Uneffektiv -20% Damage)'
                    : '\u00A0';
            battleStatus.appendChild(effectivenessMessage);

            if (result.effectApplied === 'burn') {
                battleStatus.appendChild(createEffectMessage(
                    `Burn aktiviert: -${result.burnDamage} HP pro Runde für ${result.burnTurns} Runden.`
                ));
            } else if (result.effectApplied === 'paralysis') {
                battleStatus.appendChild(createEffectMessage(
                    'Paralyse erfolgreich: Der Gegner hat ab jetzt eine 25% Chance, mit seiner Attacke auszusetzen.'
                ));
            } else if (result.effectApplied === 'paralysis-damage') {
                battleStatus.appendChild(createEffectMessage(
                    'Paralyse nicht ausgelöst: Stun Spore verursacht stattdessen Schaden.'
                ));
            } else if (result.effectApplied === 'paralysis-failed') {
                battleStatus.appendChild(createEffectMessage(
                    'Paralyse wirkt: Die Attacke fällt aus.'
                ));
            } else if (result.effectApplied === 'muddy-water') {
                battleStatus.appendChild(createEffectMessage(
                    'Muddy Water erfolgreich: Dodge-Rate auf 25% erhöht für 3 Runden.'
                ));
            }
        }

        function createEffectMessage(text) {
            const effectMessage = document.createElement('span');
            effectMessage.className = 'attack-effectiveness';
            effectMessage.textContent = text;
            return effectMessage;
        }

        function getRandomPokemon(pokemon) {
            return pokemon[Math.floor(Math.random() * pokemon.length)];
        }

        function getTypeClass(type) {
            return type === 'Feuer' ? 'fire' : type === 'Wasser' ? 'water' : 'grass';
        }

        function getPokemonType(pokemonName) {
            return Object.entries(pokemonPool)
                .find(([, pokemon]) => pokemon.includes(pokemonName))[0];
        }

        function rollPokemonOptions() {
            pokemonOptions.innerHTML = '';

            Object.entries(pokemonPool).forEach(([type, pokemon]) => {
                const option = document.createElement('button');
                const typeClass = getTypeClass(type);
                option.className = `pokemon-option ${typeClass}`;
                option.type = 'button';
                const pokemonName = getRandomPokemon(pokemon);
                option.innerHTML = `
                    <span class="pokemon-type">${type}</span>
                    <img class="pokemon-image" src="${pokemonImages[pokemonName]}" alt="${pokemonName}">
                    <span>${pokemonName}</span>
                `;
                option.addEventListener('click', () => {
                    playerPokemon = { name: pokemonName, type, level: 1 };
                    gameOverRecorded = false;
                    highscoreSaveButton.classList.remove('is-visible');
                    highscoreEntry.classList.remove('is-visible');
                    highscoreNameInput.value = '';
                    playerCombatant = {
                        type,
                        level: 1,
                        hp: 100,
                        maxHp: 100
                    };
                    updateSpecialAttackButton(type);
                    opponentCount = 0;
                    healingPotionCount = 1;
                    updateInventoryDisplay();
                    rollPokemonOptions();
                    pokemonSelection.classList.remove('is-visible');
                    showNextOpponent();
                });
                pokemonOptions.appendChild(option);
            });
        }

        function getRandomOpponentLevel(playerLevel) {
            const levelDifference = [-1, 0, 1][Math.floor(Math.random() * 3)];
            return Math.min(playerLevel, Math.max(1, playerLevel + levelDifference));
        }

        function showNextOpponent() {
            const allPokemon = Object.values(pokemonPool).flat();
            const opponentName = getRandomPokemon(allPokemon);
            const opponentType = getPokemonType(opponentName);
            const opponentLevel = opponentCount === 0
                ? 1
                : getRandomOpponentLevel(playerCombatant.level);

            opponentCount++;
            opponentCombatant = {
                type: opponentType,
                level: opponentLevel,
                hp: 100 + ((opponentLevel - 1) * 10),
                maxHp: 100 + ((opponentLevel - 1) * 10)
            };
            playerPokemonName.textContent = playerPokemon.name;
            playerPokemonImage.src = pokemonImages[playerPokemon.name];
            playerPokemonImage.alt = playerPokemon.name;
            playerPokemonLevel.textContent = `LEVEL ${playerCombatant.level}`;
            opponentPokemonName.textContent = opponentName;
            opponentPokemonImage.src = pokemonImages[opponentName];
            opponentPokemonImage.alt = opponentName;
            opponentPokemonLevel.textContent = `LEVEL ${opponentLevel}`;
            playerBattleCard.className = `battle-card player ${getTypeClass(playerPokemon.type)}`;
            opponentBattleCard.className = `battle-card opponent ${getTypeClass(opponentType)}`;
            updateHealthBars();
            isPlayerTurn = true;
            setAttackButtonsDisabled(false);
            updateInventoryDisplay();
            battleStatus.textContent = 'Du bist dran!';
            battleScreen.classList.add('is-visible');
            scheduleAutoBattleTurn();
        }

        function updateHealthBars() {
            const playerHealthPercentage = (playerCombatant.hp / playerCombatant.maxHp) * 100;
            const opponentHealthPercentage = (opponentCombatant.hp / opponentCombatant.maxHp) * 100;
            playerHealthFill.style.width = `${playerHealthPercentage}%`;
            opponentHealthFill.style.width = `${opponentHealthPercentage}%`;
            playerHealthPoints.textContent = `${playerCombatant.hp} / ${playerCombatant.maxHp} HP`;
            opponentHealthPoints.textContent = `${opponentCombatant.hp} / ${opponentCombatant.maxHp} HP`;
            playerCombatStats.textContent = formatCombatStats(playerCombatant);
            opponentCombatStats.textContent = formatCombatStats(opponentCombatant);
        }

        function formatCombatStats(combatant) {
            const dodgeChance = Math.min(25, Math.min(combatant.level, 10) + (combatant.dodgeBonus || 0));
            const criticalChance = (combatant.level / (100 + combatant.level)) * 100;
            return `Dodge: ${dodgeChance.toFixed(2).replace('.', ',')}% | Krit: ${criticalChance.toFixed(2).replace('.', ',')}%`;
        }

        function applyBurnDamage(combatant) {
            if (!combatant.burnTurns) return false;

            combatant.hp = Math.max(0, combatant.hp - combatant.burnDamage);
            combatant.burnTurns--;
            updateHealthBars();
            battleStatus.textContent = `${combatant === playerCombatant ? playerPokemon.name : opponentPokemonName.textContent} erleidet Burn-Schaden (-${combatant.burnDamage} HP)!`;
            return combatant.hp === 0;
        }

        function advanceMuddyWater() {
            if (!playerCombatant.dodgeBonusTurns) return false;

            playerCombatant.dodgeBonusTurns--;
            if (playerCombatant.dodgeBonusTurns === 0) {
                playerCombatant.dodgeBonus = 0;
                return true;
            }
            return false;
        }

        function createNextOpponent(level) {
            const allPokemon = Object.values(pokemonPool).flat();
            const name = getRandomPokemon(allPokemon);
            const opponentLevel = getRandomOpponentLevel(level);
            return {
                name,
                type: getPokemonType(name),
                level: opponentLevel,
                hp: 100 + ((opponentLevel - 1) * 10),
                maxHp: 100 + ((opponentLevel - 1) * 10)
            };
        }

        function applyNextOpponent(nextEnemy) {
            opponentCombatant = nextEnemy;
            playerPokemonLevel.textContent = `LEVEL ${playerCombatant.level}`;
            opponentPokemonName.textContent = nextEnemy.name;
            opponentPokemonImage.src = pokemonImages[nextEnemy.name];
            opponentPokemonImage.alt = nextEnemy.name;
            opponentPokemonLevel.textContent = `LEVEL ${nextEnemy.level}`;
            opponentBattleCard.className = `battle-card opponent ${getTypeClass(nextEnemy.type)}`;
            updateHealthBars();
            isPlayerTurn = true;
            setAttackButtonsDisabled(false);
            updateInventoryDisplay();
            battleStatus.textContent = 'Du bist dran!';
            scheduleAutoBattleTurn();
        }

        function resolveEnemyAttack(attack) {
            const result = resolveAttack(
                opponentCombatant,
                playerCombatant,
                attack.baseDamage ?? 20,
                playerCombatant,
                opponentCombatant,
                createNextOpponent,
                attack.type,
                attack.damageMultiplier ?? 0.9,
                attack.effect
            );
            updateHealthBars();
            showAttackResult(opponentPokemonName.textContent, attack, result);

            if (result.status === 'game-over') {
                setAutoBattleEnabled(false);
                window.setTimeout(() => {
                    battleStatus.textContent = 'Dein Pokémon wurde besiegt!';
                    highscoreSaveButton.classList.add('is-visible');
                }, battleMessageDelay);
                return;
            }

            window.setTimeout(() => {
                isPlayerTurn = true;
                setAttackButtonsDisabled(false);
                battleStatus.textContent = 'Du bist dran!';
                if (advanceMuddyWater()) {
                    battleStatus.textContent = 'Muddy Water ist ausgelaufen. Die Dodge-Rate ist wieder normal.';
                }
                updateHealthBars();
                scheduleAutoBattleTurn();
            }, battleMessageDelay);
        }

        function performEnemyAttack() {
            if (applyBurnDamage(opponentCombatant)) {
                playerPokemon.level++;
                playerCombatant.level = playerPokemon.level;
                playerCombatant.maxHp = 100 + ((playerCombatant.level - 1) * 10);
                playerCombatant.hp = Math.min(playerCombatant.maxHp, playerCombatant.hp + Math.round(playerCombatant.maxHp * 0.50));
                battleStatus.textContent = 'Gegner besiegt! Ein neuer Gegner erscheint...';
                const foundPotion = searchForHealingPotion();
                if (foundPotion) {
                    battleStatus.textContent = 'Gegner besiegt! Du hast einen Heiltrank gefunden.';
                }
                window.setTimeout(() => applyNextOpponent(createNextOpponent(playerCombatant.level)), battleMessageDelay);
                return;
            }
            const attack = Math.random() < 0.25
                ? getTypeAbility(opponentCombatant.type)
                : Math.random() < 0.5
                    ? getTackleAttack()
                    : getSpecialAttack(opponentCombatant.type);
            battleStatus.textContent = 'Gegner ist dran';
            window.setTimeout(() => {
                battleStatus.textContent = `${opponentPokemonName.textContent} macht ${attack.name}`;
                window.setTimeout(() => resolveEnemyAttack(attack), battleMessageDelay);
            }, battleMessageDelay);
        }

        function resolvePlayerAttack(attack) {
            battleStatus.textContent = `${playerPokemon.name} macht ${attack.name}`;
            const result = resolveAttack(
                playerCombatant,
                opponentCombatant,
                attack.baseDamage ?? 20,
                playerCombatant,
                opponentCombatant,
                createNextOpponent,
                attack.type,
                attack.damageMultiplier ?? 1,
                attack.effect
            );
            updateHealthBars();
            showAttackResult(playerPokemon.name, attack, result);

            if (result.status === 'enemy-defeated') {
                playerPokemon.level = result.playerLevel;
                playerCombatant.level = result.playerLevel;
                playerCombatant.maxHp = result.playerMaxHp;
                playerCombatant.hp = result.playerHp;
                playerPokemonLevel.textContent = `LEVEL ${playerCombatant.level}`;
                battleStatus.textContent = 'Gegner besiegt! Ein neuer Gegner erscheint...';
                if (searchForHealingPotion()) {
                    battleStatus.textContent = 'Gegner besiegt! Du hast einen Heiltrank gefunden.';
                }
                window.setTimeout(() => applyNextOpponent(result.nextEnemy), battleMessageDelay);
                return;
            }

            window.setTimeout(performEnemyAttack, battleMessageDelay);
        }

        function performTypeAbility() {
            if (!isPlayerTurn || !playerCombatant || !opponentCombatant) return;

            isPlayerTurn = false;
            setAttackButtonsDisabled(true);
            if (applyBurnDamage(playerCombatant)) {
                setAutoBattleEnabled(false);
                highscoreSaveButton.classList.add('is-visible');
                return;
            }
            const ability = getTypeAbility(playerPokemon.type);
            battleStatus.textContent = `${playerPokemon.name} setzt ${ability.name} ein!`;
            window.setTimeout(() => resolvePlayerAttack(ability), battleMessageDelay);
        }

        function performPlayerAttack(attack) {
            if (!isPlayerTurn || !playerCombatant || !opponentCombatant) return;

            isPlayerTurn = false;
            setAttackButtonsDisabled(true);
            if (applyBurnDamage(playerCombatant)) {
                setAutoBattleEnabled(false);
                highscoreSaveButton.classList.add('is-visible');
                return;
            }
            battleStatus.textContent = `${playerPokemon.name} macht ${attack.name}`;
            window.setTimeout(() => resolvePlayerAttack(attack), battleMessageDelay);
        }

        async function showPokemonSelection() {
            try {
                await pokemonDataPromise;
            } catch (error) {
                battleStatus.textContent = 'Die Pokémon-Daten konnten nicht geladen werden.';
                console.error(error);
                return;
            }
            battleScreen.classList.remove('is-visible');
            rollPokemonOptions();
            pokemonSelection.classList.add('is-visible');
        }

        const pokemonDataPromise = loadPokemonData().catch((error) => {
            console.error(error);
            throw error;
        });

        document.querySelector('.btn-start').addEventListener('click', showPokemonSelection);
        renderHighscores();
        applyWebsiteVolume(Number(localStorage.getItem(volumeStorageKey)) || 10);
        playThemeMusic();
        document.addEventListener('pointerdown', playThemeMusic, { once: true });
        document.addEventListener('keydown', playThemeMusic, { once: true });

        document.querySelector('.btn-settings').addEventListener('click', openSettings);
        patchNotesButton.addEventListener('click', () => {
            patchNotesScreen.classList.add('is-visible');
            patchNotesScreen.setAttribute('aria-hidden', 'false');
        });
        patchNotesCloseButton.addEventListener('click', () => {
            patchNotesScreen.classList.remove('is-visible');
            patchNotesScreen.setAttribute('aria-hidden', 'true');
        });
        rollVolumeButton.addEventListener('click', rollVolumeDice);
        document.querySelector('.settings-close').addEventListener('click', () => {
            settingsScreen.classList.remove('is-visible');
        });

        document.querySelector('.selection-close').addEventListener('click', () => {
            rollPokemonOptions();
            pokemonSelection.classList.remove('is-visible');
        });

        tackleButton.addEventListener('click', () => {
            performPlayerAttack(getTackleAttack());
        });
        specialAttackButton.addEventListener('click', () => {
            performPlayerAttack(getSpecialAttack(playerPokemon.type));
        });
        stunButton.addEventListener('click', performTypeAbility);
        inventoryButton.addEventListener('click', () => {
            updateInventoryDisplay();
            inventoryScreen.classList.add('is-visible');
            inventoryScreen.setAttribute('aria-hidden', 'false');
        });
        inventoryUseButton.addEventListener('click', useHealingPotion);
        inventoryCloseButton.addEventListener('click', () => {
            inventoryScreen.classList.remove('is-visible');
            inventoryScreen.setAttribute('aria-hidden', 'true');
        });
        highscoreSaveButton.addEventListener('click', () => {
            highscoreEntry.classList.add('is-visible');
            highscoreNameInput.focus();
        });
        highscoreConfirmButton.addEventListener('click', saveHighscore);
        autoBattleButton.addEventListener('click', () => {
            setAutoBattleEnabled(!autoBattleEnabled);
        });

        document.querySelector('.battle-close').addEventListener('click', () => {
            setAutoBattleEnabled(false);
            battleScreen.classList.remove('is-visible');
        });
