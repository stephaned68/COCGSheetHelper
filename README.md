# COSH 

### _Chroniques Oubliées Sheet Helper_

Script MOD compagnon pour les fiches de personnage Roll20 COC & COG

Au premier lancement d'une partie après installation du script, ce dernier crée une aide de jeu (handout) résumant les commandes disponibles. Celles-ci sont également détaillées ci-dessous.


### Current version : 1.20

## 2023-09-10 - Version 1.20

- Ajout de la commande <kbd>create</kbd> pour créer des fiches
  - <kbd>create pj _nom du PJ_</kbd> pour créer un personnage
  - <kbd>create pnj _nom du PNJ_</kbd> pour créer un PNJ
  - <kbd>create vaisseau _nom du vaisseau_</kbd> pour créer un vaisseau
  - <kbd>create mecha _nom du mecha_</kbd> pour créer un mécha
- Ajout d'une macro **cosh-create** simplifiant l'utilisation de la commande <kbd>create</kbd>
  - Ajout d'un bouton sur le menu de configuration permettant de créer la macro
  - Nouvelle commande <kbd>config --macro</kbd> de création de la macro
- Réintégration de la commande <kbd>actions --caracs</kbd>

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

    !cosh gmsheet

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