import { surveyLocalization } from "survey-core";

export var spanishSurveyStrings = {
  pagePrevText: "Anterior",
  pageNextText: "Siguiente",
  completeText: "Completar",
  previewText: "Vista previa",
  editText: "Edita",
  startSurveyText: "Comienza",
  otherItemText: "Otro (describa)",
  noneItemText: "Ninguno",
  selectAllItemText: "Seleccionar todo",
  progressText: "Página {0} de {1}",
  panelDynamicProgressText: "Registro {0} de {1}",
  questionsProgressText: "Respondió a {0}/{1} preguntas",
  emptySurvey: "No hay página visible o pregunta en la encuesta.",
  completingSurvey: "Gracias por completar la encuesta!",
  completingSurveyBefore:
    "Nuestros registros muestran que ya ha completado esta encuesta.",
  loadingSurvey: "La encuesta está cargando...",
  optionsCaption: "Seleccione...",
  value: "valor",
  requiredError: "Por favor conteste la pregunta.",
  requiredErrorInPanel: "Por favor, responda al menos una pregunta.",
  requiredInAllRowsError: "Por favor conteste las preguntas en cada hilera.",
  numericError: "La estimación debe ser numérica.",
  minError: "La estimación no debe ser menor que {0}",
  maxError: "La estimación no debe ser mayor que {0}",
  textMinLength: "Por favor entre por lo menos {0} símbolos.",
  textMaxLength: "Por favor entre menos de {0} símbolos.",
  textMinMaxLength: "Por favor entre más de {0} y menos de {1} símbolos.",
  minRowCountError: "Por favor llene por lo menos {0} hileras.",
  minSelectError: "Por favor seleccione por lo menos {0} variantes.",
  maxSelectError: "Por favor seleccione no más de {0} variantes.",
  numericMinMax:
    "El '{0}' debe de ser igual o más de {1} y igual o menos de {2}",
  numericMin: "El '{0}' debe ser igual o más de {1}",
  numericMax: "El '{0}' debe ser igual o menos de {1}",
  invalidEmail: "Por favor agregue un correo electrónico válido.",
  invalidExpression: "La expresión: {0} debería devolver 'verdadero'.",
  urlRequestError: "La solicitud regresó error '{0}'. {1}",
  urlGetChoicesError:
    "La solicitud regresó vacío de data o la propiedad 'trayectoria' no es correcta",
  exceedMaxSize: "El tamaño del archivo no debe de exceder {0}.",
  otherRequiredError: "Por favor agregue la otra estimación.",
  uploadingFile:
    "Su archivo se está subiendo. Por favor espere unos segundos e intente de nuevo.",
  loadingFile: "Cargando...",
  chooseFile: "Elija archivo(s)...",
  noFileChosen: "No se ha elegido ningún archivo",
  confirmDelete: "¿Quieres borrar el registro?",
  keyDuplicationError: "Este valor debe ser único.",
  addColumn: "Añadir columna",
  addRow: "Agregue una hilera",
  removeRow: "Eliminar una hilera",
  emptyRowsText: "No hay hileras.",
  addPanel: "Añadir nuevo",
  removePanel: "Retire",
  choices_Item: "artículo",
  matrix_column: "Columna",
  matrix_row: "Hilera",
  multipletext_itemname: "texto",
  savingData: "Los resultados se están guardando en el servidor...",
  savingDataError: "Los resultados se están guardando en el servidor...",
  savingDataSuccess: "¡Los resultados se guardaron con éxito!",
  saveAgainButton: "Inténtalo de nuevo.",
  timerMin: "min",
  timerSec: "sec",
  timerSpentAll: "Has gastado {0} en esta página y {1} en total.",
  timerSpentPage: "Usted ha pasado {0} en esta página.",
  timerSpentSurvey: "Has gastado en total.",
  timerLimitAll:
    "Has gastado {0} de {1} en esta página y {2} de {3} en total.",
  timerLimitPage: "Has gastado {0} de {1} en esta página.",
  timerLimitSurvey: "Usted ha gastado {0} de {1} en total.",
  cleanCaption: "Limpia",
  clearCaption: "Despejen",
  signaturePlaceHolder: "Firma aqui",
  chooseFileCaption: "Elija el archivo",
  removeFileCaption: "Elimina este archivo",
  booleanCheckedLabel: "Sí",
  booleanUncheckedLabel: "No",
  confirmRemoveFile: "¿Estás seguro de que quieres eliminar este archivo: {0}?",
  confirmRemoveAllFiles: "¿Estás seguro de que quieres eliminar todos los archivos?",
  questionTitlePatternText: "Título de la pregunta",
  modalCancelButtonText: "Anular",
  modalApplyButtonText: "Aplicar",
};

surveyLocalization.locales["es"] = spanishSurveyStrings;
surveyLocalization.localeNames["es"] = "español";
