export const PERSONA_HELP_MARKDOWN = `# Persona STTNS — Definition of Ready

Un persona **READY** signifie :

1. **Identité claire** — nom + segment (référentiel projet) + résumé métier
2. **Frictions explicites** — chaque pain point est une douleur observable, pas une solution
3. **Jobs ancrés** — chaque JTBD résout au moins une friction listée
4. **Couverture 100 %** — aucune friction ignorée, aucun job « fantôme » sans lien

## Matrice PP ↔ JTBD

Couverture complète — toutes les frictions sont adressées par au moins un job.

Statut **READY** disponible uniquement sans friction ignorée (alertes rouges).

## Anti-solutionnisme

> *« Je veux un dashboard blockchain »* n'est **pas** un JTBD — c'est une feature déguisée.

Formulez plutôt : *« Je veux prouver ma solvabilité sans perdre une journée chez le comptable »* et reliez-le à la friction *« Absence de liasse certifiée »*.

## Dictionnaire des segments (MarketChain)

| Code | Segment | Exemple persona |
|------|---------|-----------------|
| **T1** | Micro-Entreprise Informelle | Adja Cissé |
| **T2** | PME en Structuration | Ami Diallo (banque) |
| **T3** | PME Formelle Structurée | — |
| **T4** | ETI & Grandes PME | — |
| **INVEST** | Investisseur & Capital-Risque | Laura |
| **AUDIT** | Expert-Comptable & Auditeur | Yao |
| **REGUL** | Régulateur & Administration | DGI, BRVM… |
`;

export const PERSONA_HELP_MERMAID = `flowchart LR
  P[Persona READY]
  E[Epic métier]
  S[User Story validée]
  F[Feature BUILD]
  A[Cockpit]

  P -->|"Frictions couvertes"| E
  E --> S
  S --> F
  F --> A
  A -->|"Livraison"| P
`;
