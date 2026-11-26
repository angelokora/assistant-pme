# Éléa : vision produit et exigences

## 1. Le produit

Éléa est un conseiller et un compagnon pour le dirigeant d'une PME. Il se souvient de tout ce qui lui a été dit, montré ou connecté, et intervient sur n'importe quel sujet de gestion (finances, clients, équipe, organisation, juridique simple). Comme un expert qui serait toujours à côté du dirigeant, avec une très bonne mémoire.

Le nom vient de l'éléphant : la sagesse et la mémoire.

## 2. La cible

- Dirigeants de PME françaises de **10 à 49 salariés**. En dessous, l'entreprise n'investit pas ; au-dessus, elle a déjà des fonctions de gestion internes.
- Le secteur phare retenu pour le prototype est un **bureau d'études** (voir ciblage et `AGENTS.md`). D'autres secteurs restent envisageables plus tard.
- **Le prototype joue un seul persona de bout en bout : Morel Ingénierie** (voir `AGENTS.md`). Il doit montrer que les mêmes composants servent à tous les besoins.

## 3. Les quatre raisons de venir dans l'app

Une seule porte d'entrée, mais quatre intentions, qui aboutissent à des résultats différents :

| Intention | Exemple | Résultat |
| --- | --- | --- |
| **Résoudre un problème** | « Je n'arrive pas à me payer » | Analyse, choix d'une priorité, plan d'action à étapes |
| **Poser une question** | « CDD ou CDI pour ma vendeuse du week-end ? » | Réponse claire, rangée dans un sujet, retrouvable |
| **Donner une information** | « La mairie de Rezé a enfin payé la situation n° 3 » | Information notée, mémoire et plans mis à jour |
| **Retrouver une information** | « Qu'est-ce qu'on avait dit sur notre taux horaire pour les marchés publics ? » | Le finding retrouvé, avec son contexte |

À cela s'ajoute **le premier contact** (onboarding) : faire connaissance, connecter des sources, identifier les priorités.

## 4. Les exigences de Lélio (séance du 23 novembre 2026)

Source : `docs/trancript-seance-23nov-lelio.txt`.

1. **Tout est dynamique.** « Il n'est pas question d'aller se dire : on va mettre un écran calculer votre chiffre minimum par jour. Tout doit être généré dynamiquement par le modèle. » Le modèle sait produire des données structurées (un titre, un délai, un formulaire avec ses libellés). L'interface doit donc être un **moteur de rendu de blocs**, pas une suite d'écrans.
2. **Courir beaucoup de chemins, pas un seul.** Ce qui compte est la capacité à couvrir de nombreux cas sur les secteurs ciblés, pas un parcours parfait.
3. **Une longue conversation invisible.** On n'a jamais de liste de conversations. Mais il faut pouvoir **retrouver** les réponses données et les problèmes résolus, de façon structurée : des **sujets** (compta, RH…) auxquels on rattache des **findings** (décision, réponse, micro-app, formulaire, actions).
4. **Pouvoir consulter et corriger la mémoire.** Le modèle peut se tromper, le dirigeant peut avoir dit quelque chose d'inexact : il doit pouvoir rectifier ce qui a été retenu.
5. **Réduire la friction de l'onboarding.** Une interview de 25 minutes tue l'adoption. Plutôt que demander les charges, proposer de **déposer les factures** ou de **les retrouver dans les mails** (extraction automatique). Une ou deux questions d'approfondissement maximum, puis l'analyse.
6. **L'accès aux mails fait peur.** Il faut un écran très rassurant : ce qui est lu, pourquoi, sécurité, et la possibilité de refuser.
7. **Le compte peut venir tôt.** Se connecter à un service exige un compte ; ce n'est pas grave d'ajouter de la friction pour un dirigeant, ce n'est pas une app grand public.
8. **Mobile first, mais l'ordinateur compte.** Pour les cas plus sérieux, le dirigeant sera sur son ordinateur, où l'information structurée se lit mieux. Le prototype doit s'adapter au mobile, à la tablette et au poste de travail.
9. **Des cycles de retour courts.** Mettre le prototype dans les mains d'un dirigeant au plus vite (design partner, séances d'observation).

## 5. Le parcours d'onboarding retenu

Adapté des maquettes Figma (`docs/figma-parcours/`) et des remarques ci-dessus :

1. Accueil : Éléa se présente en quelques phrases, sans question ouverte.
2. Création du compte (Google, Apple ou e-mail, simulé) : le compte vient en premier.
3. Écran de départ, trois options : connecter ses sources (Gmail et Drive en un geste avec un compte Google), importer des documents, ou commencer à discuter.
4. Chemin sources ou documents : extraction simulée qui remplit les finances sans poser de question. Chemin discussion : question d'ouverture (« Qu'est-ce qui vous occupe en ce moment ? »), puis Éléa propose une seule fois de lire les sources pour avoir du contexte ; un refus n'est jamais rediscuté.
5. Faisons connaissance : 4 dimensions avec jauges (Mon activité, Mes finances, Mon profil, Mes priorités), une ou deux questions d'approfondissement, chaque réponse « notée » dans une dimension.
6. Analyse animée en étapes.
7. Choix d'une priorité, avec une recommandée.
8. Choix d'un plan parmi 2 ou 3, avec un recommandé, et détail des étapes.
9. Plan personnalisé : dates modifiables, démarrage (plus d'étape compte à la fin).
10. Arrivée sur l'accueil quotidien.

## 6. Ce que le prototype doit prouver

- Les mêmes blocs servent à l'onboarding, à une question, à une information et à une recherche.
- On retrouve facilement une réponse donnée la semaine dernière, sans liste de conversations.
- Passer de la voix au texte est instantané et naturel.
- L'interface donne l'impression d'un assistant présent et attentif.
- L'expérience est aussi bonne sur ordinateur que sur téléphone.
