# Cadavre Exquis

## Installation

1. Placez le dossier `Cadexq` sur votre serveur web
2. Assurez-vous que PHP est installé et configuré
3. Renommer `config.default.ini` en `config.ini` et modifier l'URL du serveur
4. Ouvrez `client/index.html` dans un navigateur mobile

## Utilisation

1. **Créer une partie** : Un joueur crée une partie et obtient un code à 3 chiffres
2. **Rejoindre une partie** : Les autres joueurs utilisent le code pour rejoindre
3. **Jouer** : À tour de rôle, chaque joueur écrit une phrase en voyant le dernier mot écrit
4. **Terminer** : Cliquer sur le bouton Terminer pour afficher le texte final

## Structure

- `server/game.php` : Serveur PHP pour gérer les parties
- `index.html` : Interface web mobile
- `data/` : Stockage des données des parties (fichiers JSON)

## Fonctionnalités

- Création de parties avec code unique
- Rejoindre des parties existantes
- Tour par tour avec affichage du dernier mot
- Affichage du texte final
- Interface responsive pour mobile

## Exemple de partie

1. Joueur 1 : "Le chat"
2. Joueur 2 : "mange une souris"
3. Joueur 3 : "qui avait volé du fromage"
4. Joueur 1 : "dans la cuisine"
5. Joueur 2 : Terminer la partie

**Texte final** : "Le chat mange une souris qui avait volé du fromage dans la cuisine"
