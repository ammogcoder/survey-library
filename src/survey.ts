import { HashTable, Helpers } from "./helpers";
import { JsonObject, JsonError, Serializer, property } from "./jsonobject";
import { Base, EventBase } from "./base";
import {
  ISurvey,
  ISurveyData,
  ISurveyImpl,
  ITextProcessor,
  IQuestion,
  IPanel,
  IElement,
  IPage,
  ISurveyErrorOwner,
  ISurveyElement,
  IProgressInfo,
  IFindElement,
} from "./base-interfaces";
import { SurveyElementCore, SurveyElement } from "./survey-element";
import { surveyCss } from "./defaultCss/cssstandard";
import { ISurveyTriggerOwner, SurveyTrigger } from "./trigger";
import { CalculatedValue } from "./calculatedValue";
import { PageModel } from "./page";
import { TextPreProcessor, TextPreProcessorValue } from "./textPreProcessor";
import { ProcessValue } from "./conditionProcessValue";
import { dxSurveyService } from "./dxSurveyService";
import { surveyLocalization } from "./surveyStrings";
import { CustomError } from "./error";
import { ILocalizableOwner, LocalizableString } from "./localizablestring";
import { StylesManager } from "./stylesmanager";
import { SurveyTimerModel, ISurveyTimerText } from "./surveyTimerModel";
import { Question } from "./question";
import { QuestionSelectBase } from "./question_baseselect";
import { ItemValue } from "./itemvalue";
import { PanelModelBase, QuestionRowModel } from "./panel";
import {
  HtmlConditionItem,
  UrlConditionItem,
  ExpressionItem,
} from "./expressionItems";
import { ExpressionRunner, ConditionRunner } from "./conditions";
import { settings } from "./settings";
import { getSize, isMobile, scrollElementByChildId } from "./utils/utils";
import { SurveyError } from "./survey-error";
import { IAction } from "./actions/action";
import { CssClassBuilder } from "./utils/cssClassBuilder";
import { element } from "angular";

/**
 * The `Survey` object contains information about the survey, Pages, Questions, flow logic and etc.
 */
export class SurveyModel extends SurveyElementCore
  implements
  ISurvey,
  ISurveyData,
  ISurveyImpl,
  ISurveyTriggerOwner,
  ISurveyErrorOwner,
  ISurveyTimerText {
  public static readonly TemplateRendererComponentName: string =
    "sv-template-renderer";
  public static get cssType(): string {
    return surveyCss.currentType;
  }
  public static set cssType(value: string) {
    StylesManager.applyTheme(value);
  }

  [index: string]: any;
  private static stylesManager: StylesManager = null;
  public static platform: string = "unknown";
  public get platformName(): string {
    return SurveyModel.platform;
  }
  /**
   * You can display an additional field (comment field) for the most of questions; users can enter additional comments to their response.
   * The comment field input is saved as `'question name' + 'commentPrefix'`.
   * @see data
   * @see Question.hasComment
   */
  public get commentPrefix(): string {
    return settings.commentPrefix;
  }
  public set commentPrefix(val: string) {
    settings.commentPrefix = val;
  }

  private valuesHash: HashTable<any> = {};
  private variablesHash: HashTable<any> = {};
  private editingObjValue: Base;

  private localeValue: string = "";

  private textPreProcessor: TextPreProcessor;
  private timerModelValue: SurveyTimerModel;

  //#region Event declarations

  /**
   * The event is fired before the survey is completed and the `onComplete` event is fired. You can prevent the survey from completing by setting `options.allowComplete` to `false`
   * <br/> `sender` - the survey object that fires the event.
   * <br/> `options.allowComplete` - Specifies whether a user can complete a survey. Set this property to `false` to prevent the survey from completing. The default value is `true`.
   * <br/> `options.isCompleteOnTrigger` - returns true if the survey is completing on "complete" trigger.
   * @see onComplete
   */
  public onCompleting: EventBase<SurveyModel> = this.addEvent<SurveyModel>();
  /**
   * The event is fired after a user clicks the 'Complete' button and finishes a survey. Use this event to send the survey data to your web server.
   * <br/> `sender` - the survey object that fires the event.
   * <br/> `options.showDataSaving(text)` - call this method to show that the survey is saving survey data on your server. The `text` is an optional parameter to show a custom message instead of default.
   * <br/> `options.showDataSavingError(text)` - call this method to show that an error occurred while saving the data on your server. If you want to show a custom error, use an optional `text` parameter.
   * <br/> `options.showDataSavingSuccess(text)` - call this method to show that the data was successfully saved on the server.
   * <br/> `options.showDataSavingClear` - call this method to hide the text about the saving progress.
   * <br/> `options.isCompleteOnTrigger` - returns true if the survey is completed on "complete" trigger.
   *  @see data
   * @see clearInvisibleValues
   * @see completeLastPage
   * @see surveyPostId
   */
  public onComplete: EventBase<SurveyModel> = this.addEvent<SurveyModel>();
  /**
   * The event is fired before the survey is going to preview mode, state equals to `preview`. It happens when a user click on "Preview" button. It shows when "showPreviewBeforeComplete" proeprty equals to "showAllQuestions" or "showAnsweredQuestions".
   * You can prevent showing it by setting allowShowPreview to `false`.
   * <br/> `sender` - the survey object that fires the event.
   * <br/> `options.allowShowPreview` - Specifies whether a user can see a preview. Set this property to `false` to prevent from showing the preview. The default value is `true`.
   * @see showPreviewBeforeComplete
   */
  public onShowingPreview: EventBase<SurveyModel> = this.addEvent<
    SurveyModel
  >();
  /**
   * The event is fired after a user clicks the 'Complete' button. The event allows you to specify the URL opened after completing a survey.
   * Specify the `navigateToUrl` property to make survey navigate to another url.
   * <br/> `sender` - the survey object that fires the event.
   * <br/> `options.url` - Specifies a URL opened after completing a survey. Set this property to an empty string to cancel the navigation and show the completed survey page.
   * @see navigateToUrl
   * @see navigateToUrlOnCondition
   */
  public onNavigateToUrl: EventBase<SurveyModel> = this.addEvent<SurveyModel>();
  /**
   * The event is fired after the survey changed it's state from "starting" to "running". The "starting" state means that survey shows the started page.
   * The `firstPageIsStarted` property should be set to `true`, if you want to display a start page in your survey. In this case, an end user should click the "Start" button to start the survey.
   * @see firstPageIsStarted
   */
  public onStarted: EventBase<SurveyModel> = this.addEvent<SurveyModel>();
  /**
   * The event is fired on clicking the 'Next' button if the `sendResultOnPageNext` is set to `true`. You can use it to save the intermediate results, for example, if your survey is large enough.
   * <br/> `sender` - the survey object that fires the event.
   * @see sendResultOnPageNext
   */
  public onPartialSend: EventBase<SurveyModel> = this.addEvent<SurveyModel>();
  /**
   * The event is fired before the current page changes to another page. Typically it happens when a user click the 'Next' or 'Prev' buttons.
   * <br/> `sender` - the survey object that fires the event.
   * <br/> `option.oldCurrentPage` - the previous current/active page.
   * <br/> `option.newCurrentPage` - a new current/active page.
   * <br/> `option.allowChanging` - set it to `false` to disable the current page changing. It is `true` by default.
   * <br/> `option.isNextPage` - commonly means, that end-user press the next page button. In general, it means that options.newCurrentPage is the next page after options.oldCurrentPage
   * <br/> `option.isPrevPage` - commonly means, that end-user press the previous page button. In general, it means that options.newCurrentPage is the previous page before options.oldCurrentPage
   * @see currentPage
   * @see currentPageNo
   * @see nextPage
   * @see prevPage
   * @see completeLastPage
   * @see onCurrentPageChanged
   **/
  public onCurrentPageChanging: EventBase<SurveyModel> = this.addEvent<
    SurveyModel
  >();
  /**
   * The event is fired when the current page has been changed to another page. Typically it happens when a user click on 'Next' or 'Prev' buttons.
   * <br/> `sender` - the survey object that fires the event.
   * <br/> `option.oldCurrentPage` - a previous current/active page.
   * <br/> `option.newCurrentPage` - a new current/active page.
   * <br/> `option.isNextPage` - commonly means, that end-user press the next page button. In general, it means that options.newCurrentPage is the next page after options.oldCurrentPage
   * <br/> `option.isPrevPage` - commonly means, that end-user press the previous page button. In general, it means that options.newCurrentPage is the previous page before options.oldCurrentPage
   * @see currentPage
   * @see currentPageNo
   * @see nextPage
   * @see prevPage
   * @see completeLastPage
   * @see onCurrentPageChanging
   */
  public onCurrentPageChanged: EventBase<SurveyModel> = this.addEvent<
    SurveyModel
  >();
  /**
   * The event is fired before the question value (answer) is changed. It can be done via UI by a user or programmatically on calling the `setValue` method.
   * <br/> `sender` - the survey object that fires the event.
   * <br/> `options.name` - the value name that has being changed.
   * <br/> `options.question` - a question which `question.name` equals to the value name. If there are several questions with the same name, the first question is used. If there is no such questions, the `options.question` is null.
   * <br/> `options.oldValue` - an old, previous value.
   * <br/> `options.value` - a new value. You can change it.
   * @see setValue
   * @see onValueChanged
   */
  public onValueChanging: EventBase<SurveyModel> = this.addEvent<SurveyModel>();
  /**
   * The event is fired when the question value (i.e., answer) has been changed. The question value can be changed in UI (by a user) or programmatically (on calling `setValue` method).
   * Use the `onDynamicPanelItemValueChanged` and `onMatrixCellValueChanged` events to handle changes in a question in the Panel Dynamic and a cell question in matrices.
   * <br/> `sender` - the survey object that fires the event.
   * <br/> `options.name` - the value name that has been changed.
   * <br/> `options.question` - a question which `question.name` equals to the value name. If there are several questions with the same name, the first question is used. If there is no such questions, the `options.question` is `null`.
   * <br/> `options.value` - a new value.
   * @see setValue
   * @see onValueChanging
   * @see onDynamicPanelItemValueChanged
   * @see onMatrixCellValueChanged
   */
  public onValueChanged: EventBase<SurveyModel> = this.addEvent<SurveyModel>();
  /**
   * The event is fired when setVariable function is called. It can be called on changing a calculated value.
   * <br/> `sender` - the survey object that fires the event.
   * <br/> `options.name` - the variable name that has been changed.
   * <br/> `options.value` - a new value.
   * @see setVariable
   * @see onValueChanged
   * @see calculatedValues
   */
  public onVariableChanged: EventBase<SurveyModel> = this.addEvent<SurveyModel>();
  /**
   * The event is fired when a question visibility has been changed.
   * <br/> `sender` - the survey object that fires the event.
   * <br/> `options.question` - a question which visibility has been changed.
   * <br/> `options.name` - a question name.
   * <br/> `options.visible` - a question `visible` boolean value.
   * @see Question.visibile
   * @see Question.visibileIf
   */
  public onVisibleChanged: EventBase<SurveyModel> = this.addEvent<
    SurveyModel
  >();
  /**
   * The event is fired on changing a page visibility.
   * <br/> `sender` - the survey object that fires the event.
   * <br/> `options.page` - a page which visibility has been changed.
   * <br/> `options.visible` - a page `visible` boolean value.
   * @see PageModel.visibile
   * @see PageModel.visibileIf
   */
  public onPageVisibleChanged: EventBase<SurveyModel> = this.addEvent<
    SurveyModel
  >();
  /**
   * The event is fired on changing a panel visibility.
   * <br/> `sender` - the survey object that fires the event.
   * <br/> `options.panel` - a panel which visibility has been changed.
   * <br/> `options.visible` - a panel `visible` boolean value.
   * @see PanelModel.visibile
   * @see PanelModel.visibileIf
   */
  public onPanelVisibleChanged: EventBase<SurveyModel> = this.addEvent<
    SurveyModel
  >();
  /**
   * The event is fired on creating a new question.
   * Unlike the onQuestionAdded event, this event calls for all question created in survey including inside: a page, panel, matrix cell, dynamic panel and multiple text.
   * or inside a matrix cell or it can be a text question in multiple text items or inside a panel of a panel dynamic.
   * You can use this event to set up properties to a question based on it's type for all questions, regardless where they are located, on the page or inside a matrix cell.
   * Please note: If you want to use this event for questions loaded from JSON then you have to create survey with empty/null JSON parameter, assign the event and call survey.fromJSON(yourJSON) function.
   * <br/> `sender` - the survey object that fires the event.
   * <br/> `options.question` - a newly created question object.
   * @see Question
   * @see onQuestionAdded
   */
  public onQuestionCreated: EventBase<SurveyModel> = this.addEvent<
    SurveyModel
  >();
  /**
   * The event is fired on adding a new question into survey.
   * <br/> `sender` - the survey object that fires the event.
   * <br/> `options.question` - a newly added question object.
   * <br/> `options.name` - a question name.
   * <br/> `options.index` - an index of the question in the container (page or panel).
   * <br/> `options.parentPanel` - a container where a new question is located. It can be a page or panel.
   * <br/> `options.rootPanel` - typically, it is a page.
   * @see Question
   * @see onQuestionCreated
   */
  public onQuestionAdded: EventBase<SurveyModel> = this.addEvent<SurveyModel>();
  /**
   * The event is fired on removing a question from survey.
   * <br/> `sender` - the survey object that fires the event.
   * <br/> `options.question` - a removed question object.
   * <br/> `options.name` - a question name.
   * @see Question
   */
  public onQuestionRemoved: EventBase<SurveyModel> = this.addEvent<
    SurveyModel
  >();
  /**
   * The event is fired on adding a panel into survey.
   * <br/> `sender` - the survey object that fires the event.
   * <br/> `options.panel` - a newly added panel object.
   * <br/> `options.name` - a panel name.
   * <br/> `options.index` - an index of the panel in the container (a page or panel).
   * <br/> `options.parentPanel` - a container (a page or panel) where a new panel is located.
   * <br/> `options.rootPanel` - a root container, typically it is a page.
   * @see PanelModel
   */
  public onPanelAdded: EventBase<SurveyModel> = this.addEvent<SurveyModel>();
  /**
   * The event is fired on removing a panel from survey.
   * <br/> `sender` - the survey object that fires the event.
   * <br/> `options.panel` - a removed panel object.
   * <br/> `options.name` - a panel name.
   * @see PanelModel
   */
  public onPanelRemoved: EventBase<SurveyModel> = this.addEvent<SurveyModel>();
  /**
   * The event is fired on adding a page into survey.
   * <br/> `sender` - the survey object that fires the event.
   * <br/> `options.page` - a newly added `panel` object.
   * @see PanelModel
   */
  public onPageAdded: EventBase<SurveyModel> = this.addEvent<SurveyModel>();
  /**
   * The event is fired on validating value in a question. You can specify a custom error message using `options.error`. The survey blocks completing the survey or going to the next page when the error messages are displayed.
   * <br/> `sender` - the survey object that fires the event.
   * <br/> `options.question` - a validated question.
   * <br/> `options.name` - a question name.
   * <br/> `options.value` - the current question value (answer).
   * <br/> `options.error` - an error string. It is empty by default.
   * @see onServerValidateQuestions
   * @see onSettingQuestionErrors
   */
  public onValidateQuestion: EventBase<SurveyModel> = this.addEvent<
    SurveyModel
  >();
  /**
   * The event is fired before errors are assigned to a question. You may add/remove/modify errors for a question.
   * <br/> `sender` - the survey object that fires the event.
   * <br/> `options.question` - a validated question.
   * <br/> `options.errors` - the list of errors. The list is empty by default and remains empty if a validated question has no errors.
   * @see onValidateQuestion
   */
  public onSettingQuestionErrors: EventBase<SurveyModel> = this.addEvent<
    SurveyModel
  >();
  /**
   * Use this event to validate data on your server.
   * <br/> `sender` - the survey object that fires the event.
   * <br/> `options.data` - the values of all non-empty questions on the current page. You can get a question value as `options.data["myQuestionName"]`.
   * <br/> `options.errors` - set your errors to this object as: `options.errors["myQuestionName"] = "Error text";`. It will be shown as a question error.
   * <br/> `options.complete()` - call this function to tell survey that your server callback has been processed.
   * @see onValidateQuestion
   * @see onValidatePanel
   */
  public onServerValidateQuestions: any = this.addEvent<SurveyModel>();
  /**
   * Use this event to modify the HTML before rendering, for example HTML on a completed page.
   * <br/> `sender` - the survey object that fires the event.
   * <br/> `options.html` - an HTML that you may change before text processing and then rendering.
   * @see completedHtml
   * @see loadingHtml
   * @see QuestionHtmlModel.html
   */
  /**
   * The event is fired on validating a panel. Set your error to `options.error` and survey will show the error for the panel and block completing the survey or going to the next page.
   * <br/> `sender` - the survey object that fires the event.
   * <br/> `options.name` - a panel name.
   * <br/> `options.error` - an error string. It is empty by default.
   * @see onValidateQuestion
   */
  public onValidatePanel: EventBase<SurveyModel> = this.addEvent<SurveyModel>();
  /**
   * Use the event to change the default error text.
   * <br/> `sender` - the survey object that fires the event.
   * <br/> `options.text` - an error text.
   * <br/> `options.error` - an instance of the `SurveyError` object.
   * <br/> `options.obj` - an instance of Question, Panel or Survey object to where error is located.
   * <br/> `options.name` - the error name. The following error names are available:
   * required, requireoneanswer, requirenumeric, exceedsize, webrequest, webrequestempty, otherempty,
   * uploadingfile, requiredinallrowserror, minrowcounterror, keyduplicationerror, custom
   */
  public onErrorCustomText: EventBase<SurveyModel> = this.addEvent<
    SurveyModel
  >();
  /**
   * Use the this event to be notified when the survey finished validate questions on the current page. It commonly happens when a user try to go to the next page or complete the survey
   * options.questions - the list of questions that have errors
   * options.errors - the list of errors
   * options.page - the page where question(s) are located
   */
  public onValidatedErrorsOnCurrentPage: EventBase<SurveyModel> = this.addEvent<
    SurveyModel
  >();
  /**
   * Use this event to modify the HTML content before rendering, for example `completeHtml` or `loadingHtml`.
   * `options.html` - specifies the modified HTML content.
   * @see completedHtml
   * @see loadingHtml
   */
  public onProcessHtml: EventBase<SurveyModel> = this.addEvent<SurveyModel>();
  /**
   * Use this event to change the question title in code. If you want to remove question numbering then set showQuestionNumbers to "off".
   * <br/> `sender` - the survey object that fires the event.
   * <br/> `options.title` - a calculated question title, based on question `title`, `name`.
   * <br/> `options.question` - a question object.
   * @see showQuestionNumbers
   * @see requiredText
   */
  public onGetQuestionTitle: EventBase<SurveyModel> = this.addEvent<
    SurveyModel
  >();
  /**
   * Use this event to change the element title tag name that renders by default.
   * <br/> `sender` - the survey object that fires the event.
   * <br/> `options.element` - an element (question, panel, page and survey) that SurveyJS is going to render.
   * <br/> `options.tagName` - an element title tagName that are used to render a title. You can change it from the default value.
   * @see showQuestionNumbers
   * @see requiredText
   */
  public onGetTitleTagName: EventBase<SurveyModel> = this.addEvent<
    SurveyModel
  >();
  /**
   * Use this event to change the question no in code. If you want to remove question numbering then set showQuestionNumbers to "off".
   * <br/> `sender` - the survey object that fires the event.
   * <br/> `options.no` - a calculated question no, based on question `visibleIndex`, survey `.questionStartIndex` properties. You can change it.
   * <br/> `options.question` - a question object.
   * @see showQuestionNumbers
   * @see questionStartIndex
   */
  public onGetQuestionNo: EventBase<SurveyModel> = this.addEvent<SurveyModel>();
  /**
   * Use this event to change the progress text in code.
   * <br/> `sender` - the survey object that fires the event.
   * <br/> `options.text` - a progress text, that SurveyJS will render in progress bar.
   * <br/> `options.questionCount` - a number of questions that have input(s). We do not count html or expression questions
   * <br/> `options.answeredQuestionCount` - a number of questions that have input(s) and an user has answered.
   * <br/> `options.requiredQuestionCount` - a number of required questions that have input(s). We do not count html or expression questions
   * <br/> `options.requiredAnsweredQuestionCount` - a number of required questions that have input(s) and an user has answered.
   *  @see progressBarType
   */
  public onProgressText: EventBase<SurveyModel> = this.addEvent<SurveyModel>();
  /**
   * Use this event to process the markdown text.
   * <br/> `sender` - the survey object that fires the event.
   * <br/> `options.element` - SurveyJS element (a question, panel, page, or survey) where the string is going to be rendered.
   * <br/> `options.name` - a property name is going to be rendered.
   * <br/> `options.text` - a text that is going to be rendered.
   * <br/> `options.html` - an HTML content. It is `null` by default. Use this property to specify the HTML content rendered instead of `options.text`.
   */
  public onTextMarkdown: EventBase<SurveyModel> = this.addEvent<SurveyModel>();
  /**
   * Use this event to specity render component name used for text rendering.
   * <br/> `sender` - the survey object that fires the event.
   * <br/> `options.element` - SurveyJS element (a question, panel, page, or survey) where the string is going to be rendered.
   * <br/> `options.name` - a property name is going to be rendered.
   * <br/> `options.renderAs` - a component name used for text rendering.
   */
  public onTextRenderAs: EventBase<SurveyModel> = this.addEvent<SurveyModel>();
  /**
   * The event fires when it gets response from the [api.surveyjs.io](https://api.surveyjs.io) service on saving survey results. Use it to find out if the results have been saved successfully.
   * <br/> `sender` - the survey object that fires the event.
   * <br/> `options.success` - it is `true` if the results has been sent to the service successfully.
   * <br/> `options.response` - a response from the service.
   */
  public onSendResult: EventBase<SurveyModel> = this.addEvent<SurveyModel>();
  /**
   * Use it to get results after calling the `getResult` method. It returns a simple analytics from [api.surveyjs.io](https://api.surveyjs.io) service.
   * <br/> `sender` - the survey object that fires the event.
   * <br/> `options.success` - it is `true` if the results were got from the service successfully.
   * <br/> `options.data` - the object `{AnswersCount, QuestionResult : {} }`. `AnswersCount` is the number of posted survey results. `QuestionResult` is an object with all possible unique answers to the question and number of these answers.
   * <br/> `options.dataList` - an array of objects `{name, value}`, where `name` is a unique value/answer to the question and `value` is a number/count of such answers.
   * <br/> `options.response` - the server response.
   * @see getResult
   */
  public onGetResult: EventBase<SurveyModel> = this.addEvent<SurveyModel>();
  /**
   * The event is fired on uploading the file in QuestionFile when `storeDataAsText` is set to `false`. Use this event to change the uploaded file name or to prevent a particular file from being uploaded.
   * <br/> `sender` - the survey object that fires the event.
   * <br/> `options.question` - the file question instance.
   * <br/> `options.name` - the question name.
   * <br/> `options.files` - the Javascript File objects array to upload.
   * <br/> `options.callback` - a callback function to get the file upload status and the updloaded file content.
   * @see uploadFiles
   * @see QuestionFileModel.storeDataAsText
   * @see onDownloadFile
   * @see onClearFiles
   * @see [View Examples](https://www.google.com/search?q=site%3Ahttps%3A%2F%2Fsurveyjs.io%2FExamples%2F+%22onUploadFiles%22)
   */
  public onUploadFiles: EventBase<SurveyModel> = this.addEvent<SurveyModel>();
  /**
   * The event is fired on downloading a file in QuestionFile. Use this event to pass the file to a preview.
   * <br/> `sender` - the survey object that fires the event.
   * <br/> `options.name` - the question name.
   * <br/> `options.content` - the file content.
   * <br/> `options.fileValue` - single file question value.
   * <br/> `options.callback` - a callback function to get the file downloading status and the downloaded file content.
   * @see downloadFile
   * @see onClearFiles
   * @see onUploadFiles
   * @see [View Examples](https://www.google.com/search?q=site%3Ahttps%3A%2F%2Fsurveyjs.io%2FExamples%2F+%22onDownloadFile%22)
   */
  public onDownloadFile: EventBase<SurveyModel> = this.addEvent<SurveyModel>();
  /**
   * This event is fired on clearing the value in a QuestionFile. Use this event to remove files stored on your server.
   * <br/> `sender` - the survey object that fires the event.
   * <br/> `question` - the question instance.
   * <br/> `options.name` - the question name.
   * <br/> `options.value` - the question value.
   * <br/> `options.fileName` - a removed file's name, set it to `null` to clear all files.
   * <br/> `options.callback` - a callback function to get the operation status.
   * @see clearFiles
   * @see onDownloadFile
   * @see onUploadFiles
   * @see [View Examples](https://www.google.com/search?q=site%3Ahttps%3A%2F%2Fsurveyjs.io%2FExamples%2F+%22onClearFiles%22)
   */
  public onClearFiles: EventBase<SurveyModel> = this.addEvent<SurveyModel>();
  /**
   * The event is fired after choices for radiogroup, checkbox, and dropdown has been loaded from a RESTful service and before they are assigned to a question.
   * You may change the choices, before they are assigned or disable/enabled make visible/invisible question, based on loaded results.
   * <br/> `sender` - the survey object that fires the event.
   * <br/> `question` - the question where loaded choices are going to be assigned.
   * <br/> `choices` - the loaded choices. You can change the loaded choices to before they are assigned to question.
   * <br/> `serverResult` - a result that comes from the server as it is.
   */
  public onLoadChoicesFromServer: EventBase<SurveyModel> = this.addEvent<
    SurveyModel
  >();
  /**
   * The event is fired after survey is loaded from api.surveyjs.io service.
   * You can use this event to perform manipulation with the survey model after it was loaded from the web service.
   * <br/> `sender` - the survey object that fires the event.
   * @see surveyId
   * @see loadSurveyFromService
   */
  public onLoadedSurveyFromService: EventBase<SurveyModel> = this.addEvent<
    SurveyModel
  >();
  /**
   * The event is fired on processing the text when it finds a text in brackets: `{somevalue}`. By default, it uses the value of survey question values and variables.
   * For example, you may use the text processing in loading choices from the web. If your `choicesByUrl.url` equals to "UrlToServiceToGetAllCities/{country}/{state}",
   * you may set on this event `options.value` to "all" or empty string when the "state" value/question is non selected by a user.
   * <br/> `sender` - the survey object that fires the event.
   * <br/> `options.name` - the name of the processing value, for example, "state" in our example.
   * <br/> `options.value` - the value of the processing text.
   * <br/> `options.isExists` - a boolean value. Set it to `true` if you want to use the value and set it to `false` if you don't.
   */
  public onProcessTextValue: EventBase<SurveyModel> = this.addEvent<
    SurveyModel
  >();
  /**
   * The event is fired before rendering a question. Use it to override the default question CSS classes.
   * <br/> `sender` - the survey object that fires the event.
   * <br/> `options.question` - a question for which you can change the CSS classes.
   * <br/> `options.cssClasses` - an object with CSS classes. For example `{root: "table", button: "button"}`. You can change them to your own CSS classes.
   */
  public onUpdateQuestionCssClasses: EventBase<SurveyModel> = this.addEvent<
    SurveyModel
  >();
  /**
   * The event is fired before rendering a panel. Use it to override the default panel CSS classes.
   * <br/> `sender` - the survey object that fires the event.
   * <br/> `options.panel` - a panel for which you can change the CSS classes.
   * <br/> `options.cssClasses` - an object with CSS classes. For example `{title: "sv_p_title", description: "small"}`. You can change them to your own CSS classes.
   */
  public onUpdatePanelCssClasses: EventBase<SurveyModel> = this.addEvent<
    SurveyModel
  >();
  /**
   * The event is fired before rendering a page. Use it to override the default page CSS classes.
   * <br/> `sender` - the survey object that fires the event.
   * <br/> `options.page` - a page for which you can change the CSS classes.
   * <br/> `options.cssClasses` - an object with CSS classes. For example `{title: "sv_p_title", description: "small"}`. You can change them to your own CSS classes.
   */
  public onUpdatePageCssClasses: EventBase<SurveyModel> = this.addEvent<
    SurveyModel
  >();
  /**
   * The event is fired before rendering a choice item in radiogroup, checkbox or dropdown questions. Use it to override the default choice item css.
   * <br/> `sender` - the survey object that fires the event.
   * <br/> `options.question` - a question where choice item is rendered.
   * <br/> `options.item` - a choice item of ItemValue type. You can get value or text choice properties as options.item.value or options.choice.text
   * <br/> `options.css` - a string with css classes divided by space. You can change it.
   */
  public onUpdateChoiceItemCss: EventBase<SurveyModel> = this.addEvent<
    SurveyModel
  >();
  /**
   * The event is fired right after survey is rendered in DOM.
   * <br/> `sender` - the survey object that fires the event.
   * <br/> `options.htmlElement` - a root HTML element bound to the survey object.
   */
  public onAfterRenderSurvey: EventBase<SurveyModel> = this.addEvent<
    SurveyModel
  >();
  /**
   * The event is fired right after a page is rendered in DOM. Use it to modify HTML elements.
   * <br/> `sender` - the survey object that fires the event.
   * <br/> `options.htmlElement` - an HTML element bound to the survey header object.
   */
  public onAfterRenderHeader: EventBase<SurveyModel> = this.addEvent<
    SurveyModel
  >();
  /**
   * The event is fired right after a page is rendered in DOM. Use it to modify HTML elements.
   * <br/> `sender` - the survey object that fires the event.
   * <br/> `options.page` - a page object for which the event is fired. Typically the current/active page.
   * <br/> `options.htmlElement` - an HTML element bound to the page object.
   */
  public onAfterRenderPage: EventBase<SurveyModel> = this.addEvent<
    SurveyModel
  >();
  /**
   * The event is fired right after a question is rendered in DOM. Use it to modify HTML elements.
   * <br/> `sender` - the survey object that fires the event.
   * <br/> `options.question` - a question object for which the event is fired.
   * <br/> `options.htmlElement` - an HTML element bound to the question object.
   */
  public onAfterRenderQuestion: EventBase<SurveyModel> = this.addEvent<
    SurveyModel
  >();
  /**
   * The event is fired right after a non-composite question (text, comment, dropdown, radiogroup, checkbox) is rendered in DOM. Use it to modify HTML elements.
   * This event is not fired for matrices, panels, multiple text and image picker.
   * <br/> `sender` - the survey object that fires the event.
   * <br/> `options.question` - a question object for which the event is fired.
   * <br/> `options.htmlElement` - an HTML element bound to the question object.
   */
  public onAfterRenderQuestionInput: EventBase<SurveyModel> = this.addEvent<
    SurveyModel
  >();
  /**
   * The event is fired right after a panel is rendered in DOM. Use it to modify HTML elements.
   * <br/> `sender` - the survey object that fires the event
   * <br/> `options.panel` - a panel object for which the event is fired
   * <br/> `options.htmlElement` - an HTML element bound to the panel object
   */
  public onAfterRenderPanel: EventBase<SurveyModel> = this.addEvent<
    SurveyModel
  >();
  /**
   * The event occurs when an element within a question gets focus.
   * <br/> `sender` - A [survey](https://surveyjs.io/Documentation/Library?id=surveymodel) object that fires the event.
   * <br/> `options.question` - A [question](https://surveyjs.io/Documentation/Library?id=Question) whose child element gets focus.
   * @see onFocusInPanel
   */
  public onFocusInQuestion: EventBase<SurveyModel> = this.addEvent<SurveyModel>();
  /**
   * The event occurs when an element within a panel gets focus.
   * <br/> `sender` - A [survey](https://surveyjs.io/Documentation/Library?id=surveymodel) object that fires the event.
   * <br/> `options.panel` - A [panel](https://surveyjs.io/Documentation/Library?id=PanelModelBase) whose child element gets focus.
   * @see onFocusInQuestion
   */
  public onFocusInPanel: EventBase<SurveyModel> = this.addEvent<SurveyModel>();

  /**
   * Use this event to change the visibility of an individual choice item in [Checkbox](https://surveyjs.io/Documentation/Library?id=questioncheckboxmodel), [Dropdown](https://surveyjs.io/Documentation/Library?id=questiondropdownmodel), [Radiogroup](https://surveyjs.io/Documentation/Library?id=questionradiogroupmodel), and other similar question types.
   *
   * The event handler accepts the following arguments:
   *
   * - `sender` - A Survey instance that raised the event.
   * - `options.question` - A Question instance to which the choice item belongs.
   * - `options.item` - The choice item as specified in the [choices](https://surveyjs.io/Documentation/Library?id=QuestionSelectBase#choices) array.
   * - `options.visible` - A Boolean value that specifies the item visibility. Set it to `false` to hide the item.
   */
  public onShowingChoiceItem: EventBase<SurveyModel> = this.addEvent<
    SurveyModel
  >();

  /**
   * The event is fired on adding a new row in Matrix Dynamic question.
   * <br/> `sender` - the survey object that fires the event
   * <br/> `options.question` - a matrix question.
   * <br/> `options.row` - a new added row.
   * @see QuestionMatrixDynamicModel
   * @see QuestionMatrixDynamicModel.visibleRows
   */
  public onMatrixRowAdded: EventBase<SurveyModel> = this.addEvent<
    SurveyModel
  >();
  /**
   * The event is fired before adding a new row in Matrix Dynamic question.
   * <br/> `sender` - the survey object that fires the event
   * <br/> `options.question` - a matrix question.
   * <br/> `options.canAddRow` - specifies whether a new row can be added
   * @see QuestionMatrixDynamicModel
   * @see QuestionMatrixDynamicModel.visibleRows
   */
  public onMatrixBeforeRowAdded: EventBase<SurveyModel> = this.addEvent<
    SurveyModel
  >();
  /**
   * The event is fired before removing a row from Matrix Dynamic question. You can disable removing and clear the data instead.
   * <br/> `sender` - the survey object that fires the event
   * <br/> `options.question` - a matrix question.
   * <br/> `options.rowIndex` - a row index.
   * <br/> `options.row` - a row object.
   * <br/> `options.allow` - a boolean property. Set it to `false` to disable the row removing.
   * @see QuestionMatrixDynamicModel
   * @see onMatrixRowRemoved
   * @see onMatrixAllowRemoveRow
   */
  public onMatrixRowRemoving: EventBase<SurveyModel> = this.addEvent<
    SurveyModel
  >();
  /**
   * The event is fired on removing a row from Matrix Dynamic question.
   * <br/> `sender` - the survey object that fires the event
   * <br/> `options.question` - a matrix question
   * <br/> `options.rowIndex` - a removed row index
   * <br/> `options.row` - a removed row object
   * @see QuestionMatrixDynamicModel
   * @see QuestionMatrixDynamicModel.visibleRows
   * @see onMatrixRowRemoving
   * @see onMatrixAllowRemoveRow
   */
  public onMatrixRowRemoved: EventBase<SurveyModel> = this.addEvent<
    SurveyModel
  >();
  /**
   * The event is fired before rendering "Remove" button for removing a row from Matrix Dynamic question.
   * <br/> `sender` - the survey object that fires the event
   * <br/> `options.question` - a matrix question.
   * <br/> `options.rowIndex` - a row index.
   * <br/> `options.row` - a row object.
   * <br/> `options.allow` - a boolean property. Set it to `false` to disable the row removing.
   * @see QuestionMatrixDynamicModel
   * @see onMatrixRowRemoving
   * @see onMatrixRowRemoved
   */
  public onMatrixAllowRemoveRow: EventBase<SurveyModel> = this.addEvent<
    SurveyModel
  >();
  /**
   * The event is fired before creating cell question in the matrix. You can change the cell question type by setting different options.cellType.
   * <br/> `sender` - the survey object that fires the event.
   * <br/> `options.question` - the matrix question.
   * <br/> `options.cellType` - the cell question type. You can change it.
   * <br/> `options.rowValue` - the value of the current row. To access a particular column's value within the current row, use: `options.rowValue["columnValue"]`.
   * <br/> `options.column` - the matrix column object.
   * <br/> `options.columnName` - the matrix column name.
   * <br/> `options.row` - the matrix row object.
   * @see onMatrixBeforeRowAdded
   * @see onMatrixCellCreated
   * @see QuestionMatrixDynamicModel
   * @see QuestionMatrixDropdownModel
   */
  public onMatrixCellCreating: EventBase<SurveyModel> = this.addEvent<
    SurveyModel
  >();
  /**
    * The event is fired for every cell created in Matrix Dynamic and Matrix Dropdown questions.
    * <br/> `sender` - the survey object that fires the event.
    * <br/> `options.question` - the matrix question.
    * <br/> `options.cell` - the matrix cell.
    * <br/> `options.cellQuestion` - the question/editor in the cell. You may customize it, change it's properties, like choices or visible.
    * <br/> `options.rowValue` - the value of the current row. To access a particular column's value within the current row, use: `options.rowValue["columnValue"]`.
    * <br/> `options.column` - the matrix column object.
    * <br/> `options.columnName` - the matrix column name.
    * <br/> `options.row` - the matrix row object.
    * @see onMatrixBeforeRowAdded
    * @see onMatrixCellCreating
    * @see onMatrixRowAdded
    * @see QuestionMatrixDynamicModel
    * @see QuestionMatrixDropdownModel
    */
  public onMatrixCellCreated: EventBase<SurveyModel> = this.addEvent<
    SurveyModel
  >();
  /**
   * The event is fired for every cell after is has been rendered in DOM.
   * <br/> `sender` - the survey object that fires the event.
   * <br/> `options.question` - the matrix question.
   * <br/> `options.cell` - the matrix cell.
   * <br/> `options.cellQuestion` - the question/editor in the cell.
   * <br/> `options.htmlElement` - an HTML element bound to the `cellQuestion` object.
   * <br/> `options.column` - the matrix column object.
   * <br/> `options.row` - the matrix row object.
   * @see onMatrixCellCreated
   * @see QuestionMatrixDynamicModel
   * @see QuestionMatrixDropdownModel
   */
  public onMatrixAfterCellRender: EventBase<SurveyModel> = this.addEvent<
    SurveyModel
  >();
  /**
   * The event is fired when cell value is changed in Matrix Dynamic and Matrix Dropdown questions.
   * <br/> `sender` - the survey object that fires the event.
   * <br/> `options.question` - the matrix question.
   * <br/> `options.columnName` - the matrix column name.
   * <br/> `options.value` - a new value.
   * <br/> `options.row` - the matrix row object.
   * <br/> `options.getCellQuestion(columnName)` - the function that returns the cell question by column name.
   * @see onMatrixCellValueChanging
   * @see onMatrixBeforeRowAdded
   * @see onMatrixRowAdded
   * @see QuestionMatrixDynamicModel
   * @see QuestionMatrixDropdownModel
   */
  public onMatrixCellValueChanged: EventBase<SurveyModel> = this.addEvent<
    SurveyModel
  >();
  /**
   * The event is fired on changing cell value in Matrix Dynamic and Matrix Dropdown questions. You may change the `options.value` property to change a cell value.
   * <br/> `sender` - the survey object that fires the event.
   * <br/> `options.question` - the matrix question.
   * <br/> `options.columnName` - the matrix column name.
   * <br/> `options.value` - a new value.
   * <br/> `options.oldValue` - the old value.
   * <br/> `options.row` - the matrix row object.
   * <br/> `options.getCellQuestion(columnName)` - the function that returns a cell question by column name.
   * @see onMatrixCellValueChanged
   * @see onMatrixBeforeRowAdded
   * @see onMatrixRowAdded
   * @see QuestionMatrixDynamicModel
   * @see QuestionMatrixDropdownModel
   */
  public onMatrixCellValueChanging: EventBase<SurveyModel> = this.addEvent<
    SurveyModel
  >();
  /**
   * The event is fired when Matrix Dynamic and Matrix Dropdown questions validate the cell value.
   * <br/> `sender` - the survey object that fires the event.
   * <br/> `options.error` - an error string. It is empty by default.
   * <br/> `options.question` - the matrix question.
   * <br/> `options.columnName` - the matrix column name.
   * <br/> `options.value` - a cell value.
   * <br/> `options.row` - the matrix row object.
   * <br/> `options.getCellQuestion(columnName)` - the function that returns the cell question by column name.
   * @see onMatrixBeforeRowAdded
   * @see onMatrixRowAdded
   * @see QuestionMatrixDynamicModel
   * @see QuestionMatrixDropdownModel
   */
  public onMatrixCellValidate: EventBase<SurveyModel> = this.addEvent<
    SurveyModel
  >();
  /**
   * The event is fired on adding a new panel in Panel Dynamic question.
   * <br/> `sender` - the survey object that fires the event.
   * <br/> `options.question` - a panel question.
   * <br/> `options.panel` - an added panel.
   * @see QuestionPanelDynamicModel
   * @see QuestionPanelDynamicModel.panels
   */
  public onDynamicPanelAdded: EventBase<SurveyModel> = this.addEvent<
    SurveyModel
  >();
  /**
   * The event is fired on removing a panel from Panel Dynamic question.
   * <br/> `sender` - the survey object that fires the event.
   * <br/> `options.question` - a panel question.
   * <br/> `options.panelIndex` - a removed panel index.
   * <br/> `options.panel` - a removed panel.
   * @see QuestionPanelDynamicModel
   * @see QuestionPanelDynamicModel.panels
   */
  public onDynamicPanelRemoved: EventBase<SurveyModel> = this.addEvent<
    SurveyModel
  >();
  /**
   * The event is fired every second if the method `startTimer` has been called.
   * @see startTimer
   * @see timeSpent
   * @see Page.timeSpent
   */
  public onTimer: EventBase<SurveyModel> = this.addEvent<SurveyModel>();
  /**
   * The event is fired before displaying a new information in the Timer Panel. Use it to change the default text.
   * <br/> `sender` - the survey object that fires the event.
   * <br/> `options.text` - the timer panel info text.
   */
  public onTimerPanelInfoText: EventBase<SurveyModel> = this.addEvent<
    SurveyModel
  >();
  /**
   * The event is fired when item value is changed in Panel Dynamic question.
   * <br/> `sender` - the survey object that fires the event.
   * <br/> `options.question` - the panel question.
   * <br/> `options.panel` - the dynamic panel item.
   * <br/> `options.name` - the item name.
   * <br/> `options.value` - a new value.
   * <br/> `options.itemIndex` - the panel item index.
   * <br/> `options.itemValue` - the panel item object.
   * @see onDynamicPanelAdded
   * @see QuestionPanelDynamicModel
   */
  public onDynamicPanelItemValueChanged: EventBase<SurveyModel> = this.addEvent<
    SurveyModel
  >();
  /**
   * Use this event to define, whether an answer to a question is correct or not.
   * <br/> `sender` - the survey object that fires the event.
   * <br/> `options.question` - a question on which you have to decide if the answer is correct or not.
   * <br/> `options.result` - returns `true`, if an answer is correct, or `false`, if the answer is not correct. Use questions' `value` and `correctAnswer` properties to return the correct value.
   * <br/> `options.correctAnswers` - you may change the default number of correct or incorrect answers in the question, for example for matrix, where each row is a quiz question.
   * @see Question.value
   * @see Question.correctAnswer
   */
  public onIsAnswerCorrect: EventBase<SurveyModel> = this.addEvent<
    SurveyModel
  >();
  /**
   * Use this event to control drag&drop operations during design mode.
   * <br/> `sender` - the survey object that fires the event.
   * <br/> `options.allow` - set it to `false` to disable dragging.
   * <br/> `options.target` - a target element that is dragged.
   * <br/> `options.source` - a source element. It can be `null`, if it is a new element, dragging from toolbox.
   * <br/> `options.parent` - a page or panel where target element is dragging.
   * <br/> `options.insertBefore` - an element before the target element is dragging. It can be `null` if parent container (page or panel) is empty or dragging an element after the last element in a container.
   * <br/> `options.insertAfter` - an element after the target element is dragging. It can be `null` if parent container (page or panel) is empty or dragging element to the first position within the parent container.
   * @see setDesignMode
   * @see isDesignMode
   */
  public onDragDropAllow: EventBase<SurveyModel> = this.addEvent<SurveyModel>();
  /**
   * Use this event to control scrolling element to top. You can cancel the default behavior by setting options.cancel property to true.
   * <br/> `sender` - the survey object that fires the event.
   * <br/> `options.element` - an element that is going to be scrolled on top.
   * <br/> `options.question` - a question that is going to be scrolled on top. It can be null if options.page is not null.
   * <br/> `options.page` - a page that is going to be scrolled on top. It can be null if options.question is not null.
   * <br/> `options.elementId` - the unique element DOM Id.
   * <br/> `options.cancel` - set this property to true to cancel the default scrolling.
   */
  public onScrollingElementToTop: EventBase<SurveyModel> = this.addEvent<
    SurveyModel
  >();

  public onLocaleChangedEvent: EventBase<SurveyModel> = this.addEvent<
    SurveyModel
  >();

  /**
   * Use this event to create/customize actions to be displayed in a question's title.
   * <br/> `sender` - A [Survey](https://surveyjs.io/Documentation/Library?id=SurveyModel) object that fires the event.
   * <br/> `options.question` - A [Question](https://surveyjs.io/Documentation/Library?id=Question) object for which the event is fired.
   * <br/> `options.titleActions` - A list of actions ([IAction](https://surveyjs.io/Documentation/Library?id=IAction) objects) associated with the processed question.
   * @see IAction
   * @see Question
   */
  public onGetQuestionTitleActions: EventBase<SurveyModel> = this.addEvent<
    SurveyModel
  >();
  /**
   * Use this event to create/customize actions to be displayed in a panel's title.
   * <br/> `sender` - A survey object that fires the event.
   * <br/> `options.panel` - A panel ([PanelModel](https://surveyjs.io/Documentation/Library?id=panelmodel) object) for which the event is fired.
   * <br/> `options.titleActions` - A list of actions ([IAction](https://surveyjs.io/Documentation/Library?id=IAction) objects) associated with the processed panel.
   * @see IAction
   * @see PanelModel
   */
  public onGetPanelTitleActions: EventBase<SurveyModel> = this.addEvent<
    SurveyModel
  >();
  /**
   * Use this event to create/customize actions to be displayed in a page's title.
   * <br/> `sender` - A survey object that fires the event.
   * <br/> `options.page` - A page ([PageModel](https://surveyjs.io/Documentation/Library?id=pagemodel) object) for which the event is fired.
   * <br/> `options.titleActions` - A list of actions ([IAction](https://surveyjs.io/Documentation/Library?id=IAction) objects) associated with the processed page.
   * @see IAction
   * @see PageModel
   */
  public onGetPageTitleActions: EventBase<SurveyModel> = this.addEvent<
    SurveyModel
  >();
  /**
   * Use this event to create/customize actions to be displayed in a matrix question's row.
   * <br/> `sender` - A survey object that fires the event.
   * <br/> `options.question` - A matrix question ([QuestionMatrixBaseModel](https://surveyjs.io/Documentation/Library?id=questionmatrixbasemodel) object) for which the event is fired.
   * <br/> `options.row` - A matrix row for which the event is fired.
   * <br/> `options.actions` - A list of actions ([IAction](https://surveyjs.io/Documentation/Library?id=IAction) objects) associated with the processed matrix question and row.
   * @see IAction
   * @see QuestionMatrixDropdownModelBase
   */
  public onGetMatrixRowActions: EventBase<SurveyModel> = this.addEvent<
    SurveyModel
  >();
  /**
   * The event is fired after the survey element content was collapsed or expanded.
   * <br/> `sender` - the survey object that fires the event.
   * <br/> `options.element` - Specifies which survey element content was collapsed or expanded.
   * @see onElementContentVisibilityChanged
   */
  public onElementContentVisibilityChanged: EventBase<
    SurveyModel
  > = this.addEvent<SurveyModel>();

  /**
   * The event is fired before expression question convert it's value into display value for rendering.
   * <br/> `sender` - the survey object that fires the event.
   * <br/> `options.question` - The expression question.
   * <br/> `options.value` - The question value.
   * <br/> `options.displayValue` - the display value that you can change before rendering.
   */
  public onGetExpressionDisplayValue: EventBase<SurveyModel> = this.addEvent<
    SurveyModel
  >();

  //#endregion

  constructor(jsonObj: any = null, renderedElement: any = null) {
    super();
    if (typeof document !== "undefined") {
      SurveyModel.stylesManager = new StylesManager();
    }
    this.createLocalizableString("logo", this, false);
    this.createLocalizableString("completedHtml", this);
    this.createLocalizableString("completedBeforeHtml", this);
    this.createLocalizableString("loadingHtml", this);
    this.createLocalizableString("startSurveyText", this, false, true);
    this.createLocalizableString("pagePrevText", this, false, true);
    this.createLocalizableString("pageNextText", this, false, true);
    this.createLocalizableString("completeText", this, false, true);
    this.createLocalizableString("previewText", this, false, true);
    this.createLocalizableString("editText", this, false, true);
    this.createLocalizableString("questionTitleTemplate", this, true);

    this.textPreProcessor = new TextPreProcessor();
    this.textPreProcessor.onProcess = (textValue: TextPreProcessorValue) => {
      this.getProcessedTextValue(textValue);
    };
    this.timerModelValue = new SurveyTimerModel(this);
    this.timerModelValue.onTimer = (page: PageModel): void => {
      this.doTimer(page);
    };
    this.createNewArray(
      "pages",
      (value: any) => {
        this.doOnPageAdded(value);
      },
      (value: any) => {
        this.doOnPageRemoved(value);
      }
    );
    this.createNewArray("triggers", (value: any) => {
      value.setOwner(this);
    });
    this.createNewArray("calculatedValues", (value: any) => {
      value.setOwner(this);
    });
    this.createNewArray("completedHtmlOnCondition", (value: any) => {
      value.locOwner = this;
    });
    this.createNewArray("navigateToUrlOnCondition", (value: any) => {
      value.locOwner = this;
    });
    this.registerFunctionOnPropertyValueChanged("firstPageIsStarted", () => {
      this.onFirstPageIsStartedChanged();
    });
    this.registerFunctionOnPropertyValueChanged("mode", () => {
      this.onModeChanged();
    });
    this.registerFunctionOnPropertyValueChanged("progressBarType", () => {
      this.updateProgressText();
    });
    this.registerFunctionOnPropertiesValueChanged(
      ["questionStartIndex", "requiredText", "questionTitlePattern"],
      () => {
        this.resetVisibleIndexes();
      }
    );
    this.registerFunctionOnPropertiesValueChanged(
      ["isLoading", "isCompleted", "isCompletedBefore", "mode", "isStartedState", "currentPage"],
      () => { this.updateState(); });
    this.registerFunctionOnPropertiesValueChanged(["state", "currentPage", "showPreviewBeforeComplete"],
      () => { this.onStateAndCurrentPageChanged(); });

    this.onGetQuestionNo.onCallbacksChanged = () => {
      this.resetVisibleIndexes();
    };
    this.onProgressText.onCallbacksChanged = () => {
      this.updateProgressText();
    };
    this.onTextMarkdown.onCallbacksChanged = () => {
      this.locStrsChanged();
    };
    this.onGetQuestionTitle.onCallbacksChanged = () => {
      this.locStrsChanged();
    };
    this.onUpdatePageCssClasses.onCallbacksChanged = () => {
      this.currentPage && this.currentPage.updateElementCss();
    };
    this.onUpdatePanelCssClasses.onCallbacksChanged = () => {
      this.currentPage && this.currentPage.updateElementCss();
    };
    this.onUpdateQuestionCssClasses.onCallbacksChanged = () => {
      this.currentPage && this.currentPage.updateElementCss();
    };
    this.onShowingChoiceItem.onCallbacksChanged = () => {
      this.rebuildQuestionChoices();
    };
    this.onBeforeCreating();
    if (jsonObj) {
      if (typeof jsonObj === "string" || jsonObj instanceof String) {
        jsonObj = JSON.parse(jsonObj as string);
      }
      if (jsonObj && jsonObj.clientId) {
        this.clientId = jsonObj.clientId;
      }
      this.fromJSON(jsonObj);
      if (this.surveyId) {
        this.loadSurveyFromService(this.surveyId, this.clientId);
      }
    }
    this.onCreating();
    if(!!renderedElement) {
      this.render(renderedElement);
    }
  }

  /**
   * The list of errors on loading survey JSON. If the list is empty after loading a JSON, then the JSON is correct and has no errors.
   * @see JsonError
   */
  public jsonErrors: Array<JsonError> = null;

  public getType(): string {
    return "survey";
  }
  protected onPropertyValueChanged(name: string, oldValue: any, newValue: any) {
    if (name === "questionsOnPageMode") {
      this.onQuestionsOnPageModeChanged(oldValue);
    }
  }

  /**
   * Returns a list of all pages in the survey, including invisible pages.
   * @see PageModel
   * @see visiblePages
   */
  public get pages(): Array<PageModel> {
    return this.getPropertyValue("pages");
  }
  renderCallback: () => void;
  public render(element: any = null): void {
    if (this.renderCallback) {
      this.renderCallback();
    }
  }
  public updateSurvey(newProps: any, oldProps?: any) {
    for (var key in newProps) {
      if (key == "model" || key == "children") continue;
      if (key.indexOf("on") == 0 && this[key] && this[key].add) {
        let funcBody = newProps[key];
        let func = function (sender: any, options: any) {
          funcBody(sender, options);
        };
        this[key].add(func);
      } else {
        this[key] = newProps[key];
      }
    }

    if (newProps && newProps.data)
      this.onValueChanged.add((sender, options) => {
        newProps.data[options.name] = options.value;
      });
  }
  public getCss(): any {
    return this.css;
  }
  private cssValue: any = null;
  public get css(): any {
    if (!this.cssValue) {
      this.cssValue = {};
      this.copyCssClasses(this.cssValue, surveyCss.getCss());
    }
    return this.cssValue;
  }
  public set css(value: any) {
    this.mergeValues(value, this.css);
    this.updateElementCss(false);
  }
  public get cssTitle(): string {
    return this.css.title;
  }
  public get cssNavigationComplete() {
    return this.getNavigationCss(
      this.css.navigationButton,
      this.css.navigation.complete
    );
  }
  public get cssNavigationPreview() {
    return this.getNavigationCss(
      this.css.navigationButton,
      this.css.navigation.preview
    );
  }
  public get cssNavigationEdit() {
    return this.getNavigationCss(
      this.css.navigationButton,
      this.css.navigation.edit
    );
  }
  public get cssNavigationPrev() {
    return this.getNavigationCss(
      this.css.navigationButton,
      this.css.navigation.prev
    );
  }
  public get cssNavigationStart() {
    return this.getNavigationCss(
      this.css.navigationButton,
      this.css.navigation.start
    );
  }
  public get cssNavigationNext() {
    return this.getNavigationCss(
      this.css.navigationButton,
      this.css.navigation.next
    );
  }
  public get bodyCss(): string {
    return new CssClassBuilder().append(this.css.body)
      .append(this.css.body + "--" + this.calculateWidthMode()).toString();
  }
  public get completedCss(): string {
    return new CssClassBuilder().append(this.css.body)
      .append(this.css.completedPage).toString();
  }
  public get completedStateCss(): string {
    return this.getPropertyValue("completedStateCss", "");
  }
  public getCompletedStateCss(): string {
    return new CssClassBuilder().append(this.css.saveData[this.completedState], this.completedState !== "").toString();
  }
  private getNavigationCss(main: string, btn: string) {
    return new CssClassBuilder().append(main)
      .append(btn).toString();
  }
  private lazyRenderingValue: boolean;
  /**
   * By default all rows are rendered no matters if they are visible or not.
   * Set it true, and survey markup rows will be rendered only if they are visible in viewport.
   * This feature is experimantal and might do not support all the use cases.
   */
  public get lazyRendering(): boolean {
    return this.lazyRenderingValue === true;
  }
  public set lazyRendering(val: boolean) {
    if (this.lazyRendering === val) return;
    this.lazyRenderingValue = val;
    const page: PageModel = this.currentPage;
    if (!!page) {
      page.updateRows();
    }
  }
  public get isLazyRendering(): boolean {
    return this.lazyRendering || settings.lazyRowsRendering;
  }
  private updateLazyRenderingRowsOnRemovingElements() {
    if (!this.isLazyRendering) return;
    var page = this.currentPage;
    if (!!page) {
      scrollElementByChildId(page.id);
    }
  }
  /**
   * Gets or sets a list of triggers in the survey.
   * @see SurveyTrigger
   */
  public get triggers(): Array<SurveyTrigger> {
    return this.getPropertyValue("triggers");
  }
  public set triggers(val: Array<SurveyTrigger>) {
    this.setPropertyValue("triggers", val);
  }
  /**
   * Gets or sets a list of calculated values in the survey.
   * @see CalculatedValue
   */
  public get calculatedValues(): Array<CalculatedValue> {
    return this.getPropertyValue("calculatedValues");
  }
  public set calculatedValues(val: Array<CalculatedValue>) {
    this.setPropertyValue("calculatedValues", val);
  }
  /**
   * Gets or sets an identifier of a survey model loaded from the [api.surveyjs.io](https://api.surveyjs.io) service. When specified, the survey JSON is automatically loaded from [api.surveyjs.io](https://api.surveyjs.io) service.
   * @see loadSurveyFromService
   * @see onLoadedSurveyFromService
   */
  public get surveyId(): string {
    return this.getPropertyValue("surveyId", "");
  }
  public set surveyId(val: string) {
    this.setPropertyValue("surveyId", val);
  }
  /**
   * Gets or sets an identifier of a survey model saved to the [api.surveyjs.io](https://api.surveyjs.io) service. When specified, the survey data is automatically saved to the [api.surveyjs.io](https://api.surveyjs.io) service.
   * @see onComplete
   * @see surveyShowDataSaving
   */
  public get surveyPostId(): string {
    return this.getPropertyValue("surveyPostId", "");
  }
  public set surveyPostId(val: string) {
    this.setPropertyValue("surveyPostId", val);
  }
  /**
   * Gets or sets user's identifier (e.g., e-mail or unique customer id) in your web application.
   * If you load survey or post survey results from/to [api.surveyjs.io](https://api.surveyjs.io) service, then the library do not allow users to run the same survey the second time.
   * On the second run, the user will see the survey complete page.
   */
  public get clientId(): string {
    return this.getPropertyValue("clientId", "");
  }
  public set clientId(val: string) {
    this.setPropertyValue("clientId", val);
  }
  /**
   * Gets or sets a cookie name used to save information about completing the survey.
   * If the property is not empty, before starting the survey, the Survey library checks if the cookie with this name exists.
   * If it is `true`, the survey goes to complete mode and a user sees the survey complete page. On completing the survey the cookie with this name is created.
   */
  public get cookieName(): string {
    return this.getPropertyValue("cookieName", "");
  }
  public set cookieName(val: string) {
    this.setPropertyValue("cookieName", val);
  }
  /**
   * Gets or sets whether to save survey results on completing every page. If the property value is set to `true`, the `onPartialSend` event is fired.
   * @see onPartialSend
   * @see clientId
   */
  public get sendResultOnPageNext(): boolean {
    return this.getPropertyValue("sendResultOnPageNext", false);
  }
  public set sendResultOnPageNext(val: boolean) {
    this.setPropertyValue("sendResultOnPageNext", val);
  }
  /**
   * Gets or sets whether to show the progress on saving/sending data into the [api.surveyjs.io](https://api.surveyjs.io) service.
   * @see surveyPostId
   */
  public get surveyShowDataSaving(): boolean {
    return this.getPropertyValue("surveyShowDataSaving", false);
  }
  public set surveyShowDataSaving(val: boolean) {
    this.setPropertyValue("surveyShowDataSaving", val);
  }
  /**
   * Gets or sets whether the first input is focused on showing a next or a previous page.
   */
  public get focusFirstQuestionAutomatic(): boolean {
    return this.getPropertyValue("focusFirstQuestionAutomatic");
  }
  public set focusFirstQuestionAutomatic(val: boolean) {
    this.setPropertyValue("focusFirstQuestionAutomatic", val);
  }
  /**
   * Gets or sets whether the first input is focused if the current page has errors.
   * Set this property to `false` (the default value is `true`) if you do not want to bring the focus to the first question that has error on the page.
   */
  public get focusOnFirstError(): boolean {
    return this.getPropertyValue("focusOnFirstError");
  }
  public set focusOnFirstError(val: boolean) {
    this.setPropertyValue("focusOnFirstError", val);
  }
  /**
   * Gets or sets the navigation buttons position.
   * Possible values: 'bottom' (default), 'top', 'both' and 'none'. Set it to 'none' to hide 'Prev', 'Next' and 'Complete' buttons.
   * It makes sense if you are going to create a custom navigation, have only a single page, or the `goNextPageAutomatic` property is set to `true`.
   * @see goNextPageAutomatic
   * @see showPrevButton
   */
  public get showNavigationButtons(): string | any {
    return this.getPropertyValue("showNavigationButtons");
  }
  public set showNavigationButtons(val: string | any) {
    if (val === true || val === undefined) {
      val = "bottom";
    }
    if (val === false) {
      val = "none";
    }
    this.setPropertyValue("showNavigationButtons", val);
  }
  /**
   * Gets or sets whether the Survey displays "Prev" button in its pages. Set it to `false` to prevent end-users from going back to their answers.
   * @see showNavigationButtons
   */
  public get showPrevButton(): boolean {
    return this.getPropertyValue("showPrevButton");
  }
  public set showPrevButton(val: boolean) {
    this.setPropertyValue("showPrevButton", val);
  }
  /**
   * Gets or sets whether the Survey displays survey title in its pages. Set it to `false` to hide a survey title.
   * @see title
   */
  public get showTitle(): boolean {
    return this.getPropertyValue("showTitle");
  }
  public set showTitle(val: boolean) {
    this.setPropertyValue("showTitle", val);
  }
  /**
   * Gets or sets whether the Survey displays page titles. Set it to `false` to hide page titles.
   * @see PageModel.title
   */
  public get showPageTitles(): boolean {
    return this.getPropertyValue("showPageTitles");
  }
  public set showPageTitles(val: boolean) {
    this.setPropertyValue("showPageTitles", val);
  }
  /**
   * On finishing the survey the complete page is shown. Set the property to `false`, to hide the complete page.
   * @see data
   * @see onComplete
   * @see navigateToUrl
   */
  public get showCompletedPage(): boolean {
    return this.getPropertyValue("showCompletedPage");
  }
  public set showCompletedPage(val: boolean) {
    this.setPropertyValue("showCompletedPage", val);
  }
  /**
   * Set this property to a url you want to navigate after a user completing the survey.
   * By default it uses after calling onComplete event. In case calling options.showDataSaving callback in onComplete event, navigateToUrl will be used on calling options.showDataSavingSuccess callback.
   */
  public get navigateToUrl(): string {
    return this.getPropertyValue("navigateToUrl");
  }
  public set navigateToUrl(val: string) {
    this.setPropertyValue("navigateToUrl", val);
  }
  /**
   * Gets or sets a list of URL condition items. If the expression of this item returns `true`, then survey will navigate to the item URL.
   * @see UrlConditionItem
   * @see navigateToUrl
   */
  public get navigateToUrlOnCondition(): Array<UrlConditionItem> {
    return this.getPropertyValue("navigateToUrlOnCondition");
  }
  public set navigateToUrlOnCondition(val: Array<UrlConditionItem>) {
    this.setPropertyValue("navigateToUrlOnCondition", val);
  }

  public getNavigateToUrl(): string {
    var item = this.getExpressionItemOnRunCondition(
      this.navigateToUrlOnCondition
    );
    var url = !!item ? (<UrlConditionItem>item).url : this.navigateToUrl;
    if (!!url) {
      url = this.processText(url, true);
    }
    return url;
  }
  private navigateTo() {
    var url = this.getNavigateToUrl();
    var options = { url: url };
    this.onNavigateToUrl.fire(this, options);
    if (!options.url || typeof window === "undefined" || !window.location)
      return;
    window.location.href = options.url;
  }
  /**
   * Gets or sets the required question mark. The required question mark is a char or string that is rendered in the required questions' titles.
   * @see Question.title
   */
  public get requiredText(): string {
    return this.getPropertyValue("requiredText", "*");
  }
  public set requiredText(val: string) {
    this.setPropertyValue("requiredText", val);
  }
  /**
   * Gets or sets whether to hide all required errors.
   */
  public hideRequiredErrors: boolean = false;
  beforeSettingQuestionErrors(
    question: IQuestion,
    errors: Array<SurveyError>
  ): void {
    this.maakeRequiredErrorsInvisibgle(errors);
    this.onSettingQuestionErrors.fire(this, {
      question: question,
      errors: errors,
    });
  }
  beforeSettingPanelErrors(question: IPanel, errors: Array<SurveyError>): void {
    this.maakeRequiredErrorsInvisibgle(errors);
  }
  private maakeRequiredErrorsInvisibgle(errors: Array<SurveyError>) {
    if (!this.hideRequiredErrors) return;
    for (var i = 0; i < errors.length; i++) {
      var erType = errors[i].getErrorType();
      if (erType == "required" || erType == "requireoneanswer") {
        errors[i].visible = false;
      }
    }
  }
  /**
   * Gets or sets the first question index. The first question index is '1' by default. You may start it from '100' or from 'A', by setting '100' or 'A' to this property.
   * You can set the start index to "(1)" or "# A)" or "a)" to render question number as (1), # A) and a) accordingly.
   * @see Question.title
   * @see requiredText
   */
  public get questionStartIndex(): string {
    return this.getPropertyValue("questionStartIndex", "");
  }
  public set questionStartIndex(val: string) {
    this.setPropertyValue("questionStartIndex", val);
  }
  /**
   * Gets or sets whether the "Others" option text is stored as question comment.
   *
   * By default the entered text in the "Others" input in the checkbox/radiogroup/dropdown is stored as `"question name " + "-Comment"`. The value itself is `"question name": "others"`.
   * Set this property to `false`, to store the entered text directly in the `"question name"` key.
   * @see commentPrefix
   */
  public get storeOthersAsComment(): boolean {
    return this.getPropertyValue("storeOthersAsComment");
  }
  public set storeOthersAsComment(val: boolean) {
    this.setPropertyValue("storeOthersAsComment", val);
  }
  /**
   * Specifies the default maximum length for questions like text and comment, including matrix cell questions.
   *
   * The default value is `0`, that means that the text and comment have the same max length as the standard HTML input - 524288 characters: https://www.w3schools.com/tags/att_input_maxlength.asp.
   * @see maxOthersLength
   */
  public get maxTextLength(): number {
    return this.getPropertyValue("maxTextLength");
  }
  public set maxTextLength(val: number) {
    this.setPropertyValue("maxTextLength", val);
  }
  /**
   * Gets or sets the default maximum length for question comments and others
   *
   * The default value is `0`, that means that the question comments have the same max length as the standard HTML input - 524288 characters: https://www.w3schools.com/tags/att_input_maxlength.asp.
   * @see Question.hasComment
   * @see Question.hasOther
   * @see maxTextLength
   */
  public get maxOthersLength(): number {
    return this.getPropertyValue("maxOthersLength");
  }
  public set maxOthersLength(val: number) {
    this.setPropertyValue("maxOthersLength", val);
  }

  /**
   * Gets or ses whether a user can navigate the next page automatically after answering all the questions on a page without pressing the "Next" button.
   * The available options:
   *
   * - `true` - navigate the next page and submit survey data automatically.
   * - `autogonext` - navigate the next page automatically but do not submit survey data.
   * - `false` - do not navigate the next page and do not submit survey data automatically.
   * @see showNavigationButtons
   */
  public get goNextPageAutomatic(): boolean | "autogonext" {
    return this.getPropertyValue("goNextPageAutomatic", false);
  }
  public set goNextPageAutomatic(val: boolean | "autogonext") {
    this.setPropertyValue("goNextPageAutomatic", val);
  }
  /**
   * Gets or sets whether a survey is automatically completed when `goNextPageAutomatic = true`. Set it to `false` if you do not want to submit survey automatically on completing the last survey page.
   * @see goNextPageAutomatic
   */
  public get allowCompleteSurveyAutomatic(): boolean {
    return this.getPropertyValue("allowCompleteSurveyAutomatic", true);
  }
  public set allowCompleteSurveyAutomatic(val: boolean) {
    this.setPropertyValue("allowCompleteSurveyAutomatic", val);
  }
  /**
   * Gets or sets a value that specifies how the survey validates the question answers.
   *
   * The following options are available:
   *
   * - `onNextPage` (default) - check errors on navigating to the next page or on completing the survey.
   * - `onValueChanged` - check errors on every question value (i.e., answer) changing.
   * - `onValueChanging` - check errors before setting value into survey. If there is an error, then survey data is not changed, but question value will be keeped.
   * - `onComplete` - to validate all visible questions on complete button click. If there are errors on previous pages, then the page with the first error becomes the current.
   */
  public get checkErrorsMode(): string {
    return this.getPropertyValue("checkErrorsMode");
  }
  public set checkErrorsMode(val: string) {
    this.setPropertyValue("checkErrorsMode", val);
  }
  /**
   * Specifies whether the text area of [comment](https://surveyjs.io/Documentation/Library?id=questioncommentmodel) questions/elements automatically expands its height to avoid the vertical scrollbar and to display the entire multi-line contents entered by respondents.
   * Default value is false.
   * @see QuestionCommentModel.autoGrow
   */
  public get autoGrowComment(): boolean {
    return this.getPropertyValue("autoGrowComment");
  }
  public set autoGrowComment(val: boolean) {
    this.setPropertyValue("autoGrowComment", val);
  }
  /**
   * Gets or sets a value that specifies how the survey updates its questions' text values.
   *
   * The following options are available:
   *
   * - `onBlur` (default) - the value is updated after an input loses the focus.
   * - `onTyping` - update the value of text questions, "text" and "comment", on every key press.
   *
   * Note, that setting to "onTyping" may lead to a performance degradation, in case you have many expressions in the survey.
   */
  public get textUpdateMode(): string {
    return this.getPropertyValue("textUpdateMode");
  }
  public set textUpdateMode(val: string) {
    this.setPropertyValue("textUpdateMode", val);
  }
  /**
   * Gets or sets a value that specifies how the invisible data is included in survey data.
   *
   * The following options are available:
   *
   * - `none` - include the invisible values into the survey data.
   * - `onHidden` - clear the question value when it becomes invisible. If a question has value and it was invisible initially then survey clears the value on completing.
   * - `onHiddenContainer` - clear the question value when it or its parent (page or panel) becomes invisible. If a question has value and it was invisible initially then survey clears the value on completing.
   * - `onComplete` (default) - clear invisible question values on survey complete. In this case, the invisible questions will not be stored on the server.
   * @see Question.visible
   * @see onComplete
   */
  public get clearInvisibleValues(): any {
    return this.getPropertyValue("clearInvisibleValues");
  }
  public set clearInvisibleValues(val: any) {
    if (val === true) val = "onComplete";
    if (val === false) val = "none";
    this.setPropertyValue("clearInvisibleValues", val);
  }
  /**
   * Call this function to remove all question values from the survey, that end-user will not be able to enter.
   * For example the value that doesn't exists in a radiogroup/dropdown/checkbox choices or matrix rows/columns.
   * Please note, this function doesn't clear values for invisible questions or values that doesn't associated with questions.
   * In fact this function just call clearIncorrectValues function of all questions in the survey
   * @param removeNonExisingRootKeys - set this parameter to true to remove keys from survey.data that doesn't have corresponded questions and calculated values
   * @see Question.clearIncorrectValues
   * @see Page.clearIncorrectValues
   * @see Panel.clearIncorrectValues
   */
  public clearIncorrectValues(removeNonExisingRootKeys: boolean = false) {
    for (var i = 0; i < this.pages.length; i++) {
      this.pages[i].clearIncorrectValues();
    }
    if (!removeNonExisingRootKeys) return;
    var data = this.data;
    var hasChanges = false;
    for (var key in data) {
      if (!!this.getQuestionByValueName(key)) continue;
      if (
        this.iscorrectValueWithPostPrefix(key, settings.commentPrefix) ||
        this.iscorrectValueWithPostPrefix(key, settings.matrixTotalValuePostFix)
      )
        continue;
      var calcValue = this.getCalculatedValueByName(key);
      if (!!calcValue && calcValue.includeIntoResult) continue;
      hasChanges = true;
      delete data[key];
    }
    if (hasChanges) {
      this.data = data;
    }
  }
  private iscorrectValueWithPostPrefix(
    key: string,
    postPrefix: string
  ): boolean {
    if (key.indexOf(postPrefix) !== key.length - postPrefix.length)
      return false;
    return !!this.getQuestionByValueName(
      key.substr(0, key.indexOf(postPrefix))
    );
  }

  /**
   * Gets or sets the survey locale. The default value it is empty, this means the 'en' locale is used.
   * You can set it to 'de' - German, 'fr' - French and so on. The library has built-in localization for several languages. The library has a multi-language support as well.
   */
  public get locale(): string {
    return this.localeValue;
  }
  public set locale(value: string) {
    surveyLocalization.currentLocale = value;
    this.localeValue = surveyLocalization.currentLocale;
    this.setPropertyValue("locale", this.localeValue);
    if (this.isLoadingFromJson) return;
    this.notifyElementsOnAnyValueOrVariableChanged("locale");
    this.localeChanged();
    this.onLocaleChangedEvent.fire(this, value);
  }
  /**
   * Returns an array of locales that are used in the survey's translation.
   */
  public getUsedLocales(): Array<string> {
    var locs = new Array<string>();
    this.addUsedLocales(locs);
    //Replace the default locale with the real one
    var index = locs.indexOf("default");
    if (index > -1) {
      var defaultLoc = surveyLocalization.defaultLocale;
      //Remove the defaultLoc
      var defIndex = locs.indexOf(defaultLoc);
      if (defIndex > -1) {
        locs.splice(defIndex, 1);
      }
      index = locs.indexOf("default");
      locs[index] = defaultLoc;
    }
    return locs;
  }
  public localeChanged() {
    for (var i = 0; i < this.pages.length; i++) {
      this.pages[i].localeChanged();
    }
  }
  //ILocalizableOwner
  getLocale() {
    return this.locale;
  }
  public locStrsChanged() {
    super.locStrsChanged();
    if (!this.currentPage) return;
    this.updateProgressText();
    var page = this.activePage;
    if (!!page) {
      page.locStrsChanged();
    }
  }

  public getMarkdownHtml(text: string, name: string): string {
    return this.getSurveyMarkdownHtml(this, text, name);
  }
  public getRenderer(name: string): string {
    return this.getRendererForString(this, name);
  }
  public getRendererContext(locStr: LocalizableString) {
    return this.getRendererContextForString(this, locStr);
  }
  public getRendererForString(element: Base, name: string): string {
    const renderAs = this.getBuiltInRendererForString(element, name);
    var options = { element: element, name: name, renderAs: renderAs };
    this.onTextRenderAs.fire(this, options);
    return options.renderAs;
  }
  public getRendererContextForString(element: Base, locStr: LocalizableString) {
    return locStr;
  }
  getExpressionDisplayValue(
    question: IQuestion,
    value: any,
    displayValue: string
  ): string {
    const options = {
      question: question,
      value: value,
      displayValue: displayValue,
    };
    this.onGetExpressionDisplayValue.fire(this, options);
    return options.displayValue;
  }
  private getBuiltInRendererForString(element: Base, name: string): string {
    if (this.isDesignMode) return LocalizableString.editableRenderer;
    return undefined;
  }
  public getProcessedText(text: string) {
    return this.processText(text, true);
  }
  getLocString(str: string) {
    return surveyLocalization.getString(str);
  }
  //ISurveyErrorOwner
  getErrorCustomText(text: string, error: SurveyError): string {
    return this.getSurveyErrorCustomText(this, text, error);
  }
  getSurveyErrorCustomText(obj: Base, text: string, error: SurveyError): string {
    var options = {
      text: text,
      name: error.getErrorType(),
      obj: obj,
      error: error
    };
    this.onErrorCustomText.fire(this, options);
    return options.text;
  }
  /**
   * Returns the text that is displayed when there are no any visible pages and questiona.
   */
  public get emptySurveyText(): string {
    return this.getLocString("emptySurvey");
  }

  //#region Title/Header options
  /**
   * Gets or sets a survey logo.
   * @see title
   */
  public get logo(): string {
    return this.getLocalizableStringText("logo");
  }
  public set logo(value: string) {
    this.setLocalizableStringText("logo", value);
  }
  get locLogo(): LocalizableString {
    return this.getLocalizableString("logo");
  }
  /**
   * Gets or sets a survey logo width.
   * @see logo
   */
  public get logoWidth(): any {
    var width = this.getPropertyValue("logoWidth");
    return getSize(width);
  }
  public set logoWidth(value: any) {
    this.setPropertyValue("logoWidth", value);
  }
  /**
   * Gets or sets a survey logo height.
   * @see logo
   */
  public get logoHeight(): any {
    var height = this.getPropertyValue("logoHeight");
    return getSize(height);
  }
  public set logoHeight(value: any) {
    this.setPropertyValue("logoHeight", value);
  }
  /**
   * Gets or sets a survey logo position.
   * @see logo
   */
  public get logoPosition(): string {
    return this.getPropertyValue("logoPosition");
  }
  public set logoPosition(value: string) {
    this.setPropertyValue("logoPosition", value);
  }
  public get hasLogo() {
    return !!this.logo && this.logoPosition !== "none";
  }
  public get isLogoBefore() {
    if (this.isDesignMode) return false;
    return (
      this.renderedHasLogo &&
      (this.logoPosition === "left" || this.logoPosition === "top")
    );
  }
  public get isLogoAfter() {
    if (this.isDesignMode) return this.renderedHasLogo;
    return (
      this.renderedHasLogo &&
      (this.logoPosition === "right" || this.logoPosition === "bottom")
    );
  }
  public get logoClassNames(): string {
    const logoClasses: { [index: string]: string } = {
      left: "sv-logo--left",
      right: "sv-logo--right",
      top: "sv-logo--top",
      bottom: "sv-logo--bottom",
    };
    return new CssClassBuilder().append(this.css.logo)
      .append(logoClasses[this.logoPosition]).toString();
  }
  public get renderedHasTitle(): boolean {
    if (this.isDesignMode) return this.isPropertyVisible("title");
    return !this.locTitle.isEmpty && this.showTitle;
  }
  public get renderedHasDescription(): boolean {
    if (this.isDesignMode) return this.isPropertyVisible("description");
    return !!this.hasDescription;
  }
  public get hasTitle(): boolean {
    return this.renderedHasTitle;
  }
  public get renderedHasLogo(): boolean {
    if (this.isDesignMode) return this.isPropertyVisible("logo");
    return this.hasLogo;
  }
  public get renderedHasHeader(): boolean {
    return this.renderedHasTitle || this.renderedHasLogo;
  }
  /**
   * The logo fit mode.
   * @see logo
   */
  public get logoFit(): string {
    return this.getPropertyValue("logoFit");
  }
  public set logoFit(val: string) {
    this.setPropertyValue("logoFit", val);
  }
  //#endregion

  private _isMobile = false;
  public setIsMobile(newVal = true) {
    this._isMobile = newVal;
    this.getAllQuestions().map(q => q.isMobile = newVal);
  }
  private get isMobile() {
    return isMobile() || this._isMobile;
  }
  protected isLogoImageChoosen() {
    return this.locLogo.renderedHtml;
  }
  public get titleMaxWidth(): string {
    if (
      !this.isMobile &&
      !this.isValueEmpty(this.isLogoImageChoosen()) &&
      !settings.supportCreatorV2
    ) {
      var logoWidth = this.logoWidth;
      if (this.logoPosition === "left" || this.logoPosition === "right") {
        return "calc(100% - 5px - 2em - " + logoWidth + ")";
      }
    }
    return "";
  }
  /**
   * Gets or sets the HTML content displayed on the complete page. Use this property to change the default complete page text.
   * @see showCompletedPage
   * @see completedHtmlOnCondition
   * @see locale
   */
  public get completedHtml(): string {
    return this.getLocalizableStringText("completedHtml");
  }
  public set completedHtml(value: string) {
    this.setLocalizableStringText("completedHtml", value);
  }
  get locCompletedHtml(): LocalizableString {
    return this.getLocalizableString("completedHtml");
  }
  /**
   * The list of HTML condition items. If the expression of this item returns `true`, then a survey will use this item HTML instead of `completedHtml`.
   * @see HtmlConditionItem
   * @see completeHtml
   */
  public get completedHtmlOnCondition(): Array<HtmlConditionItem> {
    return this.getPropertyValue("completedHtmlOnCondition");
  }
  public set completedHtmlOnCondition(val: Array<HtmlConditionItem>) {
    this.setPropertyValue("completedHtmlOnCondition", val);
  }
  /**
   * Calculates a given expression and returns a result value.
   * @param expression
   */
  public runExpression(expression: string): any {
    if (!expression) return null;
    var values = this.getFilteredValues();
    var properties = this.getFilteredProperties();
    return new ExpressionRunner(expression).run(values, properties);
  }
  /**
   * Calculates a given expression and returns `true` or `false`.
   * @param expression
   */
  public runCondition(expression: string): boolean {
    if (!expression) return false;
    var values = this.getFilteredValues();
    var properties = this.getFilteredProperties();
    return new ConditionRunner(expression).run(values, properties);
  }
  /**
   * Run all triggers that performs on value changed and not on moving to the next page.
   */
  public runTriggers(): void {
    this.checkTriggers(this.getFilteredValues(), false);
  }
  public get renderedCompletedHtml(): string {
    var item = this.getExpressionItemOnRunCondition(
      this.completedHtmlOnCondition
    );
    return !!item ? (<HtmlConditionItem>item).html : this.completedHtml;
  }
  private getExpressionItemOnRunCondition(
    items: Array<ExpressionItem>
  ): ExpressionItem {
    if (items.length == 0) return null;
    var values = this.getFilteredValues();
    var properties = this.getFilteredProperties();
    for (var i = 0; i < items.length; i++) {
      if (items[i].runCondition(values, properties)) {
        return items[i];
      }
    }
    return null;
  }

  /**
   * The HTML content displayed to an end user that has already completed the survey.
   * @see clientId
   * @see locale
   */
  public get completedBeforeHtml(): string {
    return this.getLocalizableStringText("completedBeforeHtml");
  }
  public set completedBeforeHtml(value: string) {
    this.setLocalizableStringText("completedBeforeHtml", value);
  }
  get locCompletedBeforeHtml(): LocalizableString {
    return this.getLocalizableString("completedBeforeHtml");
  }
  /**
   * The HTML that shows on loading survey Json from the [api.surveyjs.io](https://api.surveyjs.io) service.
   * @see surveyId
   * @see locale
   */
  public get loadingHtml(): string {
    return this.getLocalizableStringText("loadingHtml");
  }
  public set loadingHtml(value: string) {
    this.setLocalizableStringText("loadingHtml", value);
  }
  get locLoadingHtml(): LocalizableString {
    return this.getLocalizableString("loadingHtml");
  }
  /**
   * Gets or sets the 'Start' button caption.
   * The 'Start' button is shown on the started page. Set the `firstPageIsStarted` property to `true`, to display the started page.
   * @see firstPageIsStarted
   * @see locale
   */
  public get startSurveyText(): string {
    return this.getLocalizableStringText("startSurveyText");
  }
  public set startSurveyText(newValue: string) {
    this.setLocalizableStringText("startSurveyText", newValue);
  }
  get locStartSurveyText(): LocalizableString {
    return this.getLocalizableString("startSurveyText");
  }
  /**
   * Gets or sets the 'Prev' button caption.
   * @see locale
   */
  public get pagePrevText(): string {
    return this.getLocalizableStringText("pagePrevText");
  }
  public set pagePrevText(newValue: string) {
    this.setLocalizableStringText("pagePrevText", newValue);
  }
  get locPagePrevText(): LocalizableString {
    return this.getLocalizableString("pagePrevText");
  }
  /**
   * Gets or sets the 'Next' button caption.
   * @see locale
   */
  public get pageNextText(): string {
    return this.getLocalizableStringText("pageNextText");
  }
  public set pageNextText(newValue: string) {
    this.setLocalizableStringText("pageNextText", newValue);
  }
  get locPageNextText(): LocalizableString {
    return this.getLocalizableString("pageNextText");
  }
  /**
   *  Gets or sets the 'Complete' button caption.
   * @see locale
   */
  public get completeText(): string {
    return this.getLocalizableStringText("completeText");
  }
  public set completeText(newValue: string) {
    this.setLocalizableStringText("completeText", newValue);
  }
  get locCompleteText(): LocalizableString {
    return this.getLocalizableString("completeText");
  }
  /**
   *  Gets or sets the 'Preview' button caption.
   * @see locale
   * @see showPreviewBeforeComplete
   * @see editText
   * @see showPreview
   */
  public get previewText(): string {
    return this.getLocalizableStringText("previewText");
  }
  public set previewText(newValue: string) {
    this.setLocalizableStringText("previewText", newValue);
  }
  get locPreviewText(): LocalizableString {
    return this.getLocalizableString("previewText");
  }
  /**
   *  Gets or sets the 'Edit' button caption.
   * @see locale
   * @see showPreviewBeforeComplete
   * @see previewText
   * @see cancelPreview
   */
  public get editText(): string {
    return this.getLocalizableStringText("editText");
  }
  public set editText(newValue: string) {
    this.setLocalizableStringText("editText", newValue);
  }
  get locEditText(): LocalizableString {
    return this.getLocalizableString("editText");
  }
  getElementTitleTagName(element: Base, tagName: string): string {
    if (this.onGetTitleTagName.isEmpty) return tagName;
    const options = { element: element, tagName: tagName };
    this.onGetTitleTagName.fire(this, options);
    return options.tagName;
  }
  /**
   * Set the pattern for question title. Default is "numTitleRequire", 1. What is your name? *,
   * You can set it to numRequireTitle: 1. * What is your name?
   * You can set it to requireNumTitle: * 1. What is your name?
   * You can set it to numTitle (remove require symbol completely): 1. What is your name?
   * @see QuestionModel.title
   */
  public get questionTitlePattern(): string {
    return this.getPropertyValue("questionTitlePattern", "numTitleRequire");
  }
  public set questionTitlePattern(val: string) {
    if (
      val !== "numRequireTitle" &&
      val !== "requireNumTitle" &&
      val != "numTitle"
    ) {
      val = "numTitleRequire";
    }
    this.setPropertyValue("questionTitlePattern", val);
  }
  getQuestionTitlePatternOptions(): Array<any> {
    const res = new Array<any>();
    const title = this.getLocString("questionTitlePatternText");
    const num = !!this.questionStartIndex ? this.questionStartIndex : "1.";
    res.push({
      value: "numTitleRequire",
      text: num + " " + title + " " + this.requiredText
    });
    res.push({
      value: "numRequireTitle",
      text: num + " " + this.requiredText + " " + title
    });
    res.push({
      value: "requireNumTitle",
      text: this.requiredText + " " + num + " " + title
    });
    res.push({
      value: "numTitle",
      text: num + " " + title
    });
    return res;
  }
  /**
   * Gets or sets a question title template. Obsolete, please use questionTitlePattern
   * @see QuestionModel.title
   * @see questionTitlePattern
   */
  public get questionTitleTemplate(): string {
    return this.getLocalizableStringText("questionTitleTemplate");
  }
  public set questionTitleTemplate(value: string) {
    this.setLocalizableStringText("questionTitleTemplate", value);
    this.questionTitlePattern = this.getNewTitlePattern(value);
    this.questionStartIndex = this.getNewQuestionTitleElement(
      value,
      "no",
      this.questionStartIndex,
      "1"
    );
    this.requiredText = this.getNewQuestionTitleElement(
      value,
      "require",
      this.requiredText,
      "*"
    );
  }
  private getNewTitlePattern(template: string): string {
    if (!!template) {
      var strs = [];
      while (template.indexOf("{") > -1) {
        template = template.substr(template.indexOf("{") + 1);
        var ind = template.indexOf("}");
        if (ind < 0) break;
        strs.push(template.substr(0, ind));
        template = template.substr(ind + 1);
      }
      if (strs.length > 1) {
        if (strs[0] == "require") return "requireNumTitle";
        if (strs[1] == "require" && strs.length == 3) return "numRequireTitle";
        if (strs.indexOf("require") < 0) return "numTitle";
      }
      if (strs.length == 1 && strs[0] == "title") {
        return "numTitle";
      }
    }
    return "numTitleRequire";
  }
  private getNewQuestionTitleElement(
    template: string,
    name: string,
    currentValue: string,
    defaultValue: string
  ): string {
    name = "{" + name + "}";
    if (!template || template.indexOf(name) < 0) return currentValue;
    var ind = template.indexOf(name);
    var prefix = "";
    var postfix = "";
    var i = ind - 1;
    for (; i >= 0; i--) {
      if (template[i] == "}") break;
    }
    if (i < ind - 1) {
      prefix = template.substr(i + 1, ind - i - 1);
    }
    ind += name.length;
    i = ind;
    for (; i < template.length; i++) {
      if (template[i] == "{") break;
    }
    if (i > ind) {
      postfix = template.substr(ind, i - ind);
    }
    i = 0;
    while (i < prefix.length && prefix.charCodeAt(i) < 33) i++;
    prefix = prefix.substr(i);
    i = postfix.length - 1;
    while (i >= 0 && postfix.charCodeAt(i) < 33) i--;
    postfix = postfix.substr(0, i + 1);
    if (!prefix && !postfix) return currentValue;
    var value = !!currentValue ? currentValue : defaultValue;
    return prefix + value + postfix;
  }
  get locQuestionTitleTemplate(): LocalizableString {
    return this.getLocalizableString("questionTitleTemplate");
  }
  getUpdatedQuestionTitle(question: IQuestion, title: string): string {
    if (this.onGetQuestionTitle.isEmpty) return title;
    var options = { question: question, title: title };
    this.onGetQuestionTitle.fire(this, options);
    return options.title;
  }
  getUpdatedQuestionNo(question: IQuestion, no: string): string {
    if (this.onGetQuestionNo.isEmpty) return no;
    var options = { question: question, no: no };
    this.onGetQuestionNo.fire(this, options);
    return options.no;
  }
  /**
   * Gets or sets whether the survey displays page numbers on pages titles.
   */
  public get showPageNumbers(): boolean {
    return this.getPropertyValue("showPageNumbers", false);
  }
  public set showPageNumbers(value: boolean) {
    if (value === this.showPageNumbers) return;
    this.setPropertyValue("showPageNumbers", value);
    this.updateVisibleIndexes();
  }
  /**
   * Gets or sets a value that specifies how the question numbers are displayed.
   *
   * The following options are available:
   *
   * - `on` - display question numbers
   * - `onpage` - display question numbers, start numbering on every page
   * - `off` - turn off the numbering for questions titles
   */
  public get showQuestionNumbers(): string {
    return this.getPropertyValue("showQuestionNumbers");
  }
  public set showQuestionNumbers(value: string) {
    value = value.toLowerCase();
    value = value === "onpage" ? "onPage" : value;
    if (value === this.showQuestionNumbers) return;
    this.setPropertyValue("showQuestionNumbers", value);
    this.updateVisibleIndexes();
  }
  /**
   * Gets or sets the survey progress bar position.
   *
   * The following options are available:
   *
   * - `off` (default) - don't show progress bar
   * - `top` - show progress bar in the top
   * - `bottom` - show progress bar in the bottom
   * - `both` - show progress bar in both sides: top and bottom.
   */
  public get showProgressBar(): string {
    return this.getPropertyValue("showProgressBar");
  }
  public set showProgressBar(newValue: string) {
    this.setPropertyValue("showProgressBar", newValue.toLowerCase());
  }
  /**
   * Gets or sets the type of info in the progress bar.
   *
   * The following options are available:
   *
   * - `pages` (default),
   * - `questions`,
   * - `requiredQuestions`,
   * - `correctQuestions`,
   * - `buttons`
   */
  public get progressBarType(): string {
    return this.getPropertyValue("progressBarType");
  }
  public set progressBarType(newValue: string) {
    if (newValue === "correctquestion") newValue = "correctQuestion";
    if (newValue === "requiredquestion") newValue = "requiredQuestion";
    this.setPropertyValue("progressBarType", newValue);
  }
  public get isShowProgressBarOnTop(): boolean {
    if (!this.canShowProresBar()) return false;
    return this.showProgressBar === "top" || this.showProgressBar === "both";
  }
  public get isShowProgressBarOnBottom(): boolean {
    if (!this.canShowProresBar()) return false;
    return this.showProgressBar === "bottom" || this.showProgressBar === "both";
  }
  private canShowProresBar(): boolean {
    return (
      !this.isShowingPreview ||
      this.showPreviewBeforeComplete != "showAllQuestions"
    );
  }
  /**
   * Returns the text/HTML that is rendered as a survey title.
   */
  public get processedTitle() {
    return this.locTitle.renderedHtml;
  }
  /**
   * Gets or sets the question title location.
   *
   * The following options are available:
   *
   * - `bottom` - show a question title to bottom
   * - `left` - show a question title to left
   * - `top` - show a question title to top.
   *
   * > Some questions, for example matrixes, do not support 'left' value. The title for them will be displayed to the top.
   */
  public get questionTitleLocation(): string {
    return this.getPropertyValue("questionTitleLocation");
  }
  public set questionTitleLocation(value: string) {
    this.setPropertyValue("questionTitleLocation", value.toLowerCase());
    if (!this.isLoadingFromJson) {
      this.updateElementCss(true);
    }
  }
  public updateElementCss(reNew?: boolean): void {
    if (!!this.startedPage) {
      this.startedPage.updateElementCss(reNew);
    }
    var pages = this.visiblePages;
    for (var i = 0; i < pages.length; i++) {
      pages[i].updateElementCss(reNew);
    }
  }
  /**
   * Gets or sets the error message position.
   *
   * The following options are available:
   *
   * - `top` - to show question error(s) over the question,
   * - `bottom` - to show question error(s) under the question.
   */
  public get questionErrorLocation(): string {
    return this.getPropertyValue("questionErrorLocation");
  }
  public set questionErrorLocation(value: string) {
    this.setPropertyValue("questionErrorLocation", value.toLowerCase());
  }
  /**
   * Gets or sets the question description position. The default value is `underTitle`.
   *
   * The following options are available:
   *
   * - `underTitle` - show question description under the question title,
   * - `underInput` - show question description under the question input instead of question title.
   */
  public get questionDescriptionLocation(): string {
    return this.getPropertyValue("questionDescriptionLocation");
  }
  public set questionDescriptionLocation(value: string) {
    this.setPropertyValue("questionDescriptionLocation", value);
  }
  /**
   * Gets or sets the survey edit mode.
   *
   * The following options are available:
   *
   * - `edit` (default) - make a survey editable,
   * - `display` - make a survey read-only.
   */
  public get mode(): string {
    return this.getPropertyValue("mode");
  }
  public set mode(value: string) {
    value = value.toLowerCase();
    if (value == this.mode) return;
    if (value != "edit" && value != "display") return;
    this.setPropertyValue("mode", value);
  }
  private onModeChanged() {
    for (var i = 0; i < this.pages.length; i++) {
      var page = this.pages[i];
      page.setPropertyValue("isReadOnly", page.isReadOnly);
    }
    this.updateButtonsVisibility();
  }
  /**
   * Gets or sets an object that stores the survey results/data. You can set it directly as `{ 'question name': questionValue, ... }`
   *
   * > If you set the `data` property after creating the survey, you may need to set the `currentPageNo` to `0`, if you are using `visibleIf` properties for questions/pages/panels to ensure that you are starting from the first page.
   * @see setValue
   * @see getValue
   * @see mergeData
   * @see currentPageNo
   */
  public get data(): any {
    var result: { [index: string]: any } = {};
    var keys = this.getValuesKeys();
    for (var i = 0; i < keys.length; i++) {
      var key = keys[i];
      var dataValue = this.getDataValueCore(this.valuesHash, key);
      if (dataValue !== undefined) {
        result[key] = dataValue;
      }
    }
    this.setCalcuatedValuesIntoResult(result);
    return result;
  }
  public set data(data: any) {
    this.valuesHash = {};
    this.setDataCore(data);
  }
  /**
   * Merge the values into survey.data. It works as survey.data, except it doesn't clean the existing data, but overrides them.
   * @param data data to merge. It should be an object {keyValue: Value, ...}
   * @see data
   * @see setValue
   */
  public mergeData(data: any) {
    if (!data) return;
    this.setDataCore(data);
  }
  public setDataCore(data: any) {
    if (data) {
      for (var key in data) {
        this.setDataValueCore(this.valuesHash, key, data[key]);
      }
    }
    this.updateAllQuestionsValue();
    this.notifyAllQuestionsOnValueChanged();
    this.notifyElementsOnAnyValueOrVariableChanged("");
    this.runConditions();
  }
  private onEditingObjPropertyChanged: (sender: Base, options: any) => void;
  public get editingObj(): Base {
    return this.editingObjValue;
  }
  public set editingObj(val: Base) {
    if (this.editingObj == val) return;
    if (!!this.editingObj) {
      this.editingObj.onPropertyChanged.remove(
        this.onEditingObjPropertyChanged
      );
    }
    this.editingObjValue = val;
    if (this.isDisposed) return;
    if (!val) {
      var questions = this.getAllQuestions();
      for (var i = 0; i < questions.length; i++) {
        questions[i].unbindValue();
      }
    }
    if (!!this.editingObj) {
      this.setDataCore({});
      this.onEditingObjPropertyChanged = (sender: Base, options: any) => {
        if (!Serializer.hasOriginalProperty(this.editingObj, options.name))
          return;
        this.updateOnSetValue(options.name, (<any>this.editingObj)[options.name], options.oldValue);
      };
      this.editingObj.onPropertyChanged.add(this.onEditingObjPropertyChanged);
    }
  }
  public get isEditingSurveyElement(): boolean {
    return !!this.editingObj;
  }
  private setCalcuatedValuesIntoResult(result: any) {
    for (var i = 0; i < this.calculatedValues.length; i++) {
      var calValue = this.calculatedValues[i];
      if (
        calValue.includeIntoResult &&
        !!calValue.name &&
        this.getVariable(calValue.name) !== undefined
      ) {
        result[calValue.name] = this.getVariable(calValue.name);
      }
    }
  }
  getAllValues(): any {
    return this.data;
  }
  /**
   * Returns survey result data as an array of plain objects: with question `title`, `name`, `value`, and `displayValue`.
   *
   * For complex questions (like matrix, etc.) `isNode` flag is set to `true` and data contains array of nested objects (rows).
   *
   * Set `options.includeEmpty` to `false` if you want to skip empty answers.
   */
  public getPlainData(
    options?: {
      includeEmpty?: boolean,
      includeQuestionTypes?: boolean,
      calculations?: Array<{
        propertyName: string,
      }>,
    }
  ) {
    if (!options) {
      options = { includeEmpty: true, includeQuestionTypes: false };
    }
    var result: Array<any> = [];
    this.getAllQuestions().forEach((question) => {
      var resultItem = (<Question>question).getPlainData(options);
      if (!!resultItem) {
        result.push(resultItem);
      }
    });
    return result;
  }
  getFilteredValues(): any {
    var values: { [index: string]: any } = {};
    for (var key in this.variablesHash) values[key] = this.variablesHash[key];
    this.addCalculatedValuesIntoFilteredValues(values);
    var keys = this.getValuesKeys();
    for (var i = 0; i < keys.length; i++) {
      var key = keys[i];
      values[key] = this.getDataValueCore(this.valuesHash, key);
    }
    return values;
  }
  private addCalculatedValuesIntoFilteredValues(values: {
    [index: string]: any,
  }) {
    var caclValues = this.calculatedValues;
    for (var i = 0; i < caclValues.length; i++)
      values[caclValues[i].name] = caclValues[i].value;
  }
  getFilteredProperties(): any {
    return { survey: this };
  }
  private getValuesKeys(): Array<string> {
    if (!this.editingObj) return Object.keys(this.valuesHash);
    var props = Serializer.getPropertiesByObj(this.editingObj);
    var res = [];
    for (var i = 0; i < props.length; i++) {
      res.push(props[i].name);
    }
    return res;
  }
  public getDataValueCore(valuesHash: any, key: string): any {
    if (!!this.editingObj)
      return Serializer.getObjPropertyValue(this.editingObj, key);
    return this.getDataFromValueHash(valuesHash, key);
  }
  public setDataValueCore(valuesHash: any, key: string, value: any) {
    if (!!this.editingObj) {
      Serializer.setObjPropertyValue(this.editingObj, key, value);
    } else {
      this.setDataToValueHash(valuesHash, key, value);
    }
  }
  public deleteDataValueCore(valuesHash: any, key: string) {
    if (!!this.editingObj) {
      (<any>this.editingObj)[key] = null;
    } else {
      this.deleteDataFromValueHash(valuesHash, key);
    }
  }
  valueHashGetDataCallback: (valuesHash: any, key: string) => any;
  valueHashSetDataCallback: (valuesHash: any, key: string, value: any) => void;
  valueHashDeleteDataCallback: (valuesHash: any, key: string) => void;
  private getDataFromValueHash(valuesHash: any, key: string): any {
    if(!!this.valueHashGetDataCallback) return this.valueHashGetDataCallback(valuesHash, key);
    return valuesHash[key];
  }
  private setDataToValueHash(valuesHash: any, key: string, value: any): void {
    if(!!this.valueHashSetDataCallback) {
      this.valueHashSetDataCallback(valuesHash, key, value);
    } else {
      valuesHash[key] = value;
    }
  }
  private deleteDataFromValueHash(valuesHash: any, key: string): void {
    if(!!this.valueHashDeleteDataCallback) {
      this.valueHashDeleteDataCallback(valuesHash, key);
    } else {
      delete valuesHash[key];
    }
  }
  /**
   * Returns all comments from the data.
   * @see data
   */
  public get comments(): any {
    var result: { [index: string]: any } = {};
    var keys = this.getValuesKeys();
    for (var i = 0; i < keys.length; i++) {
      var key = keys[i];
      if (key.indexOf(this.commentPrefix) > 0) {
        result[key] = this.getDataValueCore(this.valuesHash, key);
      }
    }
    return result;
  }
  /**
   * Returns a list of visible pages. If all pages are visible, then this property returns the same list as the `pages` property.
   * @see pages
   * @see PageModel.visible
   * @see PageModel.visibleIf
   */
  public get visiblePages(): Array<PageModel> {
    if (this.isDesignMode) return this.pages;
    var result = new Array<PageModel>();
    for (var i = 0; i < this.pages.length; i++) {
      if (this.isPageInVisibleList(this.pages[i])) {
        result.push(this.pages[i]);
      }
    }
    return result;
  }
  private isPageInVisibleList(page: PageModel): boolean {
    return this.isDesignMode || page.isVisible && !page.isStarted;
  }
  /**
   * Returns `true` if the survey contains no pages. The survey is empty.
   */
  public get isEmpty(): boolean {
    return this.pages.length == 0;
  }
  /**
   * Deprecated. Use the `pageCount` property instead.
   */
  get PageCount(): number {
    return this.pageCount;
  }
  /**
   * Returns the survey page count.
   * @see visiblePageCount
   * @see pages
   */
  public get pageCount(): number {
    return this.pages.length;
  }
  /**
   * Returns a number of visible pages within the survey.
   * @see pageCount
   * @see visiblePages
   */
  public get visiblePageCount(): number {
    return this.visiblePages.length;
  }
  /**
   * Returns the started page. This property works if the `firstPageIsStarted` property is set to `true`.
   * @see firstPageIsStarted
   */
  public get startedPage(): PageModel {
    var page =
      this.firstPageIsStarted && this.pages.length > 0 ? this.pages[0] : null;
    if (!!page) {
      page.onFirstRendering();
      page.setWasShown(true);
    }
    return page;
  }
  /**
   * Gets or sets the current survey page. If a survey is rendered, then this property returns a page that a user can see/edit.
   */
  public get currentPage(): any {
    return this.getPropertyValue("currentPage", null);
  }
  public set currentPage(value: any) {
    if (this.isLoadingFromJson) return;
    var newPage = this.getPageByObject(value);
    if (!!value && !newPage) return;
    if (!newPage && this.isCurrentPageAvailable) return;
    var vPages = this.visiblePages;
    if (newPage != null && vPages.indexOf(newPage) < 0) return;
    if (newPage == this.currentPage) return;
    var oldValue = this.currentPage;
    if (!this.currentPageChanging(newPage, oldValue)) return;
    this.setPropertyValue("currentPage", newPage);
    if (!!newPage) {
      newPage.onFirstRendering();
      newPage.updateCustomWidgets();
      newPage.setWasShown(true);
    }
    this.locStrsChanged();
    this.currentPageChanged(newPage, oldValue);
  }
  private updateCurrentPage(): void {
    if (this.isCurrentPageAvailable) return;
    this.currentPage = this.firstVisiblePage;
  }
  private get isCurrentPageAvailable(): boolean {
    const page = this.currentPage;
    return !!page && this.isPageInVisibleList(page) && this.isPageExistsInSurvey(page);
  }
  private isPageExistsInSurvey(page: PageModel): boolean {
    if (this.pages.indexOf(page) > -1) return true;
    return !!this.onContainsPageCallback && this.onContainsPageCallback(page);
  }
  /**
   * Returns the currentPage, unless the started page is showing. In this case returns the started page.
   * @see currentPage
   * @see firstPageIsStarted
   * @see startedPage
   */
  public get activePage(): any {
    return this.getPropertyValue("activePage");
  }
  /**
   * The started page is showing right now. survey state equals to "starting"
   */
  public get isShowStartingPage(): boolean {
    return this.state === "starting";
  }
  /**
   * Survey is showing a page right now. It is in "running", "preview" or starting state.
   */
  public get isShowingPage(): boolean {
    return this.state == "running" || this.state == "preview" || this.isShowStartingPage;
  }
  private updateActivePage() : void {
    const newPage = this.isShowStartingPage ? this.startedPage : this.currentPage;
    this.setPropertyValue("activePage", newPage);
  }
  private onStateAndCurrentPageChanged(): void {
    this.updateActivePage();
    this.updateButtonsVisibility();
  }
  private getPageByObject(value: any): PageModel {
    if (!value) return null;
    if (value.getType && value.getType() == "page") return value;
    if (typeof value === "string" || value instanceof String)
      return this.getPageByName(String(value));
    if (!isNaN(value)) {
      var index = Number(value);
      var vPages = this.visiblePages;
      if (value < 0 || value >= vPages.length) return null;
      return vPages[index];
    }
    return value;
  }
  /**
   * The zero-based index of the current page in the visible pages array.
   */
  public get currentPageNo(): number {
    return this.visiblePages.indexOf(this.currentPage);
  }
  public set currentPageNo(value: number) {
    var vPages = this.visiblePages;
    if (value < 0 || value >= vPages.length) return;
    this.currentPage = vPages[value];
  }
  /**
   * Gets or sets the question display order. Use this property to randomize questions. You can randomize questions on a specific page.
   *
   * The following options are available:
   *
   * - `random` - randomize questions
   * - `initial` - keep questions in the same order, as in a survey model.
   * @see SurveyPage.questionsOrder
   */
  public get questionsOrder() {
    return this.getPropertyValue("questionsOrder");
  }
  public set questionsOrder(val: string) {
    this.setPropertyValue("questionsOrder", val);
  }

  /**
   * Sets the input focus to the first question with the input field.
   */
  public focusFirstQuestion() {
    if (this.isFocusingQuestion) return;
    var page = this.activePage;
    if (page) {
      page.scrollToTop();
      page.focusFirstQuestion();
    }
  }
  scrollToTopOnPageChange(doScroll: boolean = true): void {
    var page = this.activePage;
    if (!page) return;
    if (doScroll) {
      page.scrollToTop();
    }
    if (this.focusFirstQuestionAutomatic && !this.isFocusingQuestion) {
      page.focusFirstQuestion();
    }
  }
  /**
   * Returns the current survey state:
   *
   * - `loading` - the survey is being loaded from JSON,
   * - `empty` - there is nothing to display in the current survey,
   * - `starting` - the survey's start page is displayed,
   * - `running` - a respondent is answering survey questions right now,
   * - `preview` - a respondent is previewing answered questions before submitting the survey (see [example](https://surveyjs.io/Examples/Library?id=survey-showpreview)),
   * - `completed` - a respondent has completed the survey and submitted the results.
   *
   * Details: [Preview State](https://surveyjs.io/Documentation/Library#states)
   */
  public get state(): string {
    return this.getPropertyValue("state", "empty");
  }
  private updateState() : void {
    this.setPropertyValue("state", this.calcState());
  }
  private calcState(): string {
    if (this.isLoading) return "loading";
    if (this.isCompleted) return "completed";
    if (this.isCompletedBefore) return "completedbefore";
    if (
      !this.isDesignMode &&
      this.isEditMode &&
      this.isStartedState &&
      this.startedPage
    )
      return "starting";
    if (this.isShowingPreview) return this.currentPage ? "preview" : "empty";
    return this.currentPage ? "running" : "empty";
  }
  private get isCompleted(): boolean {
    return this.getPropertyValue("isCompleted", false);
  }
  private set isCompleted(val: boolean) {
    this.setPropertyValue("isCompleted", val);
  }
  private get isShowingPreview(): boolean {
    return this.getPropertyValue("isShowingPreview", false);
  }
  private set isShowingPreview(val: boolean) {
    if (this.isShowingPreview == val) return;
    this.setPropertyValue("isShowingPreview", val);
    this.onShowingPreviewChanged();
  }
  private get isStartedState(): boolean {
    return this.getPropertyValue("isStartedState", false);
  }
  private set isStartedState(val: boolean) {
    this.setPropertyValue("isStartedState", val);
  }
  private get isCompletedBefore(): boolean {
    return this.getPropertyValue("isCompletedBefore", false);
  }
  private set isCompletedBefore(val: boolean) {
    this.setPropertyValue("isCompletedBefore", val);
  }
  private get isLoading(): boolean {
    return this.getPropertyValue("isLoading", false);
  }
  private set isLoading(val: boolean) {
    this.setPropertyValue("isLoading", val);
  }

  public get completedState(): string {
    return this.getPropertyValue("completedState", "");
  }
  get completedStateText(): string {
    return this.getPropertyValue("completedStateText", "");
  }
  protected setCompletedState(value: string, text: string) {
    this.setPropertyValue("completedState", value);
    if (!text) {
      if (value == "saving") text = this.getLocString("savingData");
      if (value == "error") text = this.getLocString("savingDataError");
      if (value == "success") text = this.getLocString("savingDataSuccess");
    }
    this.setPropertyValue("completedStateText", text);
    this.setPropertyValue("completedStateCss", this.getCompletedStateCss());
  }
  /**
   * Clears the survey data and state. If the survey has a `completed` state, it will get a `running` state.
   * @param clearData clear the data
   * @param gotoFirstPage make the first page as a current page.
   * @see data
   * @see state
   * @see currentPage
   */
  public clear(clearData: boolean = true, gotoFirstPage: boolean = true) {
    this.isCompleted = false;
    this.isCompletedBefore = false;
    this.isLoading = false;
    if (clearData) {
      this.data = null;
      this.variablesHash = {};
    }
    this.timerModel.spent = 0;
    for (var i = 0; i < this.pages.length; i++) {
      this.pages[i].timeSpent = 0;
      this.pages[i].setWasShown(false);
      this.pages[i].passed = false;
    }
    this.isStartedState = this.firstPageIsStarted;
    if (gotoFirstPage) {
      this.currentPage = this.firstVisiblePage;
    }
    if (clearData) {
      this.updateValuesWithDefaults();
    }
  }
  public mergeValues(src: any, dest: any) {
    if (!dest || !src) return;
    if (typeof dest !== "object") return;
    for (var key in src) {
      var value = src[key];
      if (value && typeof value === "object") {
        if (!dest[key] || typeof dest[key] !== "object") dest[key] = {};
        this.mergeValues(value, dest[key]);
      } else {
        dest[key] = value;
      }
    }
  }
  private updateValuesWithDefaults() {
    if (this.isDesignMode || this.isLoading) return;
    for (var i = 0; i < this.pages.length; i++) {
      var questions = this.pages[i].questions;
      for (var j = 0; j < questions.length; j++) {
        questions[j].updateValueWithDefaults();
      }
    }
  }
  protected updateCustomWidgets(page: PageModel) {
    if (!page) return;
    page.updateCustomWidgets();
  }
  protected currentPageChanging(newValue: PageModel, oldValue: PageModel) {
    var options = {
      oldCurrentPage: oldValue,
      newCurrentPage: newValue,
      allowChanging: true,
      isNextPage: this.isNextPage(newValue, oldValue),
      isPrevPage: this.isPrevPage(newValue, oldValue),
    };
    this.onCurrentPageChanging.fire(this, options);
    return options.allowChanging;
  }
  protected currentPageChanged(newValue: PageModel, oldValue: PageModel) {
    const isNextPage: boolean = this.isNextPage(newValue, oldValue);
    if (isNextPage) {
      oldValue.passed = true;
    }
    this.onCurrentPageChanged.fire(this, {
      oldCurrentPage: oldValue,
      newCurrentPage: newValue,
      isNextPage: isNextPage,
      isPrevPage: this.isPrevPage(newValue, oldValue),
    });
  }
  private isNextPage(newValue: PageModel, oldValue: PageModel): boolean {
    if (!newValue || !oldValue) return false;
    return newValue.visibleIndex == oldValue.visibleIndex + 1;
  }
  private isPrevPage(newValue: PageModel, oldValue: PageModel): boolean {
    if (!newValue || !oldValue) return false;
    return newValue.visibleIndex + 1 == oldValue.visibleIndex;
  }
  /**
   * Returns the progress that a user made while going through the survey.
   * It depends from progressBarType property
   * @see progressBarType
   * @see progressValue
   */
  public getProgress(): number {
    if (this.currentPage == null) return 0;
    if (this.progressBarType !== "pages") {
      var info = this.getProgressInfo();
      if (this.progressBarType === "requiredQuestions") {
        return info.requiredQuestionCount > 1
          ? Math.ceil(
            (info.requiredAnsweredQuestionCount * 100) /
            info.requiredQuestionCount
          )
          : 100;
      }
      return info.questionCount > 1
        ? Math.ceil((info.answeredQuestionCount * 100) / info.questionCount)
        : 100;
    }
    const visPages = this.visiblePages;
    var index = visPages.indexOf(this.currentPage) + 1;
    return Math.ceil((index * 100) / visPages.length);
  }
  /**
   * Returns the progress that a user made while going through the survey.
   * It depends from progressBarType property
   * @see progressBarType
   */
  public get progressValue(): number {
    return this.getPropertyValue("progressValue", 0);
  }
  /**
   * Returns the navigation buttons (i.e., 'Prev', 'Next', or 'Complete' and 'Preview') position.
   */
  public get isNavigationButtonsShowing(): string {
    if (this.isDesignMode) return "none";
    var page = this.currentPage;
    if (!page) return "none";
    if (page.navigationButtonsVisibility === "show") {
      return "bottom";
    }
    if (page.navigationButtonsVisibility === "hide") {
      return "none";
    }
    return this.showNavigationButtons;
  }
  /**
   * Returns true if the navigation buttons (i.e., 'Prev', 'Next', or 'Complete' and 'Preview') are shows on top.
   */
  public get isNavigationButtonsShowingOnTop(): boolean {
    return this.getIsNavigationButtonsShowingOn("top");
  }
  /**
   * Returns true if the navigation buttons (i.e., 'Prev', 'Next', or 'Complete' and 'Preview') are shows on bottom.
   */
  public get isNavigationButtonsShowingOnBottom(): boolean {
    return this.getIsNavigationButtonsShowingOn("bottom");
  }
  private getIsNavigationButtonsShowingOn(buttonPosition: string): boolean {
    var res = this.isNavigationButtonsShowing;
    return res == "both" || res == buttonPosition;
  }
  /**
   * Returns `true` if the survey is in edit mode.
   * @see mode
   */
  public get isEditMode(): boolean {
    return this.mode == "edit";
  }
  /**
   * Returns `true` if the survey is in display mode or in preview mode.
   * @see mode
   * @see showPreviewBeforeComplete
   */
  public get isDisplayMode(): boolean {
    return this.mode == "display" || this.state == "preview";
  }
  public get isUpdateValueTextOnTyping(): boolean {
    return this.textUpdateMode == "onTyping";
  }
  /**
   * Returns `true` if the survey is in design mode. It is used by SurveyJS Editor.
   * @see setDesignMode
   */
  public get isDesignMode(): boolean {
    return this._isDesignMode;
  }
  private _isDesignMode: boolean = false;
  /**
   * Sets the survey into design mode.
   * @param value use true to set the survey into the design mode.
   */
  public setDesignMode(value: boolean) {
    this._isDesignMode = value;
    this.onQuestionsOnPageModeChanged("standard");
  }
  /**
   * Gets or sets whether to show all elements in the survey, regardless their visibility. The default value is `false`.
   */
  public get showInvisibleElements(): boolean {
    return this.getPropertyValue("showInvisibleElements", false);
  }
  public set showInvisibleElements(val: boolean) {
    var visPages = this.visiblePages;
    this.setPropertyValue("showInvisibleElements", val);
    if (this.isLoadingFromJson) return;
    this.runConditions();
    this.updateAllElementsVisibility(visPages);
  }
  private updateAllElementsVisibility(visPages: Array<PageModel>) {
    for (var i = 0; i < this.pages.length; i++) {
      var page = this.pages[i];
      page.updateElementVisibility();
      if (visPages.indexOf(page) > -1 != page.isVisible) {
        this.onPageVisibleChanged.fire(this, {
          page: page,
          visible: page.isVisible,
        });
      }
    }
  }
  public get areInvisibleElementsShowing(): boolean {
    return this.isDesignMode || this.showInvisibleElements;
  }
  public get areEmptyElementsHidden(): boolean {
    return (
      this.isShowingPreview &&
      this.showPreviewBeforeComplete == "showAnsweredQuestions"
    );
  }
  /**
   * Returns `true`, if a user has already completed the survey in this browser and there is a cookie about it. Survey goes to `completed` state if the function returns `true`.
   * @see cookieName
   * @see setCookie
   * @see deleteCookie
   * @see state
   */
  public get hasCookie(): boolean {
    if (!this.cookieName || typeof document === "undefined") return false;
    var cookies = document.cookie;
    return cookies && cookies.indexOf(this.cookieName + "=true") > -1;
  }
  /**
   * Set the cookie with `cookieName` in user's browser. It is done automatically on survey complete if the `cookieName` property value is not empty.
   * @see cookieName
   * @see hasCookie
   * @see deleteCookie
   */
  public setCookie() {
    if (!this.cookieName || typeof document === "undefined") return;
    document.cookie =
      this.cookieName + "=true; expires=Fri, 31 Dec 9999 0:0:0 GMT";
  }
  /**
   * Deletes the cookie with `cookieName` from the browser.
   * @see cookieName
   * @see hasCookie
   * @see setCookie
   */
  public deleteCookie() {
    if (!this.cookieName) return;
    document.cookie = this.cookieName + "=;";
  }
  /**
   * Gets or sets whether the survey must ignore validation like required questions and others, on `nextPage` and `completeLastPage` function calls. The default is `false`.
   * @see nextPage
   * @see completeLastPage
   * @see mode
   */
  public ignoreValidation: boolean = false;
  /**
   * Navigates user to the next page.
   *
   * Returns `false` in the following cases:
   *
   * - if the current page is the last page.
   * - if the current page contains errors (for example, a required question is empty).
   * @see isCurrentPageHasErrors
   * @see prevPage
   * @see completeLastPage
   */
  public nextPage(): boolean {
    if (this.isLastPage) return false;
    return this.doCurrentPageComplete(false);
  }
  private hasErrorsOnNavigate(doComplete: boolean): boolean {
    if (this.ignoreValidation || !this.isEditMode) return false;
    var func = (hasErrors: boolean) => {
      if (!hasErrors) {
        this.doCurrentPageCompleteCore(doComplete);
      }
    };
    if (this.checkErrorsMode === "onComplete") {
      if (!this.isLastPage) return false;
      return this.hasErrors(true, true, func) !== false;
    }
    return this.hasCurrentPageErrors(func) !== false;
  }
  private asyncValidationQuesitons: Array<Question>;
  private checkForAsyncQuestionValidation(
    questions: Array<Question>,
    func: (hasErrors: boolean) => void
  ): boolean {
    this.clearAsyncValidationQuesitons();
    for (var i = 0; i < questions.length; i++) {
      if (questions[i].isRunningValidators) {
        let q = questions[i];
        q.onCompletedAsyncValidators = (hasErrors: boolean) => {
          this.onCompletedAsyncQuestionValidators(q, func, hasErrors);
        };
        this.asyncValidationQuesitons.push(questions[i]);
      }
    }
    return this.asyncValidationQuesitons.length > 0;
  }
  private clearAsyncValidationQuesitons() {
    if (!!this.asyncValidationQuesitons) {
      var asynQuestions = this.asyncValidationQuesitons;
      for (var i = 0; i < asynQuestions.length; i++) {
        asynQuestions[i].onCompletedAsyncValidators = null;
      }
    }
    this.asyncValidationQuesitons = [];
  }
  private onCompletedAsyncQuestionValidators(
    question: Question,
    func: (hasErrors: boolean) => void,
    hasErrors: boolean
  ) {
    if (hasErrors) {
      this.clearAsyncValidationQuesitons();
      func(true);
      if (this.focusOnFirstError && !!question && !!question.page && question.page === this.currentPage) {
        const questions: Array<Question> = this.currentPage.questions;
        for (let i = 0; i < questions.length; i++) {
          if (questions[i] !== question && questions[i].errors.length > 0) return;
        }
        question.focus(true);
      }
      return;
    }
    var asynQuestions = this.asyncValidationQuesitons;
    for (var i = 0; i < asynQuestions.length; i++) {
      if (asynQuestions[i].isRunningValidators) return;
    }
    func(false);
  }
  /**
   * Returns `true`, if the current page contains errors, for example, the required question is empty or a question validation is failed.
   * @see nextPage
   */
  public get isCurrentPageHasErrors(): boolean {
    return this.checkIsCurrentPageHasErrors();
  }
  /**
   * Returns `true`, if the current page contains any error. If there is an async function in an expression, then the function will return `undefined` value.
   * In this case, you should use `onAsyncValidation` parameter, which is a callback function: (hasErrors: boolean) => void
   * @param onAsyncValidation use this parameter if you use async functions in your expressions. This callback function will be called with hasErrors value equals to `true` or `false`.
   * @see hasPageErrors
   * @see hasErrors
   * @see currentPage
   */
  public hasCurrentPageErrors(
    onAsyncValidation?: (hasErrors: boolean) => void
  ): boolean {
    return this.hasPageErrors(undefined, onAsyncValidation);
  }
  /**
   * Returns `true`, if a page contains an error. If there is an async function in an expression, then the function will return `undefined` value.
   * In this case, you should use the second `onAsyncValidation` parameter,  which is a callback function: (hasErrors: boolean) => void
   * @param page the page that you want to validate. If the parameter is undefined then the `activePage` is using
   * @param onAsyncValidation use this parameter if you use async functions in your expressions. This callback function will be called with hasErrors value equals to `true` or `false`.
   * @see hasCurrentPageErrors
   * @see hasErrors
   * @see activePage
   * @see currentPage
   */
  public hasPageErrors(
    page?: PageModel,
    onAsyncValidation?: (hasErrors: boolean) => void
  ): boolean {
    if (!page) {
      page = this.activePage;
    }
    if (!page) return false;
    if (this.checkIsPageHasErrors(page)) return true;
    if (!onAsyncValidation) return false;
    return this.checkForAsyncQuestionValidation(
      page.questions,
      (hasErrors: boolean) => onAsyncValidation(hasErrors)
    )
      ? undefined
      : false;
  }
  /**
   * Returns `true`, if any of the survey pages contains errors. If there is an async function in an expression, then the function will return `undefined` value.
   * In this case, you should use  the third `onAsyncValidation` parameter, which is a callback function: (hasErrors: boolean) => void
   * @param fireCallback set it to `true`, to show errors in UI.
   * @param focusOnFirstError set it to `true` to focus on the first question that doesn't pass the validation and make the page, where the question is located, the current.
   * @param onAsyncValidation use this parameter if you use async functions in your expressions. This callback function will be called with hasErrors value equals to `true` or `false`.
   * @see hasCurrentPageErrors
   * @see hasPageErrors
   */
  public hasErrors(
    fireCallback: boolean = true,
    focusOnFirstError: boolean = false,
    onAsyncValidation?: (hasErrors: boolean) => void
  ): boolean {
    if (!!onAsyncValidation) {
      fireCallback = true;
    }
    var visPages = this.visiblePages;
    var firstErrorPage = null;
    var res = false;
    for (var i = 0; i < visPages.length; i++) {
      if (visPages[i].hasErrors(fireCallback, false)) {
        if (!firstErrorPage) firstErrorPage = visPages[i];
        res = true;
      }
    }
    if (focusOnFirstError && !!firstErrorPage) {
      this.currentPage = firstErrorPage;
      var questions = firstErrorPage.questions;
      for (var i = 0; i < questions.length; i++) {
        if (questions[i].errors.length > 0) {
          questions[i].focus(true);
          break;
        }
      }
    }
    if (res || !onAsyncValidation) return res;
    return this.checkForAsyncQuestionValidation(
      this.getAllQuestions(),
      (hasErrors: boolean) => onAsyncValidation(hasErrors)
    )
      ? undefined
      : false;
  }
  /**
   * Checks whether survey elements (pages, panels, and questions) have unique question names.
   * You can check for unique names for individual page and panel (and all their elements) or a question.
   * If the parameter is not specified, then a survey checks that all its elements have unique names.
   * @param element page, panel or question, it is `null` by default, that means all survey elements will be checked
   */
  public ensureUniqueNames(element: ISurveyElement = null) {
    if (element == null) {
      for (var i = 0; i < this.pages.length; i++) {
        this.ensureUniqueName(this.pages[i]);
      }
    } else {
      this.ensureUniqueName(element);
    }
  }
  private ensureUniqueName(element: ISurveyElement) {
    if (element.isPage) {
      this.ensureUniquePageName(element);
    }
    if (element.isPanel) {
      this.ensureUniquePanelName(element);
    }
    if (element.isPage || element.isPanel) {
      var elements = (<IPanel>element).elements;
      for (var i = 0; i < elements.length; i++) {
        this.ensureUniqueNames(elements[i]);
      }
    } else {
      this.ensureUniqueQuestionName(element);
    }
  }
  private ensureUniquePageName(element: ISurveyElement) {
    return this.ensureUniqueElementName(
      element,
      (name: string): ISurveyElement => {
        return this.getPageByName(name);
      }
    );
  }
  private ensureUniquePanelName(element: ISurveyElement) {
    return this.ensureUniqueElementName(
      element,
      (name: string): ISurveyElement => {
        return this.getPanelByName(name);
      }
    );
  }
  private ensureUniqueQuestionName(element: ISurveyElement) {
    return this.ensureUniqueElementName(
      element,
      (name: string): ISurveyElement => {
        return this.getQuestionByName(name);
      }
    );
  }
  private ensureUniqueElementName(
    element: ISurveyElement,
    getElementByName: (name: string) => ISurveyElement
  ) {
    var existingElement = getElementByName(element.name);
    if (!existingElement || existingElement == element) return;
    var newName = this.getNewName(element.name);
    while (!!getElementByName(newName)) {
      var newName = this.getNewName(element.name);
    }
    element.name = newName;
  }
  private getNewName(name: string): string {
    var pos = name.length;
    while (pos > 0 && name[pos - 1] >= "0" && name[pos - 1] <= "9") {
      pos--;
    }
    var base = name.substr(0, pos);
    var num = 0;
    if (pos < name.length) {
      num = parseInt(name.substr(pos));
    }
    num++;
    return base + num;
  }
  private checkIsCurrentPageHasErrors(
    isFocuseOnFirstError: boolean = undefined
  ): boolean {
    return this.checkIsPageHasErrors(this.activePage, isFocuseOnFirstError);
  }
  private checkIsPageHasErrors(
    page: PageModel,
    isFocuseOnFirstError: boolean = undefined
  ): boolean {
    if (isFocuseOnFirstError === undefined) {
      isFocuseOnFirstError = this.focusOnFirstError;
    }
    if (!page) return true;
    var res = page.hasErrors(true, isFocuseOnFirstError);
    this.fireValidatedErrorsOnPage(page);
    return res;
  }
  private fireValidatedErrorsOnPage(page: PageModel) {
    if (this.onValidatedErrorsOnCurrentPage.isEmpty || !page) return;
    var questionsOnPage = page.questions;
    var questions = new Array<Question>();
    var errors = new Array<SurveyError>();
    for (var i = 0; i < questionsOnPage.length; i++) {
      var q = questionsOnPage[i];
      if (q.errors.length > 0) {
        questions.push(q);
        for (var j = 0; j < q.errors.length; j++) {
          errors.push(q.errors[j]);
        }
      }
    }
    this.onValidatedErrorsOnCurrentPage.fire(this, {
      questions: questions,
      errors: errors,
      page: page,
    });
  }
  /**
   * Navigates user to a previous page. If the current page is the first page, `prevPage` returns `false`. `prevPage` does not perform any checks, required questions can be empty.
   * @see isFirstPage
   */
  public prevPage(): boolean {
    if (this.isFirstPage || this.state === "starting") return false;
    this.resetNavigationButton();
    var vPages = this.visiblePages;
    var index = vPages.indexOf(this.currentPage);
    this.currentPage = vPages[index - 1];
    return true;
  }
  /**
   * Completes the survey, if the current page is the last one. It returns `false` if the last page has errors.
   * If the last page has no errors, `completeLastPage` calls `doComplete` and returns `true`.
   * @see isCurrentPageHasErrors
   * @see nextPage
   * @see doComplete
   */
  public completeLastPage(): boolean {
    var res = this.doCurrentPageComplete(true);
    if (res) {
      this.cancelPreview();
    }
    return res;
  }
  private isNavigationButtonPressed: boolean = false;
  public navigationMouseDown(): boolean {
    this.isNavigationButtonPressed = true;
    return true;
  }
  private resetNavigationButton() {
    this.isNavigationButtonPressed = false;
  }
  private mouseDownPage: any = null;
  public nextPageUIClick() {
    if (!!this.mouseDownPage && this.mouseDownPage !== this.activePage) return;
    this.mouseDownPage = null;
    this.nextPage();
  }
  public nextPageMouseDown() {
    this.mouseDownPage = this.activePage;
    return this.navigationMouseDown();
  }
  /**
   * Shows preview for the survey. Switches the survey to the "preview" state.
   *
   * Details: [Preview State](https://surveyjs.io/Documentation/Library#states-preview)
   * @see showPreviewBeforeComplete
   * @see cancelPreview
   * @see state
   * @see previewText
   * @see editText
   */
  public showPreview(): boolean {
    this.resetNavigationButton();
    if (this.hasErrorsOnNavigate(true)) return false;
    if (this.doServerValidation(true, true)) return false;
    var options = { allowShowPreview: true };
    this.onShowingPreview.fire(this, options);
    this.isShowingPreview = options.allowShowPreview;
    return true;
  }
  /**
   * Cancels preview and switches back to the "running" state.
   *
   * Details: [Preview State](https://surveyjs.io/Documentation/Library#states-preview)
   * @param curPage - A new current page. If the parameter is undefined then the last page becomes the current.
   * @see showPreviewBeforeComplete
   * @see showPreview
   * @see state
   */
  public cancelPreview(curPage: any = null) {
    if (!this.isShowingPreview) return;
    this.isShowingPreview = false;
    if (Helpers.isValueEmpty(curPage) && this.visiblePageCount > 0) {
      curPage = this.visiblePageCount - 1;
    }
    if (curPage !== null) {
      this.currentPage = curPage;
    }
  }
  public cancelPreviewByPage(panel: IPanel): any {
    this.cancelPreview((<any>panel)["originalPage"]);
  }
  protected doCurrentPageComplete(doComplete: boolean): boolean {
    if (this.isValidatingOnServer) return false;
    this.resetNavigationButton();
    if (this.hasErrorsOnNavigate(doComplete)) return false;
    return this.doCurrentPageCompleteCore(doComplete);
  }
  private doCurrentPageCompleteCore(doComplete: boolean): boolean {
    if (this.doServerValidation(doComplete)) return false;
    if (doComplete) {
      this.currentPage.passed = true;
      return this.doComplete();
    }
    this.doNextPage();
    return true;
  }
  /**
   * Obsolete. Use the `questionsOnPageMode` property instead.
   * @see questionsOnPageMode
   */
  public get isSinglePage(): boolean {
    return this.questionsOnPageMode == "singlePage";
  }
  public set isSinglePage(val: boolean) {
    this.questionsOnPageMode = val ? "singlePage" : "standard";
  }
  /**
   * Gets or sets a value that specifies how the survey combines questions, panels, and pages.
   *
   * The following options are available:
   *
   * - `singlePage` - combine all survey pages in a single page. Pages will be converted to panels.
   * - `questionPerPage` - show one question per page. Survey will create a separate page for every question.
   */
  public get questionsOnPageMode(): string {
    return this.getPropertyValue("questionsOnPageMode");
  }
  public set questionsOnPageMode(val: string) {
    this.setPropertyValue("questionsOnPageMode", val);
  }
  /**
   * Gets or sets whether the first survey page is a start page. Set this property to `true`, to make the first page a starting page.
   * An end user cannot navigate to the start page and the start page does not affect a survey progress.
   */
  public get firstPageIsStarted(): boolean {
    return this.getPropertyValue("firstPageIsStarted", false);
  }
  public set firstPageIsStarted(val: boolean) {
    this.setPropertyValue("firstPageIsStarted", val);
  }
  isPageStarted(page: IPage): boolean {
    return (
      this.firstPageIsStarted && this.pages.length > 0 && this.pages[0] === page
    );
  }
  /**
   * Set this property to "showAllQuestions" or "showAnsweredQuestions" to allow respondents to preview answers before submitting the survey results.
   *
   * Details: [Preview State](https://surveyjs.io/Documentation/Library#states-preview)
   * Example: [Show Preview Before Complete](https://surveyjs.io/Examples/Library?id=survey-showpreview)
   * @see showPreview
   * @see cancelPreview
   * @see state
   * @see previewText
   * @see editText
   */
  public get showPreviewBeforeComplete(): string {
    return this.getPropertyValue("showPreviewBeforeComplete");
  }
  public set showPreviewBeforeComplete(val: string) {
    this.setPropertyValue("showPreviewBeforeComplete", val);
  }
  public get isShowPreviewBeforeComplete(): boolean {
    var preview = this.showPreviewBeforeComplete;
    return preview == "showAllQuestions" || preview == "showAnsweredQuestions";
  }
  protected onFirstPageIsStartedChanged() {
    if (this.pages.length == 0) return;
    this.isStartedState = this.firstPageIsStarted;
    this.pageVisibilityChanged(this.pages[0], !this.firstPageIsStarted);
  }
  private runningPages: any;
  private onShowingPreviewChanged() {
    if (this.isDesignMode) return;
    if (this.isShowingPreview) {
      this.runningPages = this.pages.slice(0, this.pages.length);
      this.setupPagesForPageModes(true);
    } else {
      if (this.runningPages) {
        this.restoreOrigionalPages(this.runningPages);
      }
      this.runningPages = undefined;
    }
    this.runConditions();
    this.updateAllElementsVisibility(this.pages);
    this.updateVisibleIndexes();
    this.currentPageNo = 0;
  }
  private origionalPages: any;
  protected onQuestionsOnPageModeChanged(oldValue: string) {
    if (this.isShowingPreview) return;
    if (this.questionsOnPageMode == "standard" || this.isDesignMode) {
      if (this.origionalPages) {
        this.restoreOrigionalPages(this.origionalPages);
      }
      this.origionalPages = undefined;
    } else {
      if (!oldValue || oldValue == "standard") {
        this.origionalPages = this.pages.slice(0, this.pages.length);
      }
      this.setupPagesForPageModes(this.isSinglePage);
    }
    this.runConditions();
    this.updateVisibleIndexes();
  }
  private restoreOrigionalPages(originalPages: Array<PageModel>) {
    this.questionHashesClear();
    this.pages.splice(0, this.pages.length);
    for (var i = 0; i < originalPages.length; i++) {
      this.pages.push(originalPages[i]);
    }
  }
  private setupPagesForPageModes(isSinglePage: boolean) {
    this.questionHashesClear();
    var startIndex = this.firstPageIsStarted ? 1 : 0;
    super.startLoadingFromJson();
    var newPages = this.createPagesForQuestionOnPageMode(
      isSinglePage,
      startIndex
    );
    var deletedLen = this.pages.length - startIndex;
    this.pages.splice(startIndex, deletedLen);
    for (var i = 0; i < newPages.length; i++) {
      this.pages.push(newPages[i]);
    }
    super.endLoadingFromJson();
    for (var i = 0; i < newPages.length; i++) {
      newPages[i].setSurveyImpl(this, true);
    }
    this.doElementsOnLoad();
    this.updateCurrentPage();
  }
  private createPagesForQuestionOnPageMode(
    isSinglePage: boolean,
    startIndex: number
  ): Array<PageModel> {
    if (isSinglePage) {
      return [this.createSinglePage(startIndex)];
    }
    return this.createPagesForEveryQuestion(startIndex);
  }
  private createSinglePage(startIndex: number): PageModel {
    var single = this.createNewPage("all");
    single.setSurveyImpl(this);
    for (var i = startIndex; i < this.pages.length; i++) {
      var page = this.pages[i];
      var panel = Serializer.createClass("panel");
      panel.originalPage = page;
      single.addPanel(panel);
      var json = new JsonObject().toJsonObject(page);
      new JsonObject().toObject(json, panel);
      if (!this.showPageTitles) {
        panel.title = "";
      }
    }
    return single;
  }
  private createPagesForEveryQuestion(startIndex: number): Array<PageModel> {
    var res: Array<PageModel> = [];
    for (var i = startIndex; i < this.pages.length; i++) {
      var originalPage = this.pages[i];
      // Initialize randomization
      originalPage.setWasShown(true);
      for (var j = 0; j < originalPage.elements.length; j++) {
        var originalElement = originalPage.elements[j];
        var element = Serializer.createClass(originalElement.getType());
        if (!element) continue;
        var jsonObj = new JsonObject();
        //Deserialize page properties only, excluding elements
        jsonObj.lightSerializing = true;
        var pageJson = jsonObj.toJsonObject(originalPage);

        var page = <PageModel>Serializer.createClass(originalPage.getType());
        page.fromJSON(pageJson);
        page.name = "page" + (res.length + 1);
        page.setSurveyImpl(this);
        res.push(page);
        var json = new JsonObject().toJsonObject(originalElement);
        new JsonObject().toObject(json, element);
        page.addElement(element);
        for (var k = 0; k < page.questions.length; k++) {
          this.questionHashesAdded(page.questions[k]);
        }
      }
    }
    return res;
  }
  /**
   * Gets whether the current page is the first one.
   */
  public get isFirstPage(): boolean {
    return this.getPropertyValue("isFirstPage");
  }
  /**
   * Gets whether the current page is the last one.
   */
  public get isLastPage(): boolean {
    return this.getPropertyValue("isLastPage");
  }
  private updateButtonsVisibility(): void {
    this.updateIsFirstLastPageState();
    this.setPropertyValue("isShowPrevButton", this.calcIsShowPrevButton());
    this.setPropertyValue("isShowNextButton", this.calcIsShowNextButton());
    this.setPropertyValue("isCompleteButtonVisible", this.calcIsCompleteButtonVisible());
    this.setPropertyValue("isPreviewButtonVisible", this.calcIsPreviewButtonVisible());
    this.setPropertyValue("isCancelPreviewButtonVisible", this.calcIsCancelPreviewButtonVisible());
  }
  public get isShowPrevButton(): boolean {
    return this.getPropertyValue("isShowPrevButton");
  }
  public get isShowNextButton(): boolean {
    return this.getPropertyValue("isShowNextButton");
  }
  public get isCompleteButtonVisible(): boolean {
    return this.getPropertyValue("isCompleteButtonVisible");
  }
  public get isPreviewButtonVisible(): boolean {
    return this.getPropertyValue("isPreviewButtonVisible");
  }
  public get isCancelPreviewButtonVisible(): boolean {
    return this.getPropertyValue("isCancelPreviewButtonVisible");
  }
  private updateIsFirstLastPageState() {
    const curPage = this.currentPage;
    this.setPropertyValue("isFirstPage", !!curPage && curPage === this.firstVisiblePage);
    this.setPropertyValue("isLastPage", !!curPage && curPage === this.lastVisiblePage);
  }
  private calcIsShowPrevButton(): boolean {
    if (this.isFirstPage || !this.showPrevButton || this.state !== "running") return false;
    var page = this.visiblePages[this.currentPageNo - 1];
    return this.getPageMaxTimeToFinish(page) <= 0;
  }
  private calcIsShowNextButton(): boolean {
    return this.state === "running" && !this.isLastPage;
  }
  public calcIsCompleteButtonVisible(): boolean {
    const state = this.state;
    return this.isEditMode && (this.state === "running" && this.isLastPage && !this.isShowPreviewBeforeComplete || state === "preview");
  }
  private calcIsPreviewButtonVisible(): boolean {
    return (
      this.isEditMode &&
      this.isShowPreviewBeforeComplete &&
      this.state == "running" && this.isLastPage
    );
  }
  private calcIsCancelPreviewButtonVisible(): boolean {
    return (
      this.isEditMode &&
      this.isShowPreviewBeforeComplete &&
      this.state == "preview"
    );
  }
  private get firstVisiblePage(): PageModel {
    const pages = this.pages;
    for (let i = 0; i < pages.length; i++) {
      if (this.isPageInVisibleList(pages[i])) return pages[i];
    }
    return null;
  }
  private get lastVisiblePage(): PageModel {
    const pages = this.pages;
    for (let i = pages.length - 1; i >= 0; i--) {
      if (this.isPageInVisibleList(pages[i])) return pages[i];
    }
    return null;
  }
  /**
   * Completes the survey.
   *
   * Calling this function performs the following tasks:
   *
   * - writes cookie if the `cookieName` property is not empty
   * - sets the survey into `completed` state
   * - fires the `onComplete` event
   * - calls `sendResult` function.
   *
   * Calling the `doComplete` function does not perform any validation, unlike the `completeLastPage` function.
   * The function can return false, if you set options.allowComplete to false in onCompleting event. Otherwise it returns true.
   * It calls `navigateToUrl` after calling `onComplete` event.
   * In case calling `options.showDataSaving` callback in the `onComplete` event, `navigateToUrl` is used on calling `options.showDataSavingSuccess` callback.
   * @see completeLastPage
   * @see onCompleting
   * @see cookieName
   * @see state
   * @see onComplete
   * @see surveyPostId
   * @see completeLastPage
   * @see navigateToUrl
   * @see navigateToUrlOnCondition
   */
  public doComplete(isCompleteOnTrigger: boolean = false): boolean {
    var onCompletingOptions = {
      allowComplete: true,
      isCompleteOnTrigger: isCompleteOnTrigger,
    };
    this.onCompleting.fire(this, onCompletingOptions);
    if (!onCompletingOptions.allowComplete) {
      this.isCompleted = false;
      return false;
    }
    let previousCookie = this.hasCookie;
    this.stopTimer();
    this.setCompleted();
    this.clearUnusedValues();
    this.setCookie();
    var self = this;
    var savingDataStarted = false;
    var onCompleteOptions = {
      isCompleteOnTrigger: isCompleteOnTrigger,
      showDataSaving: function (text: string) {
        savingDataStarted = true;
        self.setCompletedState("saving", text);
      },
      showDataSavingError: function (text: string) {
        self.setCompletedState("error", text);
      },
      showDataSavingSuccess: function (text: string) {
        self.setCompletedState("success", text);
        self.navigateTo();
      },
      showDataSavingClear: function (text: string) {
        self.setCompletedState("", "");
      },
    };
    this.onComplete.fire(this, onCompleteOptions);
    if (!previousCookie && this.surveyPostId) {
      this.sendResult();
    }
    if (!savingDataStarted) {
      this.navigateTo();
    }
    return true;
  }
  /**
   * Starts the survey. Changes the survey mode from "starting" to "running". Call this function if your survey has a start page, otherwise this function does nothing.
   * @see firstPageIsStarted
   */
  public start(): boolean {
    if (!this.firstPageIsStarted) return false;
    if (this.checkIsPageHasErrors(this.startedPage, true)) return false;
    this.isStartedState = false;
    this.startTimerFromUI();
    this.onStarted.fire(this, {});
    this.updateVisibleIndexes();
    if (!!this.currentPage) {
      this.currentPage.locStrsChanged();
    }
    return true;
  }
  /**
   * Gets whether the question values on the current page are validating on the server at the current moment.
   * @see onServerValidateQuestions
   */
  public get isValidatingOnServer(): boolean {
    return this.getPropertyValue("isValidatingOnServer", false);
  }
  private setIsValidatingOnServer(val: boolean) {
    if (val == this.isValidatingOnServer) return;
    this.setPropertyValue("isValidatingOnServer", val);
    this.onIsValidatingOnServerChanged();
  }
  protected onIsValidatingOnServerChanged() { }
  protected doServerValidation(
    doComplete: boolean,
    isPreview: boolean = false
  ): boolean {
    if (
      !this.onServerValidateQuestions ||
      this.onServerValidateQuestions.isEmpty
    )
      return false;
    if (!doComplete && this.checkErrorsMode === "onComplete") return false;
    var self = this;
    var options = {
      data: <{ [index: string]: any }>{},
      errors: {},
      survey: this,
      complete: function () {
        self.completeServerValidation(options, isPreview);
      },
    };
    if (doComplete && this.checkErrorsMode === "onComplete") {
      options.data = this.data;
    } else {
      var questions = this.activePage.questions;
      for (var i = 0; i < questions.length; i++) {
        var question = questions[i];
        if (!question.visible) continue;
        var value = this.getValue(question.getValueName());
        if (!this.isValueEmpty(value))
          options.data[question.getValueName()] = value;
      }
    }
    this.setIsValidatingOnServer(true);

    if (typeof this.onServerValidateQuestions === "function") {
      this.onServerValidateQuestions(this, options);
    } else {
      this.onServerValidateQuestions.fire(this, options);
    }

    return true;
  }
  private completeServerValidation(options: any, isPreview: boolean) {
    this.setIsValidatingOnServer(false);
    if (!options && !options.survey) return;
    var self = options.survey;
    var hasErrors = false;
    if (options.errors) {
      var hasToFocus = this.focusOnFirstError;
      for (var name in options.errors) {
        var question = self.getQuestionByName(name);
        if (question && question["errors"]) {
          hasErrors = true;
          question.addError(new CustomError(options.errors[name], this));
          if (hasToFocus) {
            hasToFocus = false;
            if (!!question.page) {
              this.currentPage = question.page;
            }
            question.focus(true);
          }
        }
      }
      this.fireValidatedErrorsOnPage(this.currentPage);
    }
    if (!hasErrors) {
      if (isPreview) {
        this.isShowingPreview = true;
      } else {
        if (self.isLastPage) self.doComplete();
        else self.doNextPage();
      }
    }
  }
  protected doNextPage() {
    var curPage = this.currentPage;
    this.checkOnPageTriggers();
    if (!this.isCompleted) {
      if (this.sendResultOnPageNext) {
        this.sendResult(this.surveyPostId, this.clientId, true);
      }
      if (curPage === this.currentPage) {
        var vPages = this.visiblePages;
        var index = vPages.indexOf(this.currentPage);
        this.currentPage = vPages[index + 1];
      }
    } else {
      this.doComplete(true);
    }
  }
  public setCompleted() {
    this.isCompleted = true;
  }
  /**
   * Returns the HTML content for the complete page.
   * @see completedHtml
   */
  public get processedCompletedHtml(): string {
    var html = this.renderedCompletedHtml;
    if (html) {
      return this.processHtml(html);
    }
    return "<h3>" + this.getLocString("completingSurvey") + "</h3>";
  }
  /**
   * Returns the HTML content, that is shown to a user that had completed the survey before.
   * @see completedHtml
   * @see cookieName
   */
  public get processedCompletedBeforeHtml(): string {
    if (this.completedBeforeHtml) {
      return this.processHtml(this.completedBeforeHtml);
    }
    return "<h3>" + this.getLocString("completingSurveyBefore") + "</h3>";
  }
  /**
   * Returns the HTML content, that is shows when a survey loads the survey JSON.
   */
  public get processedLoadingHtml(): string {
    if (this.loadingHtml) {
      return this.processHtml(this.loadingHtml);
    }
    return "<h3>" + this.getLocString("loadingSurvey") + "</h3>";
  }
  public getProgressInfo(): IProgressInfo {
    var pages = this.isDesignMode ? this.pages : this.visiblePages;
    return SurveyElement.getProgressInfoByElements(pages, false);
  }
  /**
   * Returns the text for the current progress.
   */
  public get progressText(): string {
    var res = this.getPropertyValue("progressText", "");
    if (!res) {
      this.updateProgressText();
      res = this.getPropertyValue("progressText", "");
    }
    return res;
  }
  private isCalculatingProgressText = false;
  public updateProgressText(onValueChanged: boolean = false) {
    if (this.isCalculatingProgressText) return;
    if (
      onValueChanged &&
      this.progressBarType == "pages" &&
      this.onProgressText.isEmpty
    )
      return;
    this.isCalculatingProgressText = true;
    this.setPropertyValue("progressText", this.getProgressText());
    this.setPropertyValue("progressValue", this.getProgress());
    this.isCalculatingProgressText = false;
  }
  public getProgressText(): string {
    if (!this.isDesignMode && this.currentPage == null) return "";
    var options = {
      questionCount: 0,
      answeredQuestionCount: 0,
      requiredQuestionCount: 0,
      requiredAnsweredQuestionCount: 0,
      text: "",
    };
    var type = this.progressBarType.toLowerCase();
    if (
      type === "questions" ||
      type === "requiredquestions" ||
      type === "correctquestions" ||
      !this.onProgressText.isEmpty
    ) {
      var info = this.getProgressInfo();
      options.questionCount = info.questionCount;
      options.answeredQuestionCount = info.answeredQuestionCount;
      options.requiredQuestionCount = info.requiredQuestionCount;
      options.requiredAnsweredQuestionCount =
        info.requiredAnsweredQuestionCount;
    }

    options.text = this.getProgressTextCore(options);
    this.onProgressText.fire(this, options);
    return options.text;
  }
  private getProgressTextCore(info: IProgressInfo): string {
    var type = this.progressBarType.toLowerCase();
    if (type === "questions") {
      return this.getLocString("questionsProgressText")["format"](
        info.answeredQuestionCount,
        info.questionCount
      );
    }
    if (type === "requiredquestions") {
      return this.getLocString("questionsProgressText")["format"](
        info.requiredAnsweredQuestionCount,
        info.requiredQuestionCount
      );
    }
    if (type === "correctquestions") {
      var correctAnswersCount = this.getCorrectedAnswerCount();
      return this.getLocString("questionsProgressText")["format"](
        correctAnswersCount,
        info.questionCount
      );
    }
    var vPages = this.isDesignMode ? this.pages : this.visiblePages;
    var index = vPages.indexOf(this.currentPage) + 1;
    return this.getLocString("progressText")["format"](index, vPages.length);
  }
  afterRenderSurvey(htmlElement: any) {
    this.onAfterRenderSurvey.fire(this, {
      survey: this,
      htmlElement: htmlElement,
    });
  }
  updateQuestionCssClasses(question: IQuestion, cssClasses: any) {
    this.onUpdateQuestionCssClasses.fire(this, {
      question: question,
      cssClasses: cssClasses,
    });
  }
  updatePanelCssClasses(panel: IPanel, cssClasses: any) {
    this.onUpdatePanelCssClasses.fire(this, {
      panel: panel,
      cssClasses: cssClasses,
    });
  }
  updatePageCssClasses(page: IPage, cssClasses: any) {
    this.onUpdatePageCssClasses.fire(this, {
      page: page,
      cssClasses: cssClasses,
    });
  }
  updateChoiceItemCss(question: IQuestion, options: any): void {
    options.question = question;
    this.onUpdateChoiceItemCss.fire(this, options);
  }
  private isFirstPageRendering: boolean = true;
  afterRenderPage(htmlElement: HTMLElement) {
    if (!this.isDesignMode) {
      this.scrollToTopOnPageChange(!this.isFirstPageRendering);
    }
    this.isFirstPageRendering = false;
    if (this.onAfterRenderPage.isEmpty) return;
    this.onAfterRenderPage.fire(this, {
      page: this.activePage,
      htmlElement: htmlElement,
    });
  }
  afterRenderHeader(htmlElement: HTMLElement) {
    if (this.onAfterRenderHeader.isEmpty) return;
    this.onAfterRenderHeader.fire(this, {
      htmlElement: htmlElement,
    });
  }
  afterRenderQuestion(question: IQuestion, htmlElement: HTMLElement) {
    this.onAfterRenderQuestion.fire(this, {
      question: question,
      htmlElement: htmlElement,
    });
  }
  afterRenderQuestionInput(question: IQuestion, htmlElement: HTMLElement) {
    if (this.onAfterRenderQuestionInput.isEmpty) return;
    let id = (<Question>question).inputId;
    if (!!id && htmlElement.id !== id && typeof document !== "undefined") {
      let el = document.getElementById(id);
      if (!!el) {
        htmlElement = el;
      }
    }
    this.onAfterRenderQuestionInput.fire(this, {
      question: question,
      htmlElement: htmlElement,
    });
  }
  afterRenderPanel(panel: IElement, htmlElement: HTMLElement) {
    this.onAfterRenderPanel.fire(this, {
      panel: panel,
      htmlElement: htmlElement,
    });
  }
  whenQuestionFocusIn(question: IQuestion) {
    this.onFocusInQuestion.fire(this, {
      question: question
    });
  }
  whenPanelFocusIn(panel: IPanel) {
    this.onFocusInPanel.fire(this, {
      panel: panel
    });
  }

  private rebuildQuestionChoices() {
    this.getAllQuestions().forEach(q => q.surveyChoiceItemVisibilityChange());
  }
  canChangeChoiceItemsVisibility(): boolean {
    return !this.onShowingChoiceItem.isEmpty;
  }
  getChoiceItemVisibility(question: IQuestion, item: any, val: boolean): boolean {
    const options = { question: question, item: item, visible: val };
    this.onShowingChoiceItem.fire(this, options);
    return options.visible;
  }
  matrixBeforeRowAdded(options: any) {
    this.onMatrixBeforeRowAdded.fire(this, options);
  }
  matrixRowAdded(question: IQuestion, row: any) {
    this.onMatrixRowAdded.fire(this, { question: question, row: row });
  }
  getQuestionByValueNameFromArray(
    valueName: string,
    name: string,
    index: number
  ): IQuestion {
    var questions = this.getQuestionsByValueName(valueName);
    if (!questions) return;
    for (var i = 0; i < questions.length; i++) {
      var res = questions[i].getQuestionFromArray(name, index);
      if (!!res) return res;
    }
    return null;
  }
  matrixRowRemoved(question: IQuestion, rowIndex: number, row: any) {
    this.onMatrixRowRemoved.fire(this, {
      question: question,
      rowIndex: rowIndex,
      row: row,
    });
  }
  matrixRowRemoving(question: IQuestion, rowIndex: number, row: any): boolean {
    var options = {
      question: question,
      rowIndex: rowIndex,
      row: row,
      allow: true,
    };
    this.onMatrixRowRemoving.fire(this, options);
    return options.allow;
  }
  matrixAllowRemoveRow(
    question: IQuestion,
    rowIndex: number,
    row: any
  ): boolean {
    var options = {
      question: question,
      rowIndex: rowIndex,
      row: row,
      allow: true,
    };
    this.onMatrixAllowRemoveRow.fire(this, options);
    return options.allow;
  }
  matrixCellCreating(question: IQuestion, options: any) {
    options.question = question;
    this.onMatrixCellCreating.fire(this, options);
  }
  matrixCellCreated(question: IQuestion, options: any) {
    options.question = question;
    this.onMatrixCellCreated.fire(this, options);
  }
  matrixAfterCellRender(question: IQuestion, options: any) {
    options.question = question;
    this.onMatrixAfterCellRender.fire(this, options);
  }
  matrixCellValueChanged(question: IQuestion, options: any) {
    options.question = question;
    this.onMatrixCellValueChanged.fire(this, options);
  }
  matrixCellValueChanging(question: IQuestion, options: any) {
    options.question = question;
    this.onMatrixCellValueChanging.fire(this, options);
  }
  get isValidateOnValueChanging(): boolean {
    return this.checkErrorsMode === "onValueChanging";
  }
  matrixCellValidate(question: IQuestion, options: any): SurveyError {
    options.question = question;
    this.onMatrixCellValidate.fire(this, options);
    return options.error ? new CustomError(options.error, this) : null;
  }
  dynamicPanelAdded(question: IQuestion) {
    if (this.onDynamicPanelAdded.isEmpty) return;
    var panels = (<any>question).panels;
    var panel = panels[panels.length - 1];
    this.onDynamicPanelAdded.fire(this, { question: question, panel: panel });
  }
  dynamicPanelRemoved(question: IQuestion, panelIndex: number, panel: IPanel) {
    var questions = !!panel ? (<PanelModelBase>panel).questions : [];
    for (var i = 0; i < questions.length; i++) {
      questions[i].clearOnDeletingContainer();
    }
    this.onDynamicPanelRemoved.fire(this, {
      question: question,
      panelIndex: panelIndex,
      panel: panel,
    });
  }
  dynamicPanelItemValueChanged(question: IQuestion, options: any) {
    options.question = question;
    this.onDynamicPanelItemValueChanged.fire(this, options);
  }
  dragAndDropAllow(options: any): boolean {
    options.allow = true;
    this.onDragDropAllow.fire(this, options);
    return options.allow;
  }
  elementContentVisibilityChanged(element: ISurveyElement): void {
    if (this.currentPage) {
      this.currentPage.ensureRowsVisibility();
    }
    this.onElementContentVisibilityChanged.fire(this, { element });
  }

  getUpdatedElementTitleActions(
    element: ISurveyElement,
    titleActions: Array<IAction>
  ): Array<IAction> {
    if (element.isPage)
      return this.getUpdatedPageTitleActions(element, titleActions);
    if (element.isPanel)
      return this.getUpdatedPanelTitleActions(element, titleActions);
    return this.getUpdatedQuestionTitleActions(element, titleActions);
  }
  private getUpdatedQuestionTitleActions(
    question: ISurveyElement,
    titleActions: Array<IAction>
  ) {
    var options = {
      question: question,
      titleActions: titleActions,
    };
    this.onGetQuestionTitleActions.fire(this, options);
    return options.titleActions;
  }

  private getUpdatedPanelTitleActions(
    panel: ISurveyElement,
    titleActions: Array<IAction>
  ) {
    var options = {
      panel: panel,
      titleActions: titleActions,
    };
    this.onGetPanelTitleActions.fire(this, options);
    return options.titleActions;
  }

  private getUpdatedPageTitleActions(
    page: ISurveyElement,
    titleActions: Array<IAction>
  ) {
    var options = {
      page: page,
      titleActions: titleActions,
    };
    this.onGetPageTitleActions.fire(this, options);
    return options.titleActions;
  }

  getUpdatedMatrixRowActions(
    question: IQuestion,
    row: any,
    actions: Array<IAction>
  ) {
    var options = {
      question: question,
      actions: actions,
      row: row,
    };
    this.onGetMatrixRowActions.fire(this, options);
    return options.actions;
  }

  scrollElementToTop(
    element: ISurveyElement,
    question: IQuestion,
    page: IPage,
    id: string
  ): any {
    var options = {
      element: element,
      question: question,
      page: page,
      elementId: id,
      cancel: false,
    };
    this.onScrollingElementToTop.fire(this, options);
    if (!options.cancel) {
      SurveyElement.ScrollElementToTop(options.elementId);
    }
  }

  /**
   * Uploads a file to server.
   * @param question a file question object
   * @param name a question name
   * @param files files to upload
   * @param uploadingCallback a call back function to get the status on uploading the files
   */
  public uploadFiles(
    question: IQuestion,
    name: string,
    files: File[],
    uploadingCallback: (status: string, data: any) => any
  ) {
    if (this.onUploadFiles.isEmpty) {
      uploadingCallback("error", files);
    } else {
      this.onUploadFiles.fire(this, {
        question: question,
        name: name,
        files: files || [],
        callback: uploadingCallback,
      });
    }
    if (this.surveyPostId) {
      this.uploadFilesCore(name, files, uploadingCallback);
    }
  }
  /**
   * Downloads a file from server
   * @param name a question name
   * @param fileValue a single file question value
   * @param callback a call back function to get the status on downloading the file and the downloaded file content
   */
  public downloadFile(
    questionName: string,
    fileValue: any,
    callback: (status: string, data: any) => any
  ) {
    if (this.onDownloadFile.isEmpty) {
      !!callback && callback("success", fileValue.content || fileValue);
    }
    this.onDownloadFile.fire(this, {
      name: questionName,
      content: fileValue.content || fileValue,
      fileValue: fileValue,
      callback: callback,
    });
  }
  /**
   * Clears files from server.
   * @param question question
   * @param name question name
   * @param value file question value
   * @param callback call back function to get the status of the clearing operation
   */
  public clearFiles(
    question: IQuestion,
    name: string,
    value: any,
    fileName: string,
    callback: (status: string, data: any) => any
  ) {
    if (this.onClearFiles.isEmpty) {
      !!callback && callback("success", value);
    }
    this.onClearFiles.fire(this, {
      question: question,
      name: name,
      value: value,
      fileName: fileName,
      callback: callback,
    });
  }
  updateChoicesFromServer(
    question: IQuestion,
    choices: Array<ItemValue>,
    serverResult: any
  ): Array<ItemValue> {
    var options = {
      question: question,
      choices: choices,
      serverResult: serverResult,
    };
    this.onLoadChoicesFromServer.fire(this, options);
    return options.choices;
  }
  loadedChoicesFromServer(question: IQuestion): void {
    this.locStrsChanged();
  }
  protected createSurveyService(): dxSurveyService {
    return new dxSurveyService();
  }
  protected uploadFilesCore(
    name: string,
    files: File[],
    uploadingCallback: (status: string, data: any) => any
  ) {
    var responses: Array<any> = [];
    files.forEach((file) => {
      if (uploadingCallback) uploadingCallback("uploading", file);
      this.createSurveyService().sendFile(
        this.surveyPostId,
        file,
        (success: boolean, response: any) => {
          if (success) {
            responses.push({ content: response, file: file });
            if (responses.length === files.length) {
              if (uploadingCallback) uploadingCallback("success", responses);
            }
          } else {
            if (uploadingCallback)
              uploadingCallback("error", {
                response: response,
                file: file,
              });
          }
        }
      );
    });
  }
  getPage(index: number): PageModel {
    return this.pages[index];
  }
  /**
   * Adds an existing page to the survey.
   * @param page a newly added page
   * @param index - a page index to where insert a page. It is -1 by default and the page will be added into the end.
   * @see addNewPage
   */
  public addPage(page: PageModel, index: number = -1) {
    if (page == null) return;
    if (index < 0 || index >= this.pages.length) {
      this.pages.push(page);
    } else {
      this.pages.splice(index, 0, page);
    }
  }
  /**
   * Creates a new page and adds it to a survey. Generates a new name if the `name` parameter is not specified.
   * @param name a page name
   * @param index - a page index to where insert a new page. It is -1 by default and the page will be added into the end.
   * @see addPage
   */
  public addNewPage(name: string = null, index: number = -1) {
    var page = this.createNewPage(name);
    this.addPage(page, index);
    return page;
  }
  /**
   * Removes a page from a survey.
   * @param page
   */
  public removePage(page: PageModel) {
    var index = this.pages.indexOf(page);
    if (index < 0) return;
    this.pages.splice(index, 1);
    if (this.currentPage == page) {
      this.currentPage = this.pages.length > 0 ? this.pages[0] : null;
    }
  }
  /**
   * Returns a question by its name.
   * @param name a question name
   * @param caseInsensitive
   * @see getQuestionByValueName
   */
  public getQuestionByName(
    name: string,
    caseInsensitive: boolean = false
  ): Question {
    if (!name) return null;
    if (caseInsensitive) {
      name = name.toLowerCase();
    }
    var hash: HashTable<any> = !!caseInsensitive
      ? this.questionHashes.namesInsensitive
      : this.questionHashes.names;
    var res = hash[name];
    if (!res) return null;
    return res[0];
  }
  /**
   * Returns a question by its value name
   * @param valueName a question name
   * @param caseInsensitive
   * @see getQuestionByName
   * @see getQuestionsByValueName
   * @see Question.valueName
   */
  public getQuestionByValueName(
    valueName: string,
    caseInsensitive: boolean = false
  ): IQuestion {
    var res = this.getQuestionsByValueName(valueName, caseInsensitive);
    return !!res ? res[0] : null;
  }
  /**
   * Returns all questions by their valueName. name property is used if valueName property is empty.
   * @param valueName a question name
   * @param caseInsensitive
   * @see getQuestionByName
   * @see getQuestionByValueName
   * @see Question.valueName
   */
  public getQuestionsByValueName(
    valueName: string,
    caseInsensitive: boolean = false
  ): Array<Question> {
    var hash: HashTable<any> = !!caseInsensitive
      ? this.questionHashes.valueNamesInsensitive
      : this.questionHashes.valueNames;
    var res = hash[valueName];
    if (!res) return null;
    return res;
  }
  public getCalculatedValueByName(name: string): CalculatedValue {
    for (var i = 0; i < this.calculatedValues.length; i++) {
      if (name == this.calculatedValues[i].name)
        return this.calculatedValues[i];
    }
    return null;
  }
  /**
   * Gets a list of questions by their names.
   * @param names an array of question names
   * @param caseInsensitive
   */
  public getQuestionsByNames(
    names: string[],
    caseInsensitive: boolean = false
  ): IQuestion[] {
    var result: IQuestion[] = [];
    if (!names) return result;
    for (var i: number = 0; i < names.length; i++) {
      if (!names[i]) continue;
      var question = this.getQuestionByName(names[i], caseInsensitive);
      if (question) result.push(question);
    }
    return result;
  }
  /**
   * Returns a page on which an element (question or panel) is placed.
   * @param element Question or Panel
   */
  public getPageByElement(element: IElement): PageModel {
    for (var i: number = 0; i < this.pages.length; i++) {
      var page = this.pages[i];
      if (page.containsElement(element)) return page;
    }
    return null;
  }
  /**
   * Returns a page on which a question is located.
   * @param question
   */
  public getPageByQuestion(question: IQuestion): PageModel {
    return this.getPageByElement(question);
  }
  /**
   * Returns a page by it's name.
   * @param name
   */
  public getPageByName(name: string): PageModel {
    for (var i: number = 0; i < this.pages.length; i++) {
      if (this.pages[i].name == name) return this.pages[i];
    }
    return null;
  }
  /**
   * Returns a list of pages by their names.
   * @param names a list of page names
   */
  public getPagesByNames(names: string[]): PageModel[] {
    var result: PageModel[] = [];
    if (!names) return result;
    for (var i: number = 0; i < names.length; i++) {
      if (!names[i]) continue;
      var page = this.getPageByName(names[i]);
      if (page) result.push(page);
    }
    return result;
  }
  /**
   * Returns a list of all questions in a survey.
   * @param visibleOnly set it `true`, if you want to get only visible questions
   */
  public getAllQuestions(
    visibleOnly: boolean = false,
    includingDesignTime: boolean = false
  ): Array<Question> {
    var result = new Array<Question>();
    for (var i: number = 0; i < this.pages.length; i++) {
      this.pages[i].addQuestionsToList(
        result,
        visibleOnly,
        includingDesignTime
      );
    }
    return result;
  }
  /**
   * Returns quiz questions. All visible questions that has input(s) widgets.
   * @see getQuizQuestionCount
   */
  public getQuizQuestions(): Array<IQuestion> {
    var result = new Array<IQuestion>();
    var startIndex = this.firstPageIsStarted ? 1 : 0;
    for (var i = startIndex; i < this.pages.length; i++) {
      if (!this.pages[i].isVisible) continue;
      var questions = this.pages[i].questions;
      for (var j = 0; j < questions.length; j++) {
        var q = questions[j];
        if (q.quizQuestionCount > 0) {
          result.push(q);
        }
      }
    }
    return result;
  }
  /**
   * Returns a panel by its name.
   * @param name a panel name
   * @param caseInsensitive
   * @see getQuestionByName
   */
  public getPanelByName(
    name: string,
    caseInsensitive: boolean = false
  ): IPanel {
    var panels = this.getAllPanels();
    if (caseInsensitive) name = name.toLowerCase();
    for (var i: number = 0; i < panels.length; i++) {
      var panelName = panels[i].name;
      if (caseInsensitive) panelName = panelName.toLowerCase();
      if (panelName == name) return panels[i];
    }
    return null;
  }
  /**
   * Returns a list of all survey's panels.
   */
  public getAllPanels(
    visibleOnly: boolean = false,
    includingDesignTime: boolean = false
  ): Array<IPanel> {
    var result = new Array<IPanel>();
    for (var i: number = 0; i < this.pages.length; i++) {
      this.pages[i].addPanelsIntoList(result, visibleOnly, includingDesignTime);
    }
    return result;
  }
  /**
   * Creates and returns a new page, but do not add it into the survey.
   * You can use addPage(page) function to add it into survey later.
   * @see addPage
   * @see addNewPage
   */
  public createNewPage(name: string): PageModel {
    const page = Serializer.createClass("page");
    page.name = name;
    return page;
  }
  protected questionOnValueChanging(valueName: string, newValue: any): any {
    if (this.onValueChanging.isEmpty) return newValue;
    var options = {
      name: valueName,
      question: this.getQuestionByValueName(valueName),
      value: this.getUnbindValue(newValue),
      oldValue: this.getValue(valueName),
    };
    this.onValueChanging.fire(this, options);
    return options.value;
  }
  protected updateQuestionValue(valueName: string, newValue: any) {
    if (this.isLoadingFromJson) return;
    var questions = this.getQuestionsByValueName(valueName);
    if (!!questions) {
      for (var i: number = 0; i < questions.length; i++) {
        var qValue = questions[i].value;
        if (
          (qValue === newValue && Array.isArray(qValue) && !!this.editingObj) ||
          !this.isTwoValueEquals(qValue, newValue)
        ) {
          questions[i].updateValueFromSurvey(newValue);
        }
      }
    }
  }
  private checkQuestionErrorOnValueChanged(question: Question) {
    if (
      !this.isNavigationButtonPressed &&
      (this.checkErrorsMode === "onValueChanged" ||
        question.getAllErrors().length > 0)
    ) {
      this.checkQuestionErrorOnValueChangedCore(question);
    }
  }
  private checkQuestionErrorOnValueChangedCore(question: Question): boolean {
    var oldErrorCount = question.getAllErrors().length;
    var res = question.hasErrors(true, {
      isOnValueChanged: !this.isValidateOnValueChanging,
    });
    if (
      !!question.page &&
      (oldErrorCount > 0 || question.getAllErrors().length > 0)
    ) {
      this.fireValidatedErrorsOnPage(<PageModel>question.page);
    }
    return res;
  }
  private checkErrorsOnValueChanging(
    valueName: string,
    newValue: any
  ): boolean {
    if (this.isLoadingFromJson) return false;
    var questions = this.getQuestionsByValueName(valueName);
    if (!questions) return false;
    var res = false;
    for (var i: number = 0; i < questions.length; i++) {
      var q = questions[i];
      if (!this.isTwoValueEquals(q.valueForSurvey, newValue)) {
        q.value = newValue;
      }
      if (this.checkQuestionErrorOnValueChangedCore(q)) res = true;
      res = res || q.errors.length > 0;
    }
    return res;
  }
  protected notifyQuestionOnValueChanged(valueName: string, newValue: any) {
    if (this.isLoadingFromJson) return;
    var questions = this.getQuestionsByValueName(valueName);
    if (!!questions) {
      for (var i: number = 0; i < questions.length; i++) {
        var question = questions[i];
        this.checkQuestionErrorOnValueChanged(question);
        question.onSurveyValueChanged(newValue);
        this.onValueChanged.fire(this, {
          name: valueName,
          question: question,
          value: newValue,
        });
      }
    } else {
      this.onValueChanged.fire(this, {
        name: valueName,
        question: null,
        value: newValue,
      });
    }
    if (this.isDisposed) return;
    this.checkElementsBindings(valueName, newValue);
    this.notifyElementsOnAnyValueOrVariableChanged(valueName);
  }
  private isRunningElementsBindings: boolean;
  private updateVisibleIndexAfterBindings: boolean;
  private checkElementsBindings(valueName: string, newValue: any): void {
    this.isRunningElementsBindings = true;
    for (var i = 0; i < this.pages.length; i++) {
      this.pages[i].checkBindings(valueName, newValue);
    }
    this.isRunningElementsBindings = false;
    if(this.updateVisibleIndexAfterBindings) {
      this.updateVisibleIndexes();
      this.updateVisibleIndexAfterBindings = false;
    }
  }
  private notifyElementsOnAnyValueOrVariableChanged(name: string) {
    if (this.isEndLoadingFromJson === "processing") return;
    if (this.isRunningConditions) {
      this.conditionNotifyElementsOnAnyValueOrVariableChanged = true;
      return;
    }
    for (var i = 0; i < this.pages.length; i++) {
      this.pages[i].onAnyValueChanged(name);
    }
    if (!this.isEndLoadingFromJson) {
      this.locStrsChanged();
    }
  }
  private updateAllQuestionsValue() {
    var questions = this.getAllQuestions();
    for (var i: number = 0; i < questions.length; i++) {
      var q = <Question>questions[i];
      var valName = q.getValueName();
      q.updateValueFromSurvey(this.getValue(valName));
      if (q.requireUpdateCommentValue) {
        q.updateCommentFromSurvey(this.getComment(valName));
      }
    }
  }
  private notifyAllQuestionsOnValueChanged() {
    var questions = this.getAllQuestions();
    for (var i: number = 0; i < questions.length; i++) {
      questions[i].onSurveyValueChanged(
        this.getValue(questions[i].getValueName())
      );
    }
  }
  private checkOnPageTriggers() {
    var questions = this.getCurrentPageQuestions(true);
    var values: { [index: string]: any } = {};
    for (var i = 0; i < questions.length; i++) {
      var question = questions[i];
      var name = question.getValueName();
      values[name] = this.getValue(name);
    }
    this.addCalculatedValuesIntoFilteredValues(values);
    this.checkTriggers(values, true);
  }
  private getCurrentPageQuestions(
    includeInvsible: boolean = false
  ): Array<Question> {
    var result: Array<Question> = [];
    var page = this.currentPage;
    if (!page) return result;
    for (var i = 0; i < page.questions.length; i++) {
      var question = page.questions[i];
      if ((!includeInvsible && !question.visible) || !question.name) continue;
      result.push(question);
    }
    return result;
  }
  private isTriggerIsRunning: boolean = false;
  private triggerValues: any = null;
  private triggerKeys: any = null;
  private checkTriggers(key: any, isOnNextPage: boolean) {
    if (this.isCompleted || this.triggers.length == 0 || this.isDisplayMode) return;
    if (this.isTriggerIsRunning) {
      this.triggerValues = this.getFilteredValues();
      for (var k in key) {
        this.triggerKeys[k] = key[k];
      }
      return;
    }
    this.isTriggerIsRunning = true;
    this.triggerKeys = key;
    this.triggerValues = this.getFilteredValues();
    var properties = this.getFilteredProperties();
    for (var i: number = 0; i < this.triggers.length; i++) {
      var trigger = this.triggers[i];
      if (trigger.isOnNextPage == isOnNextPage) {
        trigger.checkExpression(
          this.triggerKeys,
          this.triggerValues,
          properties
        );
      }
    }
    this.isTriggerIsRunning = false;
  }
  private doElementsOnLoad() {
    for (var i = 0; i < this.pages.length; i++) {
      this.pages[i].onSurveyLoad();
    }
  }
  private conditionValues: any = null;
  private get isRunningConditions(): boolean {
    return !!this.conditionValues;
  }
  private isValueChangedOnRunningCondition: boolean = false;
  private conditionRunnerCounter: number = 0;
  private conditionUpdateVisibleIndexes: boolean = false;
  private conditionNotifyElementsOnAnyValueOrVariableChanged: boolean = false;
  private runConditions() {
    if (
      this.isCompleted ||
      this.isEndLoadingFromJson === "processing" ||
      this.isRunningConditions
    )
      return;
    this.conditionValues = this.getFilteredValues();
    var properties = this.getFilteredProperties();
    var oldCurrentPageIndex = this.pages.indexOf(this.currentPage);
    this.runConditionsCore(properties);
    this.checkIfNewPagesBecomeVisible(oldCurrentPageIndex);
    this.conditionValues = null;
    if (
      this.isValueChangedOnRunningCondition &&
      this.conditionRunnerCounter <
      settings.maximumConditionRunCountOnValueChanged
    ) {
      this.isValueChangedOnRunningCondition = false;
      this.conditionRunnerCounter++;
      this.runConditions();
    } else {
      this.isValueChangedOnRunningCondition = false;
      this.conditionRunnerCounter = 0;
      if (this.conditionUpdateVisibleIndexes) {
        this.conditionUpdateVisibleIndexes = false;
        this.updateVisibleIndexes();
      }
      if (this.conditionNotifyElementsOnAnyValueOrVariableChanged) {
        this.conditionNotifyElementsOnAnyValueOrVariableChanged = false;
        this.notifyElementsOnAnyValueOrVariableChanged("");
      }
    }
  }
  private runConditionOnValueChanged(name: string, value: any) {
    if (this.isRunningConditions) {
      this.conditionValues[name] = value;
      this.isValueChangedOnRunningCondition = true;
    } else {
      this.runConditions();
    }
  }
  private runConditionsCore(properties: any) {
    var pages = this.pages;
    for (var i = 0; i < this.calculatedValues.length; i++) {
      this.calculatedValues[i].resetCalculation();
    }
    for (var i = 0; i < this.calculatedValues.length; i++) {
      this.calculatedValues[i].doCalculation(
        this.calculatedValues,
        this.conditionValues,
        properties
      );
    }
    for (var i = 0; i < pages.length; i++) {
      pages[i].runCondition(this.conditionValues, properties);
    }
  }
  private checkIfNewPagesBecomeVisible(oldCurrentPageIndex: number) {
    var newCurrentPageIndex = this.pages.indexOf(this.currentPage);
    if (newCurrentPageIndex <= oldCurrentPageIndex + 1) return;
    for (var i = oldCurrentPageIndex + 1; i < newCurrentPageIndex; i++) {
      if (this.pages[i].isVisible) {
        this.currentPage = this.pages[i];
        break;
      }
    }
  }
  /**
   * Sends a survey result to the [api.surveyjs.io](https://api.surveyjs.io) service.
   * @param postId [api.surveyjs.io](https://api.surveyjs.io) service postId
   * @param clientId Typically a customer e-mail or an identifier
   * @param isPartialCompleted Set it to `true` if the survey is not completed yet and the results are intermediate
   * @see surveyPostId
   * @see clientId
   */
  public sendResult(
    postId: string = null,
    clientId: string = null,
    isPartialCompleted: boolean = false
  ) {
    if (!this.isEditMode) return;
    if (isPartialCompleted && this.onPartialSend) {
      this.onPartialSend.fire(this, null);
    }

    if (!postId && this.surveyPostId) {
      postId = this.surveyPostId;
    }
    if (!postId) return;
    if (clientId) {
      this.clientId = clientId;
    }
    if (isPartialCompleted && !this.clientId) return;
    var self = this;
    if (this.surveyShowDataSaving) {
      this.setCompletedState("saving", "");
    }
    this.createSurveyService().sendResult(
      postId,
      this.data,
      function (success: boolean, response: any, request: any) {
        if (self.surveyShowDataSaving) {
          if (success) {
            self.setCompletedState("success", "");
          } else {
            self.setCompletedState("error", response);
          }
        }
        self.onSendResult.fire(self, {
          success: success,
          response: response,
          request: request,
        });
      },
      this.clientId,
      isPartialCompleted
    );
  }
  /**
   * Calls the [api.surveyjs.io](https://api.surveyjs.io) service and, on callback, fires the `onGetResult` event with all answers that your users made for a question.
   * @param resultId [api.surveyjs.io](https://api.surveyjs.io) service resultId
   * @param name The question name
   * @see onGetResult
   */
  public getResult(resultId: string, name: string) {
    var self = this;
    this.createSurveyService().getResult(resultId, name, function (
      success: boolean,
      data: any,
      dataList: any[],
      response: any
    ) {
      self.onGetResult.fire(self, {
        success: success,
        data: data,
        dataList: dataList,
        response: response,
      });
    });
  }
  /**
   * Loads the survey JSON from the [api.surveyjs.io](https://api.surveyjs.io) service.
   * If `clientId` is not `null` and a user had completed a survey before, the survey switches to `completedbefore` state.
   * @param surveyId [api.surveyjs.io](https://api.surveyjs.io) service surveyId
   * @param clientId users' indentifier, for example an e-mail or a unique customer id in your web application.
   * @see state
   * @see onLoadedSurveyFromService
   */
  public loadSurveyFromService(
    surveyId: string = null,
    cliendId: string = null
  ) {
    if (surveyId) {
      this.surveyId = surveyId;
    }
    if (cliendId) {
      this.clientId = cliendId;
    }
    var self = this;
    this.isLoading = true;
    this.onLoadingSurveyFromService();
    if (cliendId) {
      this.createSurveyService().getSurveyJsonAndIsCompleted(
        this.surveyId,
        this.clientId,
        function (
          success: boolean,
          json: string,
          isCompleted: string,
          response: any
        ) {
          self.isLoading = false;
          if (success) {
            self.isCompletedBefore = isCompleted == "completed";
            self.loadSurveyFromServiceJson(json);
          }
        }
      );
    } else {
      this.createSurveyService().loadSurvey(this.surveyId, function (
        success: boolean,
        result: string,
        response: any
      ) {
        self.isLoading = false;
        if (success) {
          self.loadSurveyFromServiceJson(result);
        }
      });
    }
  }
  private loadSurveyFromServiceJson(json: any) {
    if (!json) return;
    this.fromJSON(json);
    this.notifyAllQuestionsOnValueChanged();
    this.onLoadSurveyFromService();
    this.onLoadedSurveyFromService.fire(this, {});
  }
  protected onLoadingSurveyFromService() { }
  protected onLoadSurveyFromService() { }
  private resetVisibleIndexes() {
    var questions = this.getAllQuestions(true);
    for (var i = 0; i < questions.length; i++) {
      questions[i].setVisibleIndex(-1);
    }
    this.updateVisibleIndexes();
  }
  private updateVisibleIndexes() {
    if (this.isLoadingFromJson || !!this.isEndLoadingFromJson) return;
    if (
      this.isRunningConditions &&
      this.onVisibleChanged.isEmpty &&
      this.onPageVisibleChanged.isEmpty
    ) {
      //Run update visible index only one time on finishing running conditions
      this.conditionUpdateVisibleIndexes = true;
      return;
    }
    if(this.isRunningElementsBindings) {
      this.updateVisibleIndexAfterBindings = true;
      return;
    }
    this.updatePageVisibleIndexes(this.showPageNumbers);
    if (this.showQuestionNumbers == "onPage") {
      var visPages = this.visiblePages;
      for (var i = 0; i < visPages.length; i++) {
        visPages[i].setVisibleIndex(0);
      }
    } else {
      var index = this.showQuestionNumbers == "on" ? 0 : -1;
      for (var i = 0; i < this.pages.length; i++) {
        index += this.pages[i].setVisibleIndex(index);
      }
    }
    this.updateProgressText(true);
  }
  private updatePageVisibleIndexes(showIndex: boolean) {
    this.updateButtonsVisibility();
    var index = 0;
    for (var i = 0; i < this.pages.length; i++) {
      const page = this.pages[i];
      const isPageVisible = page.isVisible && (i > 0 || !page.isStarted);
      page.visibleIndex = isPageVisible ? index++ : -1;
      page.num = isPageVisible ? page.visibleIndex + 1 : -1;
    }
  }
  public fromJSON(json: any) {
    if (!json) return;
    this.questionHashesClear();
    this.jsonErrors = null;
    var jsonConverter = new JsonObject();
    jsonConverter.toObject(json, this);
    if (jsonConverter.errors.length > 0) {
      this.jsonErrors = jsonConverter.errors;
    }
  }
  public setJsonObject(jsonObj: any) {
    this.fromJSON(jsonObj);
  }
  private isEndLoadingFromJson: string = null;
  endLoadingFromJson() {
    this.isEndLoadingFromJson = "processing";
    this.isStartedState = this.firstPageIsStarted;
    this.onQuestionsOnPageModeChanged("standard");
    super.endLoadingFromJson();
    if (this.hasCookie) {
      this.doComplete();
    }
    this.doElementsOnLoad();
    this.isEndLoadingFromJson = "conditions";
    this.runConditions();
    this.notifyElementsOnAnyValueOrVariableChanged("");
    this.isEndLoadingFromJson = null;
    this.updateVisibleIndexes();
    this.updateCurrentPage();
    this.hasDescription = !!this.description;
  }
  protected onBeforeCreating() { }
  protected onCreating() { }
  private getProcessedTextValue(textValue: TextPreProcessorValue): void {
    this.getProcessedTextValueCore(textValue);
    if (!this.onProcessTextValue.isEmpty) {
      var wasEmpty = this.isValueEmpty(textValue.value);
      this.onProcessTextValue.fire(this, textValue);
      textValue.isExists =
        textValue.isExists || (wasEmpty && !this.isValueEmpty(textValue.value));
    }
  }
  getBuiltInVariableValue(name: string): number {
    if (name === "pageno") {
      var page = this.currentPage;
      return page != null ? this.visiblePages.indexOf(page) + 1 : 0;
    }
    if (name === "pagecount") {
      return this.visiblePageCount;
    }
    if (name === "correctedanswers" || name === "correctanswers" || name === "correctedanswercount") {
      return this.getCorrectedAnswerCount();
    }
    if (name === "incorrectedanswers" || name === "incorrectanswers" || name === "incorrectedanswercount") {
      return this.getInCorrectedAnswerCount();
    }
    if (name === "questioncount") {
      return this.getQuizQuestionCount();
    }
    return undefined;
  }
  private getProcessedTextValueCore(textValue: TextPreProcessorValue): void {
    var name = textValue.name.toLocaleLowerCase();
    if (["no", "require", "title"].indexOf(name) !== -1) {
      return;
    }
    const builtInVar = this.getBuiltInVariableValue(name);
    if(builtInVar !== undefined) {
      textValue.isExists = true;
      textValue.value = builtInVar;
      return;
    }
    if (name === "locale") {
      textValue.isExists = true;
      textValue.value = !!this.locale
        ? this.locale
        : surveyLocalization.defaultLocale;
      return;
    }
    var variable = this.getVariable(name);
    if (variable !== undefined) {
      textValue.isExists = true;
      textValue.value = variable;
      return;
    }
    var question = this.getFirstName(name);
    if (question) {
      textValue.isExists = true;
      var firstName = question.getValueName().toLowerCase();
      name = firstName + name.substr(firstName.length);
      name = name.toLocaleLowerCase();
      var values: { [index: string]: any } = {};
      values[firstName] = textValue.returnDisplayValue
        ? question.getDisplayValue(false, undefined)
        : question.value;
      textValue.value = new ProcessValue().getValue(name, values);
      return;
    }
    var value = this.getValue(textValue.name);
    if (value !== undefined) {
      textValue.isExists = true;
      textValue.value = value;
    }
  }
  private getFirstName(name: string): IQuestion {
    name = name.toLowerCase();
    var question;
    do {
      question = this.getQuestionByValueName(name, true);
      name = this.reduceFirstName(name);
    } while (!question && !!name);
    return question;
  }
  private reduceFirstName(name: string): string {
    var pos1 = name.lastIndexOf(".");
    var pos2 = name.lastIndexOf("[");
    if (pos1 < 0 && pos2 < 0) return "";
    var pos = Math.max(pos1, pos2);
    return name.substr(0, pos);
  }
  private clearUnusedValues() {
    var questions = this.getAllQuestions();
    for (var i: number = 0; i < questions.length; i++) {
      questions[i].clearUnusedValues();
    }
    this.clearInvisibleQuestionValues();
  }
  hasVisibleQuestionByValueName(valueName: string): boolean {
    var questions = this.getQuestionsByValueName(valueName);
    if (!questions) return false;
    for (var i: number = 0; i < questions.length; i++) {
      if (questions[i].isVisible && questions[i].isParentVisible) return true;
    }
    return false;
  }
  questionCountByValueName(valueName: string): number {
    var questions = this.getQuestionsByValueName(valueName);
    return !!questions ? questions.length : 0;
  }
  private clearInvisibleQuestionValues() {
    const reason = this.clearInvisibleValues === "none" ? "none" : "onComplete";
    const questions = this.getAllQuestions();
    for (var i: number = 0; i < questions.length; i++) {
      questions[i].clearValueIfInvisible(reason);
    }
  }
  /**
   * Returns a variable value. Variable, unlike values, are not stored in the survey results.
   * @param name A variable name
   * @see SetVariable
   */
  public getVariable(name: string): any {
    if (!name) return null;
    name = name.toLowerCase();
    var res = this.variablesHash[name];
    if (!this.isValueEmpty(res)) return res;
    if (name.indexOf(".") > -1 || name.indexOf("[") > -1) {
      if (new ProcessValue().hasValue(name, this.variablesHash))
        return new ProcessValue().getValue(name, this.variablesHash);
    }
    return res;
  }
  /**
   * Sets a variable value. Variable, unlike values, are not stored in the survey results.
   * @param name A variable name
   * @param newValue A variable new value
   * @see GetVariable
   */
  public setVariable(name: string, newValue: any): void {
    if (!name) return;
    name = name.toLowerCase();
    this.variablesHash[name] = newValue;
    this.notifyElementsOnAnyValueOrVariableChanged(name);
    this.runConditionOnValueChanged(name, newValue);
    this.onVariableChanged.fire(this, { name: name, value: newValue });
  }
  /**
   * Returns all variables in the survey. Use setVariable function to create a new variable.
   * @see getVariable
   * @see setVariable
   */
  public getVariableNames(): Array<string> {
    var res = [];
    for (var key in this.variablesHash) {
      res.push(key);
    }
    return res;
  }
  //ISurvey data
  protected getUnbindValue(value: any): any {
    if (!!this.editingObj) return value;
    return Helpers.getUnbindValue(value);
  }
  /**
   * Returns a question value (answer) by a question's name.
   * @param name A question name
   * @see data
   * @see setValue
   */
  public getValue(name: string): any {
    if (!name || name.length == 0) return null;
    var value = this.getDataValueCore(this.valuesHash, name);
    return this.getUnbindValue(value);
  }
  /**
   * Sets a question value (answer). It runs all triggers and conditions (`visibleIf` properties).
   *
   * Goes to the next page if `goNextPageAutomatic` is `true` and all questions on the current page are answered correctly.
   * @param name A question name
   * @param newValue A new question value
   * @see data
   * @see getValue
   * @see PageModel.visibleIf
   * @see Question.visibleIf
   * @see goNextPageAutomatic
   */
  public setValue(
    name: string,
    newQuestionValue: any,
    locNotification: any = false,
    allowNotifyValueChanged: boolean = true
  ) {
    var newValue = newQuestionValue;
    if (allowNotifyValueChanged) {
      newValue = this.questionOnValueChanging(name, newQuestionValue);
    }
    if (
      this.isValidateOnValueChanging &&
      this.checkErrorsOnValueChanging(name, newValue)
    )
      return;
    if (
      !this.editingObj &&
      this.isValueEqual(name, newValue) &&
      this.isTwoValueEquals(newValue, newQuestionValue)
    )
      return;
    var oldValue = this.getValue(name);
    if (this.isValueEmpty(newValue)) {
      this.deleteDataValueCore(this.valuesHash, name);
    } else {
      newValue = this.getUnbindValue(newValue);
      this.setDataValueCore(this.valuesHash, name, newValue);
    }
    this.updateOnSetValue(
      name,
      newValue,
      oldValue,
      locNotification,
      allowNotifyValueChanged
    );
  }
  private updateOnSetValue(
    name: string,
    newValue: any,
    oldValue: any,
    locNotification: any = false,
    allowNotifyValueChanged: boolean = true
  ) {
    this.updateQuestionValue(name, newValue);
    if (locNotification === true || this.isDisposed || this.isRunningElementsBindings) return;
    var triggerKeys: { [index: string]: any } = {};
    triggerKeys[name] = { newValue: newValue, oldValue: oldValue };
    this.runConditionOnValueChanged(name, newValue);
    this.checkTriggers(triggerKeys, false);
    if (allowNotifyValueChanged)
      this.notifyQuestionOnValueChanged(name, newValue);
    if (locNotification !== "text") {
      this.tryGoNextPageAutomatic(name);
    }
  }
  private isValueEqual(name: string, newValue: any): boolean {
    if (newValue === "" || newValue === undefined) newValue = null;
    var oldValue = this.getValue(name);
    if (oldValue === "" || oldValue === undefined) oldValue = null;
    if (newValue === null || oldValue === null) return newValue === oldValue;
    return this.isTwoValueEquals(newValue, oldValue);
  }
  protected doOnPageAdded(page: PageModel) {
    page.setSurveyImpl(this);
    if (!page.name) page.name = this.generateNewName(this.pages, "page");
    this.questionHashesPanelAdded(page);
    this.updateVisibleIndexes();
    if (!this.isLoadingFromJson) {
      this.updateProgressText();
      this.updateCurrentPage();
    }
    var options = { page: page };
    this.onPageAdded.fire(this, options);
  }
  protected doOnPageRemoved(page: PageModel) {
    page.setSurveyImpl(null);
    if (page === this.currentPage) {
      this.updateCurrentPage();
    }
    this.updateVisibleIndexes();
    this.updateProgressText();
    this.updateLazyRenderingRowsOnRemovingElements();
  }
  private generateNewName(elements: Array<any>, baseName: string): string {
    var keys: { [index: string]: any } = {};
    for (var i = 0; i < elements.length; i++) keys[elements[i]["name"]] = true;
    var index = 1;
    while (keys[baseName + index]) index++;
    return baseName + index;
  }
  protected tryGoNextPageAutomatic(name: string) {
    if (
      !!this.isEndLoadingFromJson ||
      !this.goNextPageAutomatic ||
      !this.currentPage
    )
      return;
    var question = <Question>this.getQuestionByValueName(name);
    if (
      !question ||
      (!!question &&
        (!question.visible || !question.supportGoNextPageAutomatic()))
    )
      return;
    if (question.hasErrors(false) && !question.supportGoNextPageError()) return;
    var questions = this.getCurrentPageQuestions();
    if (questions.indexOf(question) < 0) return;
    for (var i = 0; i < questions.length; i++) {
      if (questions[i].hasInput && questions[i].isEmpty()) return;
    }
    if (!this.checkIsCurrentPageHasErrors(false)) {
      if (!this.isLastPage) {
        this.nextPage();
      } else {
        if (
          this.goNextPageAutomatic === true &&
          this.allowCompleteSurveyAutomatic
        ) {
          if (this.isShowPreviewBeforeComplete) {
            this.showPreview();
          } else {
            this.completeLastPage();
          }
        }
      }
    }
  }
  /**
   * Returns the comment value.
   * @param name A comment's name.
   * @see setComment
   */
  public getComment(name: string): string {
    const res = this.getValue(name + this.commentPrefix);
    return res || "";
  }
  /**
   * Sets a comment value.
   * @param name A comment name.
   * @param newValue A new comment value.
   * @see getComment
   */
  public setComment(
    name: string,
    newValue: string,
    locNotification: any = false
  ) {
    if (!newValue) newValue = "";
    if (this.isTwoValueEquals(newValue, this.getComment(name))) return;
    var commentName = name + this.commentPrefix;
    if (this.isValueEmpty(newValue)) {
      this.deleteDataValueCore(this.valuesHash, commentName);
    } else {
      this.setDataValueCore(this.valuesHash, commentName, newValue);
    }
    var questions = this.getQuestionsByValueName(name);
    if (!!questions) {
      for (var i: number = 0; i < questions.length; i++) {
        questions[i].updateCommentFromSurvey(newValue);
        this.checkQuestionErrorOnValueChanged(questions[i]);
      }
    }
    if(!locNotification) {
      this.runConditionOnValueChanged(name, this.getValue(name));
    }
    if (locNotification !== "text") {
      this.tryGoNextPageAutomatic(name);
    }
    var question = this.getQuestionByName(name);
    if (question) {
      this.onValueChanged.fire(this, {
        name: commentName,
        question: question,
        value: newValue,
      });
    }
  }
  /**
   * Removes a value from the survey results.
   * @param {string} name The name of the value. Typically it is a question name.
   */
  public clearValue(name: string) {
    this.setValue(name, null);
    this.setComment(name, null);
  }
  /**
   * Gets or sets whether to clear value on disable items in checkbox, dropdown and radiogroup questions.
   * By default, values are not cleared on disabled the corresponded items. This property is not persisted in survey JSON and you have to set it in code.
   */
  public get clearValueOnDisableItems(): boolean {
    return this.getPropertyValue("clearValueOnDisableItems", false);
  }
  public set clearValueOnDisableItems(val: boolean) {
    this.setPropertyValue("clearValueOnDisableItems", val);
  }
  get isClearValueOnHidden(): boolean {
    return (
      this.clearInvisibleValues == "onHidden" ||
      this.isClearValueOnHiddenContainer
    );
  }
  get isClearValueOnHiddenContainer(): boolean {
    return (
      this.clearInvisibleValues == "onHiddenContainer" &&
      !this.isShowingPreview &&
      !this.runningPages
    );
  }
  questionVisibilityChanged(question: IQuestion, newValue: boolean) {
    this.updateVisibleIndexes();
    this.onVisibleChanged.fire(this, {
      question: question,
      name: question.name,
      visible: newValue,
    });
  }
  pageVisibilityChanged(page: IPage, newValue: boolean) {
    if (this.isLoadingFromJson) return;
    if (newValue && !this.currentPage || page === this.currentPage) {
      this.updateCurrentPage();
    }
    this.updateVisibleIndexes();
    this.onPageVisibleChanged.fire(this, {
      page: page,
      visible: newValue,
    });
  }
  panelVisibilityChanged(panel: IPanel, newValue: boolean) {
    this.updateVisibleIndexes();
    this.onPanelVisibleChanged.fire(this, {
      panel: panel,
      visible: newValue,
    });
  }
  questionCreated(question: IQuestion): any {
    this.onQuestionCreated.fire(this, { question: question });
  }
  questionAdded(
    question: IQuestion,
    index: number,
    parentPanel: any,
    rootPanel: any
  ) {
    if (!question.name) {
      question.name = this.generateNewName(
        this.getAllQuestions(false, true),
        "question"
      );
    }
    if (!!(<Question>question).page) {
      this.questionHashesAdded(<Question>question);
    }
    if (!this.currentPage) {
      this.updateCurrentPage();
    }
    this.updateVisibleIndexes();
    this.onQuestionAdded.fire(this, {
      question: question,
      name: question.name,
      index: index,
      parentPanel: parentPanel,
      rootPanel: rootPanel,
    });
  }
  questionRemoved(question: IQuestion) {
    this.questionHashesRemoved(
      <Question>question,
      question.name,
      question.getValueName()
    );
    this.updateVisibleIndexes();
    this.onQuestionRemoved.fire(this, {
      question: question,
      name: question.name,
    });
    this.updateLazyRenderingRowsOnRemovingElements();
  }
  questionRenamed(
    question: IQuestion,
    oldName: string,
    oldValueName: string
  ): any {
    this.questionHashesRemoved(<Question>question, oldName, oldValueName);
    this.questionHashesAdded(<Question>question);
  }
  private questionHashes = {
    names: {},
    namesInsensitive: {},
    valueNames: {},
    valueNamesInsensitive: {},
  };
  private questionHashesClear() {
    this.questionHashes.names = {};
    this.questionHashes.namesInsensitive = {};
    this.questionHashes.valueNames = {};
    this.questionHashes.valueNamesInsensitive = {};
  }
  private questionHashesPanelAdded(panel: PanelModelBase) {
    if (this.isLoadingFromJson) return;
    var questions = panel.questions;
    for (var i = 0; i < questions.length; i++) {
      this.questionHashesAdded(questions[i]);
    }
  }
  private questionHashesAdded(question: Question) {
    this.questionHashAddedCore(
      this.questionHashes.names,
      question,
      question.name
    );
    this.questionHashAddedCore(
      this.questionHashes.namesInsensitive,
      question,
      question.name.toLowerCase()
    );
    this.questionHashAddedCore(
      this.questionHashes.valueNames,
      question,
      question.getValueName()
    );
    this.questionHashAddedCore(
      this.questionHashes.valueNamesInsensitive,
      question,
      question.getValueName().toLowerCase()
    );
  }
  private questionHashesRemoved(
    question: Question,
    name: string,
    valueName: string
  ) {
    if (!!name) {
      this.questionHashRemovedCore(this.questionHashes.names, question, name);
      this.questionHashRemovedCore(
        this.questionHashes.namesInsensitive,
        question,
        name.toLowerCase()
      );
    }
    if (!!valueName) {
      this.questionHashRemovedCore(
        this.questionHashes.valueNames,
        question,
        valueName
      );
      this.questionHashRemovedCore(
        this.questionHashes.valueNamesInsensitive,
        question,
        valueName.toLowerCase()
      );
    }
  }
  private questionHashAddedCore(hash: any, question: Question, name: string) {
    var res = hash[name];
    if (!!res) {
      var res = hash[name];
      if (res.indexOf(question) < 0) {
        res.push(question);
      }
    } else {
      hash[name] = [question];
    }
  }
  private questionHashRemovedCore(hash: any, question: Question, name: string) {
    var res = hash[name];
    if (!res) return;
    var index = res.indexOf(question);
    if (index > -1) {
      res.splice(index, 1);
    }
    if (res.length == 0) {
      delete hash[name];
    }
  }
  panelAdded(panel: IElement, index: number, parentPanel: any, rootPanel: any) {
    if (!panel.name) {
      panel.name = this.generateNewName(
        this.getAllPanels(false, true),
        "panel"
      );
    }
    this.questionHashesPanelAdded(<PanelModelBase>(<any>panel));
    this.updateVisibleIndexes();
    this.onPanelAdded.fire(this, {
      panel: panel,
      name: panel.name,
      index: index,
      parentPanel: parentPanel,
      rootPanel: rootPanel,
    });
  }
  panelRemoved(panel: IElement) {
    this.updateVisibleIndexes();
    this.onPanelRemoved.fire(this, { panel: panel, name: panel.name });
    this.updateLazyRenderingRowsOnRemovingElements();
  }
  validateQuestion(question: IQuestion): SurveyError {
    if (this.onValidateQuestion.isEmpty) return null;
    var options = {
      name: question.name,
      question: question,
      value: question.value,
      error: <any>null,
    };
    this.onValidateQuestion.fire(this, options);
    return options.error ? new CustomError(options.error, this) : null;
  }
  validatePanel(panel: IPanel): SurveyError {
    if (this.onValidatePanel.isEmpty) return null;
    var options = {
      name: panel.name,
      panel: panel,
      error: <any>null,
    };
    this.onValidatePanel.fire(this, options);
    return options.error ? new CustomError(options.error, this) : null;
  }
  processHtml(html: string): string {
    var options = { html: html };
    this.onProcessHtml.fire(this, options);
    return this.processText(options.html, true);
  }
  processText(text: string, returnDisplayValue: boolean): string {
    return this.processTextEx(text, returnDisplayValue, false).text;
  }
  processTextEx(
    text: string,
    returnDisplayValue: boolean,
    doEncoding: boolean
  ): any {
    var res = {
      text: this.processTextCore(text, returnDisplayValue, doEncoding),
      hasAllValuesOnLastRun: true,
    };
    res.hasAllValuesOnLastRun = this.textPreProcessor.hasAllValuesOnLastRun;
    return res;
  }
  private processTextCore(
    text: string,
    returnDisplayValue: boolean,
    doEncoding: boolean = false
  ): string {
    if (this.isDesignMode) return text;
    return this.textPreProcessor.process(text, returnDisplayValue, doEncoding);
  }
  getSurveyMarkdownHtml(element: Base, text: string, name: string): string {
    var options = {
      element: element,
      text: text,
      name: name,
      html: <any>null,
    };
    this.onTextMarkdown.fire(this, options);
    return options.html;
  }
  /**
   * Deprecated. Use the getCorrectAnswerCount method instead.
   */
  public getCorrectedAnswerCount(): number {
    return this.getCorrectedAnswerCountCore(true);
  }
  /**
   * Returns an amount of corrected quiz answers.
   */
  public getCorrectAnswerCount(): number {
    return this.getCorrectedAnswerCountCore(true);
  }
  /**
   * Returns quiz question number. It may be different from `getQuizQuestions.length` because some widgets like matrix may have several questions.
   * @see getQuizQuestions
   */
  public getQuizQuestionCount(): number {
    var questions = this.getQuizQuestions();
    var res = 0;
    for (var i = 0; i < questions.length; i++) {
      res += (<Question>questions[i]).quizQuestionCount;
    }
    return res;
  }
  /**
   * Deprecated. Use the getInCorrectAnswerCount method instead.
   */
  public getInCorrectedAnswerCount(): number {
    return this.getCorrectedAnswerCountCore(false);
  }
  /**
   * Returns an amount of incorrect quiz answers.
   */
  public getInCorrectAnswerCount(): number {
    return this.getCorrectedAnswerCountCore(false);
  }
  private getCorrectedAnswerCountCore(isCorrect: boolean): number {
    var questions = this.getQuizQuestions();
    var counter = 0;
    var options = {
      question: <IQuestion>null,
      result: false,
      correctAnswers: 0,
      incorrectAnswers: 0,
    };
    for (var i = 0; i < questions.length; i++) {
      var q = <Question>questions[i];
      var quizQuestionCount = q.quizQuestionCount;
      options.question = q;
      options.correctAnswers = q.correctAnswerCount;
      options.incorrectAnswers = quizQuestionCount - options.correctAnswers;
      options.result = options.question.isAnswerCorrect();
      this.onIsAnswerCorrect.fire(this, options);
      if (isCorrect) {
        if (options.result || options.correctAnswers < quizQuestionCount) {
          var addCount = options.correctAnswers;
          if (addCount == 0 && options.result) addCount = 1;
          counter += addCount;
        }
      } else {
        if (!options.result || options.incorrectAnswers < quizQuestionCount) {
          counter += options.incorrectAnswers;
        }
      }
    }
    return counter;
  }
  getCorrectedAnswers(): number {
    return this.getCorrectedAnswerCount();
  }
  getInCorrectedAnswers(): number {
    return this.getInCorrectedAnswerCount();
  }
  /**
   * Gets or sets a timer panel position. The timer panel displays information about how much time an end user spends on a survey/page.
   *
   * The available options:
   * - `top` - display timer panel in the top.
   * - `bottom` - display timer panel in the bottom.
   * - `none` - do not display a timer panel.
   *
   * If the value is not equal to 'none', the survey calls the `startTimer()` method on survey rendering.
   * @see showTimerPanelMode
   * @see startTimer
   * @see stopTimer
   */
  public get showTimerPanel(): string {
    return this.getPropertyValue("showTimerPanel");
  }
  public set showTimerPanel(val: string) {
    this.setPropertyValue("showTimerPanel", val);
  }
  public get isTimerPanelShowingOnTop() {
    return this.timerModel.isRunning && this.showTimerPanel == "top";
  }
  public get isTimerPanelShowingOnBottom() {
    return this.timerModel.isRunning && this.showTimerPanel == "bottom";
  }
  /**
   * Gets or set a value that specifies whether the timer displays information for the page or for the entire survey.
   *
   * The available options:
   *
   * - `page` - show timer information for page
   * - `survey` - show timer information for survey
   *
   * Use the `onTimerPanelInfoText` event to change the default text.
   * @see showTimerPanel
   * @see onTimerPanelInfoText
   */
  public get showTimerPanelMode(): string {
    return this.getPropertyValue("showTimerPanelMode");
  }
  public set showTimerPanelMode(val: string) {
    this.setPropertyValue("showTimerPanelMode", val);
  }

  /**
    * Gets or sets a value that specifies how the survey width is calculated.
    *
    * The available options:
    *
    * - `static` - A survey has a fixed width that mostly depends upon the applied theme. Resizing a browser window does not affect the survey width.
    * - `responsive` - A survey takes all available horizontal space. A survey stretches or shrinks horizonally according to the screen size.
    * - `auto` - Depends on the question type and corresponds to the static or responsive mode.
  */
  // `custom/precise` - The survey width is specified by the width property. // in-future
  public get widthMode(): string {
    return this.getPropertyValue("widthMode");
  }
  public set widthMode(val: string) {
    this.setPropertyValue("widthMode", val);
  }
  public calculateWidthMode() {
    if (this.widthMode == "auto") {
      let isResponsive = false;
      this.pages.forEach((page) => {
        if (page.needResponsiveWidth())
          isResponsive = true;
      });
      return isResponsive ? "responsive" : "static";
    }
    return this.widthMode;
  }
  public get timerInfoText(): string {
    var options = { text: this.getTimerInfoText() };
    this.onTimerPanelInfoText.fire(this, options);
    var loc = new LocalizableString(this, true);
    loc.text = options.text;
    return loc.textOrHtml;
  }
  private getTimerInfoText() {
    var page = this.currentPage;
    if (!page) return "";
    var pageSpent = this.getDisplayTime(page.timeSpent);
    var surveySpent = this.getDisplayTime(this.timeSpent);
    var pageLimitSec = this.getPageMaxTimeToFinish(page);
    var pageLimit = this.getDisplayTime(pageLimitSec);
    var surveyLimit = this.getDisplayTime(this.maxTimeToFinish);
    if (this.showTimerPanelMode == "page")
      return this.getTimerInfoPageText(page, pageSpent, pageLimit);
    if (this.showTimerPanelMode == "survey")
      return this.getTimerInfoSurveyText(surveySpent, surveyLimit);
    if (this.showTimerPanelMode == "all") {
      if (pageLimitSec <= 0 && this.maxTimeToFinish <= 0) {
        return this.getLocString("timerSpentAll")["format"](
          pageSpent,
          surveySpent
        );
      }
      if (pageLimitSec > 0 && this.maxTimeToFinish > 0) {
        return this.getLocString("timerLimitAll")["format"](
          pageSpent,
          pageLimit,
          surveySpent,
          surveyLimit
        );
      }
      let pageText = this.getTimerInfoPageText(page, pageSpent, pageLimit);
      let surveyText = this.getTimerInfoSurveyText(surveySpent, surveyLimit);
      return pageText + " " + surveyText;
    }
    return "";
  }
  private getTimerInfoPageText(
    page: PageModel,
    pageSpent: string,
    pageLimit: string
  ): string {
    return this.getPageMaxTimeToFinish(page) > 0
      ? this.getLocString("timerLimitPage")["format"](pageSpent, pageLimit)
      : this.getLocString("timerSpentPage")["format"](pageSpent, pageLimit);
  }
  private getTimerInfoSurveyText(
    surveySpent: string,
    surveyLimit: string
  ): string {
    return this.maxTimeToFinish > 0
      ? this.getLocString("timerLimitSurvey")["format"](
        surveySpent,
        surveyLimit
      )
      : this.getLocString("timerSpentSurvey")["format"](
        surveySpent,
        surveyLimit
      );
  }
  private getDisplayTime(val: number): string {
    const min: number = Math.floor(val / 60);
    const sec: number = val % 60;
    let res: string = "";
    if (min > 0) {
      res += min + " " + this.getLocString("timerMin");
    }
    if (res && sec == 0) return res;
    if (res) res += " ";
    return res + sec + " " + this.getLocString("timerSec");
  }
  public get timerModel(): SurveyTimerModel { return this.timerModelValue; }
  /**
   * Starts a timer that will calculate how much time end-user spends on the survey or on pages.
   * @see stopTimer
   * @see timeSpent
   */
  public startTimer() {
    this.timerModel.start();
  }
  startTimerFromUI() {
    if (this.showTimerPanel != "none" && this.state === "running") {
      this.startTimer();
    }
  }
  /**
   * Stops the timer.
   * @see startTimer
   * @see timeSpent
   */
  public stopTimer() {
    this.timerModel.stop();
  }
  /**
   * Returns the time in seconds an end user spends on the survey
   * @see startTimer
   * @see PageModel.timeSpent
   */
  public get timeSpent(): number { return this.timerModel.spent; }
  /**
   * Gets or sets the maximum time in seconds that end user has to complete a survey. If the value is 0 or less, an end user has no time limit to finish a survey.
   * @see startTimer
   * @see maxTimeToFinishPage
   */
  public get maxTimeToFinish(): number {
    return this.getPropertyValue("maxTimeToFinish", 0);
  }
  public set maxTimeToFinish(val: number) {
    this.setPropertyValue("maxTimeToFinish", val);
  }
  /**
   * Gets or sets the maximum time in seconds that end user has to complete a page in the survey. If the value is 0 or less, an end user has no time limit.
   *
   * You may override this value for every page.
   * @see startTimer
   * @see maxTimeToFinish
   * @see PageModel.maxTimeToFinish
   */
  public get maxTimeToFinishPage(): number {
    return this.getPropertyValue("maxTimeToFinishPage", 0);
  }
  public set maxTimeToFinishPage(val: number) {
    this.setPropertyValue("maxTimeToFinishPage", val);
  }
  private getPageMaxTimeToFinish(page: PageModel) {
    if (!page || page.maxTimeToFinish < 0) return 0;
    return page.maxTimeToFinish > 0
      ? page.maxTimeToFinish
      : this.maxTimeToFinishPage;
  }
  private doTimer(page: PageModel): void {
    this.onTimer.fire(this, {});
    if (this.maxTimeToFinish > 0 && this.maxTimeToFinish == this.timeSpent) {
      this.completeLastPage();
    }
    if (page) {
      var pageLimit = this.getPageMaxTimeToFinish(page);
      if (pageLimit > 0 && pageLimit == page.timeSpent) {
        if (this.isLastPage) {
          this.completeLastPage();
        } else {
          this.nextPage();
        }
      }
    }
  }
  public get inSurvey(): boolean {
    return true;
  }
  //ISurveyImplementor
  getSurveyData(): ISurveyData {
    return this;
  }
  getSurvey(): ISurvey {
    return this;
  }
  getTextProcessor(): ITextProcessor {
    return this;
  }
  //ISurveyTriggerOwner
  getObjects(pages: string[], questions: string[]): any[] {
    var result: any[] = [];
    Array.prototype.push.apply(result, this.getPagesByNames(pages));
    Array.prototype.push.apply(result, this.getQuestionsByNames(questions));
    return result;
  }
  setTriggerValue(name: string, value: any, isVariable: boolean) {
    if (!name) return;
    if (isVariable) {
      this.setVariable(name, value);
    } else {
      var question = this.getQuestionByName(name);
      if (!!question) {
        question.value = value;
      } else {
        var processor = new ProcessValue();
        var firstName = processor.getFirstName(name);
        if (firstName == name) {
          this.setValue(name, value);
        } else {
          if (!this.getQuestionByName(firstName)) return;
          var data = this.getUnbindValue(this.getFilteredValues());
          processor.setValue(data, name, value);
          this.setValue(firstName, data[firstName]);
        }
      }
    }
  }
  copyTriggerValue(name: string, fromName: string) {
    if (!name || !fromName) return;
    var processor = new ProcessValue();
    var value = processor.getValue(fromName, this.getFilteredValues());
    this.setTriggerValue(name, value, false);
  }
  private isFocusingQuestion: boolean;
  /**
   * Focus question by its name. If needed change the current page on the page where question is located.
   * Function returns false if there is no question with this name or question is invisible, otherwise it returns true.
   * @param name question name
   */
  public focusQuestion(name: string): boolean {
    var question = this.getQuestionByName(name, true);
    if (!question || !question.isVisible || !question.page) return false;
    this.isFocusingQuestion = true;
    this.currentPage = <PageModel>question.page;
    question.focus();
    this.isFocusingQuestion = false;
    return true;
  }
  public getElementWrapperComponentName(element: any, reason?: string): string {
    if (reason === "logo-image") {
      return "sv-logo-image";
    }
    return SurveyModel.TemplateRendererComponentName;
  }
  public getQuestionContentWrapperComponentName(element: any): string {
    return SurveyModel.TemplateRendererComponentName;
  }
  public getRowWrapperComponentName(row: QuestionRowModel): string {
    return SurveyModel.TemplateRendererComponentName;
  }
  public getElementWrapperComponentData(element: any, reason?: string): any {
    return element;
  }
  public getRowWrapperComponentData(row: QuestionRowModel): any {
    return row;
  }
  public getItemValueWrapperComponentName(
    item: ItemValue,
    question: QuestionSelectBase
  ): string {
    return SurveyModel.TemplateRendererComponentName;
  }
  public getItemValueWrapperComponentData(
    item: ItemValue,
    question: QuestionSelectBase
  ): any {
    return item;
  }
  public getMatrixCellTemplateData(cell: any) {
    return cell.question;
  }
  public searchText(text: string): Array<IFindElement> {
    if (!!text) text = text.toLowerCase();
    var res: Array<IFindElement> = [];
    for (var i = 0; i < this.pages.length; i++) {
      this.pages[i].searchText(text, res);
    }
    return res;
  }
  public skeletonComponentName = "sv-skeleton";
  public getSkeletonComponentName(element: ISurveyElement): string {
    return this.skeletonComponentName;
  }
  /**
   * Use this method to dispose survey model properly.
   */
  public dispose() {
    this.currentPage = null;
    super.dispose();
    this.editingObj = null;
    if (!this.pages) return;
    for (var i = 0; i < this.pages.length; i++) {
      this.pages[i].dispose();
    }
    this.pages.splice(0, this.pages.length);
    if(this.disposeCallback) {
      this.disposeCallback();
    }
  }
  disposeCallback: () => void;
}

Serializer.addClass("survey", [
  {
    name: "locale",
    choices: () => {
      return surveyLocalization.getLocales(true);
    },
    onGetValue: (obj: any): any => {
      return obj.locale == surveyLocalization.defaultLocale ? null : obj.locale;
    },
  },
  { name: "title", serializationProperty: "locTitle", dependsOn: "locale" },
  {
    name: "description:text",
    serializationProperty: "locDescription",
    dependsOn: "locale",
  },
  { name: "logo", serializationProperty: "locLogo" },
  { name: "logoWidth", default: "300px", minValue: 0 },
  { name: "logoHeight", default: "200px", minValue: 0 },
  {
    name: "logoFit",
    default: "contain",
    choices: ["none", "contain", "cover", "fill"],
  },
  {
    name: "logoPosition",
    default: "left",
    choices: ["none", "left", "right", "top", "bottom"],
  },
  { name: "focusFirstQuestionAutomatic:boolean", default: true },
  { name: "focusOnFirstError:boolean", default: true },
  { name: "completedHtml:html", serializationProperty: "locCompletedHtml" },
  {
    name: "completedBeforeHtml:html",
    serializationProperty: "locCompletedBeforeHtml",
  },
  {
    name: "completedHtmlOnCondition:htmlconditions",
    className: "htmlconditionitem",
  },
  { name: "loadingHtml:html", serializationProperty: "locLoadingHtml" },
  { name: "pages:surveypages", className: "page" },
  {
    name: "questions",
    alternativeName: "elements",
    baseClassName: "question",
    visible: false,
    isLightSerializable: false,
    onGetValue: function (obj: any): any {
      return null;
    },
    onSetValue: function (obj: any, value: any, jsonConverter: any) {
      obj.pages.splice(0, obj.pages.length);
      var page = obj.addNewPage("");
      jsonConverter.toObject({ questions: value }, page);
    },
  },
  {
    name: "triggers:triggers",
    baseClassName: "surveytrigger",
    classNamePart: "trigger",
  },
  {
    name: "calculatedValues:calculatedvalues",
    className: "calculatedvalue",
  },
  { name: "surveyId", visible: false },
  { name: "surveyPostId", visible: false },
  { name: "surveyShowDataSaving:boolean", visible: false },
  "cookieName",
  "sendResultOnPageNext:boolean",
  {
    name: "showNavigationButtons",
    default: "bottom",
    choices: ["none", "top", "bottom", "both"],
  },
  { name: "showPrevButton:boolean", default: true },
  { name: "showTitle:boolean", default: true },
  { name: "showPageTitles:boolean", default: true },
  { name: "showCompletedPage:boolean", default: true },
  "navigateToUrl",
  {
    name: "navigateToUrlOnCondition:urlconditions",
    className: "urlconditionitem",
  },
  {
    name: "questionsOrder",
    default: "initial",
    choices: ["initial", "random"],
  },
  "showPageNumbers:boolean",
  {
    name: "showQuestionNumbers",
    default: "on",
    choices: ["on", "onPage", "off"],
  },
  {
    name: "questionTitleLocation",
    default: "top",
    choices: ["top", "bottom", "left"],
  },
  {
    name: "questionDescriptionLocation",
    default: "underTitle",
    choices: ["underInput", "underTitle"],
  },
  { name: "questionErrorLocation", default: "top", choices: ["top", "bottom"] },
  {
    name: "showProgressBar",
    default: "off",
    choices: ["off", "top", "bottom", "both"],
  },
  {
    name: "progressBarType",
    default: "pages",
    choices: [
      "pages",
      "questions",
      "requiredQuestions",
      "correctQuestions",
      "buttons",
    ],
  },
  { name: "mode", default: "edit", choices: ["edit", "display"] },
  { name: "storeOthersAsComment:boolean", default: true },
  { name: "maxTextLength:number", default: 0, minValue: 0 },
  { name: "maxOthersLength:number", default: 0, minValue: 0 },
  "goNextPageAutomatic:boolean",
  {
    name: "clearInvisibleValues",
    default: "onComplete",
    choices: ["none", "onComplete", "onHidden", "onHiddenContainer"],
  },
  {
    name: "checkErrorsMode",
    default: "onNextPage",
    choices: ["onNextPage", "onValueChanged", "onValueChanging", "onComplete"],
  },
  {
    name: "textUpdateMode",
    default: "onBlur",
    choices: ["onBlur", "onTyping"],
  },
  { name: "autoGrowComment:boolean", default: false },
  { name: "startSurveyText", serializationProperty: "locStartSurveyText" },
  { name: "pagePrevText", serializationProperty: "locPagePrevText" },
  { name: "pageNextText", serializationProperty: "locPageNextText" },
  { name: "completeText", serializationProperty: "locCompleteText" },
  { name: "previewText", serializationProperty: "locPreviewText" },
  { name: "editText", serializationProperty: "locEditText" },
  { name: "requiredText", default: "*" },
  {
    name: "questionStartIndex",
    dependsOn: ["showQuestionNumbers"],
    visibleIf: function (survey: any) {
      return !survey || survey.showQuestionNumbers !== "off";
    },
  },
  {
    name: "questionTitlePattern",
    default: "numTitleRequire",
    dependsOn: ["questionStartIndex", "requiredText"],
    choices: (obj: any) => {
      if (!obj) return [];
      return obj.getQuestionTitlePatternOptions();
    },
  },
  {
    name: "questionTitleTemplate",
    visible: false,
    isSerializable: false,
    serializationProperty: "locQuestionTitleTemplate",
  },
  { name: "firstPageIsStarted:boolean", default: false },
  {
    name: "isSinglePage:boolean",
    default: false,
    visible: false,
    isSerializable: false,
  },
  {
    name: "questionsOnPageMode",
    default: "standard",
    choices: ["singlePage", "standard", "questionPerPage"],
  },
  {
    name: "showPreviewBeforeComplete",
    default: "noPreview",
    choices: ["noPreview", "showAllQuestions", "showAnsweredQuestions"],
  },
  { name: "maxTimeToFinish:number", default: 0, minValue: 0 },
  { name: "maxTimeToFinishPage:number", default: 0, minValue: 0 },
  {
    name: "showTimerPanel",
    default: "none",
    choices: ["none", "top", "bottom"],
  },
  {
    name: "showTimerPanelMode",
    default: "all",
    choices: ["all", "page", "survey"],
  },
  {
    name: "widthMode",
    default: "auto",
    choices: ["auto", "static", "responsive"],
  }
]);
