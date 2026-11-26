# AGENTS.md : lire avant toute intervention

Ce fichier donne à un agent (ou un développeur) qui arrive sans historique tout le contexte nécessaire pour travailler sur ce dépôt. Lisez-le en entier, puis les documents qu'il cite.

## 1. Le projet en trois phrases

**Éléa** est le prototype d'un assistant IA pour les dirigeants de PME françaises de 10 à 49 salariés. C'est un conseiller qui se souvient de tout (« une mémoire d'éléphant ») et qui aide à poser une question, à donner une information, à résoudre un problème ou à retrouver ce qui a déjà été dit. Ce dépôt est un **prototype interactif web, mobile first**, sans backend ni IA réelle : il sert à valider le parcours et l'interface avec de vrais dirigeants.

Projet porté par Fasfox (cabinet de conseil IA). Nom de code historique : « Assistant PME ». Nom du produit : **Éléa**.

## 2. Ce qu'il faut lire, dans l'ordre

| Document | Contenu |
| --- | --- |
| `docs/VISION.md` | Le produit, la cible, et les exigences de Lélio (cofondateur) issues de la séance du 23 novembre 2026 |
| `docs/ARCHITECTURE.md` | L'architecture technique du prototype : rendu de blocs, moteur de scénario, mémoire, navigation |
| `docs/BLOCKS.md` | Le catalogue des blocs d'interface et leur schéma de données |
| `apps/design-system/DESIGN.md` | Le design system : principes, couleurs, typographie, mouvement, composants |
| `apps/web/src/scenarios/` | Les scénarios joués par le prototype (JSON) |
| `tickets/README.md` | Les règles de travail (tickets, branches, commits) : **obligatoires** |
| `tickets/BACKLOG.md` | L'index des tickets |
| `docs/figma-parcours/` | Les maquettes Figma de départ (référence, pas une cible pixel près) |
| `docs/trancript-seance-23nov-lelio.txt` | Le transcript de la séance avec Lélio (source des exigences) |

## 3. Les cinq règles qui ne se discutent pas

1. **Aucun écran n'est codé pour un cas d'usage.** Tout ce que l'utilisateur voit pendant un besoin est un assemblage de **blocs génériques** décrits par des données (`docs/BLOCKS.md`). Pour un nouveau cas, on écrit un scénario JSON, pas un nouvel écran. Si un bloc manque, on l'ajoute au catalogue de façon générique.
2. **Pas de liste de conversations.** Il n'y a ni historique de chats ni fil infini façon ChatGPT. Ce qui compte est rangé dans la mémoire de l'entreprise : des **sujets** qui contiennent des **findings** (réponse, information, décision, plan, document).
3. **Design system d'abord.** Toute interface utilise les tokens et composants de `apps/design-system`. Pas de style ponctuel dans le code d'une fonctionnalité. Un composant manquant est d'abord ajouté et documenté dans le design system.
4. **Un ticket avant tout code.** Voir `tickets/README.md`. Branche `feature/{id}-{description}`, commits conventionnels avec `(#id)`.
5. **L'interface doit être vivante.** Les animations ont une fonction (montrer que l'assistant écoute, note, range, réfléchit). Elles restent actives même si le système demande de réduire les animations ; un interrupteur du panneau démo permet de les couper.

## 4. Stack

- Monorepo npm workspaces : `apps/design-system` (tokens, composants, vitrine) et `apps/web` (le prototype).
- Vite, React 18, TypeScript strict.
- Styles : CSS Modules + variables CSS (`tokens.css`). **Pas de Tailwind, pas de bibliothèque de composants** (shadcn, MUI…) : on veut une identité propre.
- Animations : `motion` (ex-Framer Motion) pour les ressorts, les transitions partagées et les entrées en cascade ; CSS pour le reste.
- État : `zustand` pour la mémoire de l'entreprise et le moteur de scénario.
- Icônes : `lucide-react`, trait 1,75.
- Polices : Fraunces (titres, voix d'Éléa) et Instrument Sans (interface), via `@fontsource`.

## 5. Commandes

```bash
npm install            # à la racine
npm run dev            # lance le prototype (apps/web)
npm run ds             # lance la vitrine du design system
npm run build          # build des deux apps
npm run lint           # ESLint + vérification des types
```

## 6. Langue

- Interface : **français** uniquement.
- Code (noms de variables, composants, types) : anglais.
- Documentation, tickets, commits : français pour les textes, anglais pour les types de commits (`feat`, `fix`…).
- Pas de tiret cadratin dans les textes de l'interface ni dans la documentation.

## 7. Le persona de démonstration

**Thomas Morel**, fondateur et gérant de **Morel Ingénierie**, bureau d'études fluides et thermique à Nantes (chauffage, ventilation, climatisation, plomberie, études thermiques RE2020). 18 salariés, dont 14 en production. Environ 115 000 € de charges par mois, 1 960 h facturables, taux de revient 58 € de l'heure, taux vendu sur les marchés publics 72 € de l'heure. Clients : promoteurs, architectes, collectivités. Compte : thomas@morel-ingenierie.fr. Sources : Gmail et Google Drive (dossier « Affaires 2026 »).

Toutes les données du prototype sont fictives.

## 8. Ce qu'on ne fait pas (pour l'instant)

- Pas de backend, pas d'appel à un modèle, pas d'authentification réelle.
- Pas de vraie connexion Gmail, Outlook ou Drive : tout est simulé.
- La voix est simulée (transcription jouée par le scénario). La reconnaissance vocale du navigateur est une option à étudier (ticket dédié).
- Pas de déploiement : le prototype tourne en local. Un lien partageable viendra plus tard.
