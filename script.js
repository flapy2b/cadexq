document.addEventListener('DOMContentLoaded', function() {
    const createBtn = document.getElementById('create-btn');
    const joinBtn = document.getElementById('join-btn');
    const startGameBtn = document.getElementById('start-game-btn');
    const submitLineBtn = document.getElementById('submit-line-btn');
    const endGameBtn = document.getElementById('end-game-btn');
    const quitGameBtn = document.getElementById('quit-game-btn');
    const restartGameBtn = document.getElementById('restart-game-btn');
    const lineInput = document.getElementById('line-input');
    const gameProgress = document.getElementById('game-progress');
    
    let gameCode = '';
    let playerName = '';
    let gameInterval = null;
    let isGameStarted = false;
    let playersList = [];
    
    // Créer une nouvelle partie
    createBtn.addEventListener('click', async function() {
        const name = document.getElementById('create-name').value.trim();
        
        if (!name) {
            showError('create-error', 'Veuillez entrer votre nom');
            return;
        }
        
        try {
            const response = await fetch('https://flapy.xyz/cadexq/server/game.php', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                },
                body: `action=create_game&player_name=${encodeURIComponent(name)}`
            });
            
            const data = await response.json();
            
            if (data.error) {
                showError('create-error', data.error);
                return;
            }
            
            gameCode = data.game_code;
            playerName = name;
            
            // Passer à la section d'attente
            document.getElementById('create-section').classList.add('hidden');
            document.getElementById('waiting-section').classList.remove('hidden');
            
            document.getElementById('game-code').textContent = gameCode;
            document.getElementById('current-player-name').textContent = name;
            
            // Démarrer la surveillance des joueurs
            startWaitingMonitoring();
            
        } catch (error) {
            showError('create-error', 'Erreur lors de la création de la partie');
        }
    });
    
    // Commencer la partie
    startGameBtn.addEventListener('click', function() {
        isGameStarted = true;
        startGameBtn.disabled = true;
        startGameMonitoring();
    });
    
    // Rejoindre une partie
    joinBtn.addEventListener('click', async function() {
        const code = document.getElementById('join-code').value.trim();
        const name = document.getElementById('join-name').value.trim();
        
        if (!code || !name) {
            showError('join-error', 'Veuillez entrer le code et votre nom');
            return;
        }
        
        try {
            const response = await fetch('https://flapy.xyz/cadexq/server/game.php', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                },
                body: `action=join_game&game_code=${encodeURIComponent(code)}&player_name=${encodeURIComponent(name)}`
            });
            
            const data = await response.json();
            
            if (data.error) {
                showError('join-error', data.error);
                return;
            }
            
            gameCode = code;
            playerName = name;
            
            // Démarrer la surveillance de la partie
            startGameMonitoring();
            
        } catch (error) {
            showError('join-error', 'Erreur lors du rejoindre la partie');
        }
    });
    
    // Soumettre une ligne
    submitLineBtn.addEventListener('click', async function() {
        const line = lineInput.value.trim();
        
        if (!line) {
            showError('submit-error', 'Veuillez entrer une phrase');
            return;
        }
        
        try {
            const response = await fetch('https://flapy.xyz/cadexq/server/game.php', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                },
                body: `action=add_line&game_code=${encodeURIComponent(gameCode)}&player_name=${encodeURIComponent(playerName)}&line=${encodeURIComponent(line)}`
            });
            
            const data = await response.json();
            
            if (data.error) {
                showError('submit-error', data.error);
                return;
            }
            
            lineInput.value = '';
            
        } catch (error) {
            showError('submit-error', 'Erreur lors de l\'envoi de votre phrase');
        }
    });
    
    // Surveillance des joueurs en attente
    function startWaitingMonitoring() {
        updateWaitingState();
        gameInterval = setInterval(updateWaitingState, 2000);
    }
    
    async function updateWaitingState() {
        try {
            const response = await fetch('https://flapy.xyz/cadexq/server/game.php', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                },
                body: `action=get_game_state&game_code=${encodeURIComponent(gameCode)}&player_name=${encodeURIComponent(playerName)}`
            });
            
            const data = await response.json();
            
            if (data.error) {
                clearInterval(gameInterval);
                return;
            }
            
            // Mettre à jour la liste des joueurs
            const playersList = document.getElementById('waiting-players-list');
            playersList.innerHTML = data.players.map(player => 
                `<li>${player}</li>`
            ).join('');
            
            document.getElementById('waiting-player-count').textContent = data.players.length;
            
            // Activer le bouton si au moins 2 joueurs
            if (data.players.length >= 2) {
                startGameBtn.disabled = false;
            } else {
                startGameBtn.disabled = true;
            }
            
        } catch (error) {
            console.error('Erreur lors de la mise à jour des joueurs:', error);
        }
    }
    
    // Surveillance de la partie
    function startGameMonitoring() {
        // Masquer les sections de création/rejoindre
        document.getElementById('create-section').classList.add('hidden');
        document.getElementById('join-section').classList.add('hidden');
        document.getElementById('waiting-section').classList.add('hidden');
        
        // Afficher la section de jeu
        document.getElementById('game-section').classList.remove('hidden');
        
        // Récupérer l'état initial
        updateGameState();
        
        // Mettre à jour régulièrement
        gameInterval = setInterval(updateGameState, 2000);
    }
    
    // Mettre à jour l'état de la partie
    async function updateGameState() {
        try {
            const response = await fetch('https://flapy.xyz/cadexq/server/game.php', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                },
                body: `action=get_game_state&game_code=${encodeURIComponent(gameCode)}&player_name=${encodeURIComponent(playerName)}`
            });
            
            const data = await response.json();
            
            if (data.error) {
                clearInterval(gameInterval);
                return;
            }
            
            // Mettre à jour la liste des joueurs
            const playersListElement = document.getElementById('players-list');
            playersListElement.innerHTML = data.players.map(player => {
                const className = player === data.current_player ? 'current-player' : '';
                return `<li class="${className}">${player}${player === data.current_player ? ' (tour actuel)' : ''}</li>`;
            }).join('');
            
            document.getElementById('player-count').textContent = data.players.length;
            
            // Mettre à jour le statut
            const statusElement = document.getElementById('game-status');
            if (data.status === 'waiting') {
                statusElement.textContent = getStatusText(data.status);
                statusElement.className = 'status ' + data.status;
            } else {
                statusElement.textContent = '';
                statusElement.className = 'hidden';
            }
            
            // Mettre à jour le dernier mot
            if (data.last_word) {
                document.getElementById('last-word').textContent = data.last_word;
                document.getElementById('last-word-display').classList.remove('hidden');
            } else {
                document.getElementById('last-word-display').classList.add('hidden');
            }
            
            // Mettre à jour le texte final si la partie est terminée
            if (data.status === 'ended') {
                const finalText = data.lines.map(line => line.text).join(' ');
                document.getElementById('final-text').textContent = finalText;
                document.getElementById('final-text-section').classList.remove('hidden');
                document.getElementById('submit-line-btn').disabled = true;
                document.getElementById('game-progress').classList.add('hidden');
                document.getElementById('game-actions').classList.add('hidden');
                document.getElementById('end-game-btn').classList.add('hidden');
                document.getElementById('end-actions').classList.remove('hidden');
                clearInterval(gameInterval);
                
                // Stocker la liste des joueurs pour la reprise
                playersList = data.players;
            }
            
            // Afficher/masquer le formulaire en fonction du tour
            if (data.is_my_turn && data.status !== 'ended') {
                document.getElementById('game-info').classList.remove('hidden');
                submitLineBtn.disabled = false;
            } else {
                document.getElementById('game-info').classList.add('hidden');
                submitLineBtn.disabled = true;
            }
            
            // Afficher les boutons d'action pendant la partie
            if (data.status !== 'waiting') {
                document.getElementById('game-actions').classList.remove('hidden');
            }
            
        } catch (error) {
            console.error('Erreur lors de la mise à jour de l\'état:', error);
        }
    }
    
    function getStatusText(status) {
        switch(status) {
            case 'waiting': return 'En attente de joueurs...';
            case 'playing': return 'Partie en cours';
            case 'ended': return 'Partie terminée';
            default: return 'Statut inconnu';
        }
    }
    
    function showError(elementId, message) {
        const element = document.getElementById(elementId);
        element.textContent = message;
        element.classList.remove('hidden');
        
        setTimeout(() => {
            element.classList.add('hidden');
        }, 5000);
    }
    
    // Terminer la partie
    endGameBtn.addEventListener('click', async function() {
        try {
            // D'abord récupérer l'état actuel pour obtenir les lignes
            const stateResponse = await fetch('https://flapy.xyz/cadexq/server/game.php', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                },
                body: `action=get_game_state&game_code=${encodeURIComponent(gameCode)}&player_name=${encodeURIComponent(playerName)}`
            });
            
            const stateData = await stateResponse.json();
            
            if (stateData.error) {
                showError('submit-error', stateData.error);
                return;
            }
            
            // Ensuite terminer la partie
            const response = await fetch('https://flapy.xyz/cadexq/server/game.php', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                },
                body: `action=end_game&game_code=${encodeURIComponent(gameCode)}&player_name=${encodeURIComponent(playerName)}`
            });
            
            const data = await response.json();
            
            if (data.error) {
                showError('submit-error', data.error);
                return;
            }
            
            // Afficher le texte final avec les données de l'état actuel
            const finalText = stateData.lines.map(line => line.text).join(' ');
            document.getElementById('final-text').textContent = finalText;
            document.getElementById('final-text-section').classList.remove('hidden');
            
            // Masquer les éléments de jeu
            document.getElementById('game-info').classList.add('hidden');
            document.getElementById('submit-line-btn').disabled = true;
            document.getElementById('game-progress').classList.add('hidden');
            document.getElementById('game-actions').classList.add('hidden');
            document.getElementById('end-game-btn').classList.add('hidden');
            document.getElementById('end-actions').classList.remove('hidden');
            
        } catch (error) {
            console.error('Erreur lors de la fin de la partie:', error);
        }
    });
    
    // Quitter la partie
    
    quitGameBtn.addEventListener('click', async function() {
        try {
            // Supprimer la partie
            await fetch('https://flapy.xyz/cadexq/server/game.php', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                },
                body: `action=delete_game&game_code=${encodeURIComponent(gameCode)}&player_name=${encodeURIComponent(playerName)}`
            });
            
            clearInterval(gameInterval);
            location.reload();
        } catch (error) {
            console.error('Erreur lors de la suppression:', error);
        }
    });
    
    // Recommencer avec les mêmes joueurs
    restartGameBtn.addEventListener('click', async function() {
        try {
            // Créer une nouvelle partie avec le même code
            const response = await fetch('https://flapy.xyz/cadexq/server/game.php', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                },
                body: `action=create_game&player_name=${encodeURIComponent(playerName)}`
            });
            
            const data = await response.json();
            
            if (data.error) {
                showError('submit-error', data.error);
                return;
            }
            
            // Rejoindre les autres joueurs
            for (const otherPlayer of playersList) {
                if (otherPlayer !== playerName) {
                    await fetch('https://flapy.xyz/cadexq/server/game.php', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/x-www-form-urlencoded',
                        },
                        body: `action=join_game&game_code=${encodeURIComponent(data.game_code)}&player_name=${encodeURIComponent(otherPlayer)}`
                    });
                }
            }
            
            // Mettre à jour le code et démarrer la partie
            gameCode = data.game_code;
            isGameStarted = false;
            
            // Passer à la section d'attente
            document.getElementById('game-section').classList.add('hidden');
            document.getElementById('waiting-section').classList.remove('hidden');
            
            document.getElementById('game-code').textContent = gameCode;
            
            // Démarrer la surveillance
            clearInterval(gameInterval);
            startWaitingMonitoring();
            
        } catch (error) {
            console.error('Erreur lors du redémarrage:', error);
        }
    });
});