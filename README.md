# COSH

Chroniques Oubliées _**Sheet Helper**_

Script MOD compagnon pour les fiches de personnage Roll20 COC & COG

Au premier lancement d'une partie après installation du script, ce dernier crée une aide de jeu (handout) résumant les commandes disponibles. Celles-ci sont également détaillées ci-dessous.


### Current version : 1.10

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