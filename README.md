# COSH 

### _Chroniques Oubliées Sheet Helper_

Script MOD compagnon pour les fiches de personnage Roll20 COC & COG

Au premier lancement d'une partie après installation du script, ce dernier crée une aide de jeu (handout) résumant les commandes disponibles. Celles-ci sont également détaillées ci-dessous.


### Current version : 1.40

## 2024-02-11 - Version 1.40
- Nouveau menu des capacités d'une voie
  Pour chaque rang
  - Un bouton avec texte de la voie
  - Un bouton pour lancer le jet de capacité associé
- Toolkit du MJ avec une nouvelle famille de commandes 'gm:xxx'
  - Renommage de la commande <kbd>create</kbd> en <kbd>gm:create</kbd>
  - Modification de la commande <kbd>gm:create</kbd> pour associer le token sélectionné à la fiche créée
  - Renommage de la commande <kbd>gmsheet</kbd> en <kbd>gm:sheet</kbd>
  - Nouvelle commande <kbd>gm:bars</kbd> pour lier les barres de token aux attributs d'une fiche
  - Nouvelle commande <kbd>gm:layer</kbd> pour basculer le ou les token(s) sélectionné(s) entre les couches 'jetons' et 'GM'

## 2023-10-22 - Version 1.30

- Ajout de la création automatique de plusieurs macros
  - <kbd>cosh-voies</kbd>       macro d'affichage des voies
  - <kbd>cosh-capas</kbd>       macro d'affichage des jets de capacités
  - <kbd>cosh-attaques</kbd>    macro d'affichage des attaques
  - <kbd>cosh-caracs</kbd>      macro d'affichage des jets de caractéristiques
  - <kbd>cosh-create</kbd>      macro d'appel de la création du fiche
- Ajout support des jets de caractéristiques pour les fiches de PNJ (*nécessite la version __3.16.1__ de la fiche de personnage COC*)

## 2023-09-10 - Version 1.20

- Ajout de la commande <kbd>create</kbd> pour créer des fiches
  - <kbd>create pj _nom du PJ_</kbd> pour créer un personnage
  - <kbd>create pnj _nom du PNJ_</kbd> pour créer un PNJ
  - <kbd>create vehicule _nom du véhicule_</kbd> pour créer un véhicule (COC)
  - <kbd>create vaisseau _nom du vaisseau_</kbd> pour créer un vaisseau (COG)
  - <kbd>create mecha _nom du mecha_</kbd> pour créer un mécha (COG)
- Ajout d'une macro **cosh-create** simplifiant l'utilisation de la commande <kbd>create</kbd>
  - Ajout d'un bouton sur le menu de configuration permettant de créer la macro
  - Nouvelle commande <kbd>config --macro</kbd> de création de la macro
- Réintégration de la commande <kbd>actions --caracs</kbd> permettant l'affichage d'un menu de chat pour les jets de caractéristiques

## 2023-08-31 - Version 1.10

- Ajout de la commande <kbd>gmsheet</kbd>

## 2023-08-14 - Version 1.00

- Version initiale du script

## Liste des commandes

    !cosh actions --voies

Affiche un menu de chat avec les voies possédées

---

    !cosh actions --voies #

Affiche un menu de chat avec les capacités possédées dans la voie #

---

    !cosh actions --competences

Affiche un menu de chat avec la liste des jets de capacités

---

    !cosh actions --attaques

Affiche un menu de chat avec la liste des attaques

---

    !cosh actions --caracs

Affiche un menu de chat avec la liste des tests de caractéristiques

---

    !cosh config

Affiche un menu de chat pour configurer le script MOD

---

    !cosh debug

Envoie des données de debogage à la console API

---

    !cosh gm:bars [--mook]

Lie les barres du token sélectionné avec les attributs de la fiche liée
- Le token doit être lié à une fiche ("représente")
- Si l'option --mook est indiquée, la barre correspondant aux PV est chargée avec les valeurs courantes et max mais pas avec l'attribut

---

    !cosh gm:create {type} {nom}

Crée une fiche de personnage du type indiqué, avec le nom indiqué, visible et controlable par tous les joueurs
- Types communs : <kbd>pj</kbd>, <kbd>pnj</kbd>
- Type COC : <kbd>vehicule</kbd>
- Types COG : <kbd>vaisseau</kbd>, <kbd>mecha</kbd>

---

    !cosh gm:sheet

Murmure au MJ un "stat-block" de la fiche de personnage

---

    !cosh help

Affiche un menu de chat avec de l'aide sur les commandes

---

    !cosh stats

Génère un ensemble de valeurs de caractéristiques

---

    !cosh token +set:xxxx -set:xxxx

- active les tokenmarker(s) spécifiés dans +set:
- désactive les tokenmarker(s) spécifiés dans -set:
- xxxx peut être un ou plusieurs tokenmarker(s), séparés par des virgules
- chaque tokenmarker peut être suffixé par =n (où 1 < n <9) pour ajouter un badge numérique au tokenmarker

---

    !cosh token --set:+xxx,+yyyy,-zzzz

- active les tokenmarker(s) préfixés par +
- désactive les tokenmarker(s) préfixés par -
- syntaxe identique à ci-dessus pour les badges