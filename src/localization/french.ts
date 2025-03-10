import { surveyLocalization } from "survey-core";

export var frenchSurveyStrings = {
  pagePrevText: "Précédent",
  pageNextText: "Suivant",
  completeText: "Terminer",
  previewText: "Aperçu",
  editText: "Modifier",
  startSurveyText: "Commencer",
  otherItemText: "Autre (préciser)",
  noneItemText: "Aucun",
  selectAllItemText: "Tout sélectionner",
  progressText: "Page {0} sur {1}",
  panelDynamicProgressText: "Enregistrement {0} sur {1}",
  questionsProgressText: "{0}/{1} question(s) répondue(s)",
  emptySurvey: "Il n'y a ni page visible ni question visible dans ce questionnaire",
  completingSurvey: "Merci d'avoir répondu au questionnaire !",
  completingSurveyBefore: "Nos données indiquent que vous avez déjà rempli ce questionnaire.",
  loadingSurvey: "Le questionnaire est en cours de chargement...",
  optionsCaption: "Choisissez...",
  value: "valeur",
  requiredError: "La réponse à cette question est obligatoire.",
  requiredErrorInPanel: "Merci de répondre au moins à une question.",
  requiredInAllRowsError: "Toutes les lignes sont obligatoires",
  numericError: "La réponse doit être un nombre.",
  textMinLength: "Merci de saisir au moins {0} caractères.",
  textMaxLength: "Merci de saisir moins de {0} caractères.",
  textMinMaxLength: "Merci de saisir entre {0} et {1} caractères.",
  minRowCountError: "Merci de compléter au moins {0} lignes.",
  minSelectError: "Merci de sélectionner au minimum {0} réponses.",
  maxSelectError: "Merci de sélectionner au maximum {0} réponses.",
  numericMinMax: "Votre réponse '{0}' doit être supérieure ou égale à {1} et inférieure ou égale à {2}",
  numericMin: "Votre réponse '{0}' doit être supérieure ou égale à {1}",
  numericMax: "Votre réponse '{0}' doit être inférieure ou égale à {1}",
  invalidEmail: "Merci d'entrer une adresse mail valide.",
  invalidExpression: "L'expression: {0} doit retourner 'true'.",
  urlRequestError: "La requête a renvoyé une erreur '{0}'. {1}",
  urlGetChoicesError: "La requête a renvoyé des données vides ou la propriété 'path' est incorrecte",
  exceedMaxSize: "La taille du fichier ne doit pas excéder {0}.",
  otherRequiredError: "Merci de préciser le champ 'Autre'.",
  uploadingFile: "Votre fichier est en cours de chargement. Merci d'attendre quelques secondes et de réessayer.",
  loadingFile: "Chargement...",
  chooseFile: "Ajouter des fichiers...",
  noFileChosen: "Aucun fichier ajouté",
  confirmDelete: "Voulez-vous supprimer cet enregistrement ?",
  keyDuplicationError: "Cette valeur doit être unique.",
  addColumn: "Ajouter une colonne",
  addRow: "Ajouter une ligne",
  removeRow: "Supprimer",
  addPanel: "Ajouter",
  removePanel: "Supprimer",
  choices_Item: "item",
  matrix_column: "Colonne",
  matrix_row: "Ligne",
  savingData: "Les résultats sont en cours de sauvegarde sur le serveur...",
  savingDataError: "Une erreur est survenue et a empêché la sauvegarde des résultats.",
  savingDataSuccess: "Les résultats ont bien été enregistrés !",
  saveAgainButton: "Réessayer",
  timerMin: "min",
  timerSec: "sec",
  timerSpentAll: "Vous avez passé {0} sur cette page et {1} au total.",
  timerSpentPage: "Vous avez passé {0} sur cette page.",
  timerSpentSurvey: "Vous avez passé {0} au total.",
  timerLimitAll: "Vous avez passé {0} sur {1} sur cette page et {2} sur {3} au total.",
  timerLimitPage: "Vous avez passé {0} sur {1} sur cette page.",
  timerLimitSurvey: "Vous avez passé {0} sur {1} au total.",
  cleanCaption: "Nettoyer",
  clearCaption: "Vider",
  chooseFileCaption: "Ajouter un fichier",
  removeFileCaption: "Enlever ce fichier",
  booleanCheckedLabel: "Oui",
  booleanUncheckedLabel: "Non",
  confirmRemoveFile: "Êtes-vous certains de vouloir supprimer ce fichier : {0}?",
  confirmRemoveAllFiles: "Êtes-vous certains de vouloir supprimer tous les fichiers?",
  questionTitlePatternText: "Titre de la question",
};

surveyLocalization.locales["fr"] = frenchSurveyStrings;
surveyLocalization.localeNames["fr"] = "français";
