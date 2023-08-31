# COSH

Chroniques Oubliées Sheet Helper

A companion MOD script for COC & COG Roll20 character sheets

### Current version : 1.1.0

## 2023-08-31 - Version 1.1.0

Added the gmsheet command

## 2023-08-14 - Version 1.0.0

Initial release of the script

## Liste des commandes

    !cosh actions --voies

Affiche un menu de chat avec les voies possédées

---

    !cosh actions --voies #

Affiche un menu de chat avec les capacitiés possédées dans la voie #

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