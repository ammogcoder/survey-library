import { Question } from "../src/question";
import { QuestionHtmlModel } from "../src/question_html";
import { QuestionFactory } from "../src/questionfactory";
import { QuestionSelectBase } from "../src/question_baseselect";
import { QuestionTextModel } from "../src/question_text";
import { QuestionCommentModel } from "../src/question_comment";
import { SurveyModel } from "../src/survey";
import { QuestionCheckboxModel } from "../src/question_checkbox";
import { QuestionMatrixModel, MatrixRowModel } from "../src/question_matrix";
import {
  MultipleTextItemModel,
  QuestionMultipleTextModel,
} from "../src/question_multipletext";
import {
  NumericValidator,
  AnswerCountValidator,
  RegexValidator,
  ExpressionValidator,
} from "../src/validator";
import { QuestionRadiogroupModel } from "../src/question_radiogroup";
import { QuestionRankingModel } from "../src/question_ranking";
import { QuestionDropdownModel } from "../src/question_dropdown";
import { QuestionRatingModel } from "../src/question_rating";
import { QuestionBooleanModel } from "../src/question_boolean";
import { JsonObject, Serializer } from "../src/jsonobject";
import { ItemValue } from "../src/itemvalue";
import { QuestionMatrixDropdownModel } from "../src/question_matrixdropdown";
import { surveyLocalization } from "../src/surveyStrings";
import { settings } from "../src/settings";
import { QuestionImagePickerModel } from "../src/question_imagepicker";
import { FunctionFactory } from "../src/functionsfactory";
import { ArrayChanges } from "../src/base";
import { RequreNumericError } from "../src/error";
import { QuestionSignaturePadModel } from "../src/question_signaturepad";
import { QuestionMatrixDropdownModelBase } from "../src/question_matrixdropdownbase";
import { PanelModel } from "../src/panel";

export default QUnit.module("Survey_Questions");

class QuestionMatrixRandomModel extends QuestionMatrixModel {
  constructor(name: string) {
    super(name);
  }
  protected sortVisibleRows(
    array: Array<MatrixRowModel>
  ): Array<MatrixRowModel> {
    return array.length > 0 ? [array[1], array[0]] : array;
  }
}

QUnit.test("Only some questions support comment", function(assert) {
  var questionText = <Question>(
    QuestionFactory.Instance.createQuestion("text", "textQuestion")
  );

  assert.equal(
    questionText.supportComment(),
    false,
    "Text question doesn't support comment."
  );
  assert.equal(
    questionText.hasComment,
    false,
    "Text question doesn't support comment."
  );
  questionText.hasComment = true;
  assert.equal(
    questionText.hasComment,
    false,
    "You can't set has comment to the text question."
  );

  var questionDropDown = <Question>(
    QuestionFactory.Instance.createQuestion("dropdown", "dropdownQuestion")
  );
  assert.equal(
    questionDropDown.supportComment(),
    true,
    "Drop down question supports comment."
  );
  assert.equal(
    questionDropDown.hasComment,
    false,
    "Has comment is false by  default."
  );
  questionDropDown.hasComment = true;
  assert.equal(
    questionDropDown.hasComment,
    true,
    "You can set comment for drop down question."
  );
});
QUnit.test("Only some questions support other", function(assert) {
  var questionText = <Question>(
    QuestionFactory.Instance.createQuestion("text", "textQuestion")
  );

  assert.equal(
    questionText.supportOther(),
    false,
    "Text question doesn't support other."
  );
  assert.equal(
    questionText.hasOther,
    false,
    "Text question doesn't support other."
  );
  questionText.hasOther = true;
  assert.equal(
    questionText.hasOther,
    false,
    "You can't set has other to the text question."
  );

  var questionDropDown = <Question>(
    QuestionFactory.Instance.createQuestion("dropdown", "dropdownQuestion")
  );
  assert.equal(
    questionDropDown.supportOther(),
    true,
    "Drop down question supports other."
  );
  assert.equal(
    questionDropDown.hasOther,
    false,
    "Has other is false by  default."
  );
  questionDropDown.hasOther = true;
  assert.equal(
    questionDropDown.hasOther,
    true,
    "You can set other for drop down question."
  );
});
QUnit.test("Comment and other could not be set together", function(assert) {
  var questionDropDown = <Question>(
    QuestionFactory.Instance.createQuestion("dropdown", "dropdownQuestion")
  );
  assert.equal(
    questionDropDown.hasComment,
    false,
    "Initial comment is turn off."
  );
  assert.equal(questionDropDown.hasOther, false, "Initial other is turn off.");

  questionDropDown.hasOther = true;
  assert.equal(questionDropDown.hasOther, true, "set initially other to true");

  questionDropDown.hasComment = true;
  assert.equal(questionDropDown.hasComment, true, "After set comment to true");
  assert.equal(questionDropDown.hasOther, false, "After set comment to true");

  questionDropDown.hasOther = true;
  assert.equal(questionDropDown.hasComment, false, "After set other to true");
  assert.equal(questionDropDown.hasOther, true, "After set other to true");
});
QUnit.test("Keep comment if question value is null", function(assert) {
  var survey = new SurveyModel();
  var page = survey.addNewPage("p1");
  var question = <QuestionCheckboxModel>page.addNewQuestion("checkbox", "q1");
  question.choices = [1, 2, 3];
  question.hasComment = true;
  question.comment = "Comment";
  assert.deepEqual(survey.data, { "q1-Comment": "Comment" }, "Comment is here");
  survey.doComplete();
  assert.deepEqual(
    survey.data,
    { "q1-Comment": "Comment" },
    "Comment is still here after complete"
  );
});
QUnit.test("set choices from another question", function(assert) {
  Serializer.addProperty("itemvalue", "price");
  var q1 = new QuestionSelectBase("q1");
  q1.choices = [{ value: 1, text: "One", price: 4 }, "Two", "Three"];
  var q2 = new QuestionSelectBase("q2");
  q2.choices = q1.choices;
  assert.equal(q2.choices.length, 3, "all three were copied");
  assert.equal(q2.choices[0]["price"], 4, "additional data is copied");
  Serializer.removeProperty("itemvalue", "price");
});
QUnit.test("visibleChoices changes on setting others to true/false", function(
  assert
) {
  var question = new QuestionSelectBase("dropdownQuestion");
  question.choices = ["One", "Two", "Three"];
  assert.equal(
    question.visibleChoices.length,
    3,
    "By default visibleChoices equals to choices"
  );
  question.hasOther = true;
  assert.equal(
    question.visibleChoices.length,
    4,
    "Add one more item for others"
  );
  question.hasOther = false;
  assert.equal(question.visibleChoices.length, 3, "Remove the others item");
});
QUnit.test(
  "displayValue function for selecteBase questions, issue #483",
  function(assert) {
    var question = new QuestionSelectBase("dropdownQuestion");
    question.choices = [
      { value: 1, text: "Value 1" },
      { value: 2, text: "Value 2" },
    ];
    question.hasOther = true;
    assert.equal(
      question.displayValue,
      "",
      "value is null, displayValue is empty"
    );
    question.value = 1;
    assert.equal(
      question.displayValue,
      "Value 1",
      "the first value is selected"
    );
    question.value = 2;
    assert.equal(
      question.displayValue,
      "Value 2",
      "the second value is selected"
    );
    question.value = 3;
    assert.equal(
      question.displayValue,
      "3",
      "there is no value in the list, so show the value"
    );
    question.value = question.otherItem.value;
    assert.equal(
      question.displayValue,
      question.locOtherText.textOrHtml,
      "the other is selected"
    );
  }
);
QUnit.test("displayValue changed simultaniously with value", function(assert) {
  var survey = new SurveyModel();
  var page = survey.addNewPage("p");
  var question = new QuestionSelectBase("dropdownQuestion");
  question.choices = [
    { value: 1, text: "Value 1" },
    { value: 2, text: "Value 2" },
  ];
  page.addElement(question);
  assert.equal(question.displayValue, "", "Empty value");
  question.value = 1;
  assert.equal(question.displayValue, "Value 1", "value is 1");
  survey.setValue("dropdownQuestion", 2);
  assert.equal(question.displayValue, "Value 2", "value is 2");
});
QUnit.test("displayValue function for rating question, issue #1094", function(
  assert
) {
  var question = new QuestionRatingModel("q1");
  question.rateValues = [
    { value: 1, text: "Value 1" },
    { value: 2, text: "Value 2" },
  ];
  assert.equal(
    question.displayValue,
    "",
    "value is null, displayValue is empty"
  );
  question.value = 1;
  assert.equal(question.displayValue, "Value 1", "the first value is selected");
  question.value = 2;
  assert.equal(
    question.displayValue,
    "Value 2",
    "the second value is selected"
  );
  question.value = 3;
  assert.equal(
    question.displayValue,
    "3",
    "there is no value in the list, so show the value"
  );
});
QUnit.test("matrix.displayValue, bug #1087", function(assert) {
  var question = new QuestionMatrixModel("q1");
  question.rows = [
    { value: 1, text: "Row 1" },
    { value: 2, text: "Row 2" },
  ];
  question.columns = [
    { value: 1, text: "Column 1" },
    { value: 2, text: "Column 2" },
  ];
  question.value = { 1: 1, 2: 2 };
  assert.deepEqual(
    question.displayValue,
    { "Row 1": "Column 1", "Row 2": "Column 2" },
    "matrix question displayValue works correctly"
  );
});
QUnit.test("Question Title property", function(assert) {
  var question = new QuestionTextModel("q1");
  assert.equal(question.title, "q1", "get the question name by default");
  question.title = "My title";
  assert.equal(question.title, "My title", "get the question name by default");
});
QUnit.test("Question titleLocation", function(assert) {
  var survey = new SurveyModel();
  var page = survey.addNewPage("Page 1");
  var question1 = new QuestionTextModel("q1");
  var question2 = new QuestionTextModel("q1");
  page.addQuestion(question1);
  page.addQuestion(question2);
  assert.equal(question1.hasTitle, true, "By default it has title");
  assert.equal(question1.hasTitleOnTop, true, "By default it has title on top");
  assert.equal(
    question2.visibleIndex,
    1,
    "the second question has visible index 1"
  );
  question1.titleLocation = "hidden";
  assert.equal(question1.hasTitle, false, "Title is hidden");
  assert.equal(question1.hasTitleOnTop, false, "It doesn't show on top");
  assert.equal(
    question2.visibleIndex,
    0,
    "the second question has visible index 0 now"
  );
});
QUnit.test("Question titleDescription", function(assert) {
  var survey = new SurveyModel();
  var page = survey.addNewPage("Page 1");
  var question1 = new QuestionTextModel("q1");
  var question2 = new QuestionTextModel("q1");
  page.addQuestion(question1);
  page.addQuestion(question2);
  question1.description = "description";
  assert.equal(
    question1.hasDescriptionUnderTitle,
    true,
    "There is the description in question1"
  );
  question2.description = "description";
  question2.descriptionLocation = "underInput";
  assert.equal(
    question2.hasDescriptionUnderTitle,
    false,
    "question2-underInput"
  );
  assert.equal(
    question2.hasDescriptionUnderInput,
    true,
    "question2-underInput"
  );
  survey.questionDescriptionLocation = "underInput";
  assert.equal(
    question1.hasDescriptionUnderTitle,
    false,
    "survey.questionDescriptionLocation = 'underInput'"
  );
  assert.equal(
    question1.hasDescriptionUnderInput,
    true,
    "survey.questionDescriptionLocation = 'underInput'"
  );
});
QUnit.test("Use value of checkbox question as an array", function(assert) {
  var survey = new SurveyModel();
  var page = survey.addNewPage("Page 1");
  var question = new QuestionCheckboxModel("checkboxQuestion");
  question.choices = ["One", "Two", "Three"];
  page.addQuestion(question);

  question.value.push("One");
  assert.deepEqual(question.value, ["One"], "convert value to array");
});
QUnit.test("Assign the same empty value", function(assert) {
  var count = 0;
  var question = new QuestionCheckboxModel("checkboxQuestion");
  assert.deepEqual(question.value, [], "convert value to array");

  question.valueChangedCallback = function() {
    count++;
  };

  question.value = undefined;
  assert.equal(count, 0, "valueChangedCallback doesn't trigger with undefined");

  question.value = [];
  assert.equal(
    count,
    0,
    "valueChangedCallback doesn't trigger with empty array"
  );

  question.value = [1];
  assert.equal(count, 1, "valueChangedCallback triggers");

  question.value = [1];
  assert.equal(count, 1, "array the same");

  question.value = [1, 2];
  assert.equal(count, 2, "valueChangedCallback triggers");
});
QUnit.test("Pre-proccess value for Checkbox", function(assert) {
  var survey = new SurveyModel();
  var page = survey.addNewPage("Page 1");
  var question = new QuestionCheckboxModel("checkboxQuestion");
  question.choices = ["One", "Two", "Three"];
  page.addQuestion(question);

  survey.setValue("checkboxQuestion", "One");
  assert.deepEqual(question.value, ["One"], "convert value to array");
});
QUnit.test("Empty value for Checkbox", function(assert) {
  var question = new QuestionCheckboxModel("checkboxQuestion");
  question.choices = ["One", "Two", "Three"];
  assert.deepEqual(question.value, [], "empty array");
  question.value = ["One"];
  assert.deepEqual(question.value, ["One"], "value");
  question.value = [];
  assert.deepEqual(question.value, [], "empty array");
});
QUnit.test("Matrix Question: visible rows", function(assert) {
  var matrix = new QuestionMatrixModel("q1");
  assert.equal(matrix.hasRows, false, "There is now rows by default.");
  assert.equal(
    matrix.visibleRows.length,
    1,
    "There is always at least one row"
  );
  assert.equal(
    matrix.visibleRows[0].name,
    null,
    "The default row name is empty"
  );
  assert.equal(
    matrix.visibleRows[0].fullName,
    "q1",
    "The default row fullName is the question name"
  );
  matrix.rows = ["row1", "row2"];
  assert.equal(matrix.hasRows, true, "There are two rows");
  assert.equal(matrix.visibleRows.length, 2, "Use the added row");
  assert.equal(matrix.visibleRows[0].name, "row1", "the row name is 'row1'");
  assert.equal(
    matrix.visibleRows[0].fullName,
    matrix.id + "_row1",
    "The default row fullName is the question name"
  );
});
QUnit.test("Matrix Question: get/set values for empty rows", function(assert) {
  var matrix = new QuestionMatrixModel("q1");
  matrix.columns = ["col1", "col2"];
  matrix.value = "col1";
  var rows = matrix.visibleRows;
  assert.equal(rows[0].value, "col1", "set the row value correctly");
  rows[0].value = "col2";
  assert.equal(rows[0].value, "col2", "the row value changed");
  assert.equal(matrix.value, "col2", "the matrix value changed correctly");
});
QUnit.test("Matrix Question: get/set values for two rows", function(assert) {
  var matrix = new QuestionMatrixModel("q1");
  matrix.rows = ["row1", "row2"];
  matrix.columns = ["col1", "col2"];
  matrix.value = { row1: "col1" };
  var rows = matrix.visibleRows;
  assert.equal(rows[0].value, "col1", "set the row value correctly");
  rows[0].value = "col2";
  assert.equal(rows[0].value, "col2", "the row value changed");
  assert.deepEqual(
    matrix.value,
    { row1: "col2" },
    "the matrix value changed correctly, #1"
  );
  rows[1].value = "col1";
  assert.deepEqual(
    matrix.value,
    { row1: "col2", row2: "col1" },
    "the matrix value changed correctly, #2"
  );
});
QUnit.test("Matrix Question set values after visible row generated", function(
  assert
) {
  var matrix = new QuestionMatrixModel("q1");
  matrix.rows = ["row1", "row2"];
  matrix.columns = ["col1", "col2"];
  var rows = matrix.visibleRows;
  matrix.value = { row1: "col1" };
  assert.equal(rows[0].value, "col1", "set the row value correctly");
});
QUnit.test("Matrix Question sortVisibleRows", function(assert) {
  var matrix = new QuestionMatrixRandomModel("q1");
  matrix.rowsOrder = "random";
  matrix.rows = ["row1", "row2"];
  matrix.columns = ["col1", "col2"];
  var rows = matrix.visibleRows;
  assert.equal(rows[0].name, "row2", "rows has been reordered");
});
QUnit.test("Matrix Question isAllRowRequired property", function(assert) {
  var matrix = new QuestionMatrixModel("q1");
  matrix.rows = ["row1", "row2"];
  matrix.columns = ["col1", "col2"];
  assert.equal(matrix.hasErrors(), false, "There is no errors by default");
  matrix.isAllRowRequired = true;
  assert.equal(matrix.hasErrors(), true, "There is no errors by default");
});
QUnit.test(
  "Matrix Question isAllRowRequired property, value is zero, Bug#2332",
  function(assert) {
    var matrix = new QuestionMatrixModel("q1");
    matrix.fromJSON({
      type: "matrix",
      name: "question",
      isRequired: true,
      columns: [
        {
          value: 0,
          text: "No",
        },
        {
          value: 1,
          text: "Maybe",
        },
        {
          value: 2,
          text: "Yes",
        },
      ],
      rows: ["item1", "item2"],
      isAllRowRequired: true,
    });
    var rows = matrix.visibleRows;
    assert.equal(matrix.hasErrors(), true, "is Required error");
    rows[0].value = 0;
    assert.equal(matrix.hasErrors(), true, "isAllRowRequired error");
    rows[1].value = 0;
    assert.deepEqual(
      matrix.value,
      { item1: 0, item2: 0 },
      "value set correctly"
    );
    assert.equal(rows[0].value, 0, "First row value set correctly");
    assert.equal(rows[1].value, 0, "Second row value set correctly");
    assert.equal(matrix.hasErrors(), false, "There is no errors");
  }
);
QUnit.test("Matrix Question supportGoNextPageAutomatic property", function(
  assert
) {
  var matrix = new QuestionMatrixModel("q1");
  matrix.rows = ["row1", "row2"];
  matrix.columns = ["col1", "col2"];
  assert.equal(matrix.supportGoNextPageAutomatic(), false, "Rows are not set");
  matrix.value = { row1: "col1" };
  assert.equal(
    matrix.supportGoNextPageAutomatic(),
    false,
    "The second row is not set"
  );
  matrix.value = { row1: "col1", row2: "col1" };
  assert.equal(matrix.supportGoNextPageAutomatic(), true, "Both rows are set");
});

QUnit.test("Matrix Question clearIncorrectValues", function(assert) {
  var matrix = new QuestionMatrixModel("q1");
  matrix.rows = ["row1", "row2"];
  matrix.columns = ["col1", "col2"];
  matrix.value = { row1: "col2", row2: "col3", row3: "col1" };
  matrix.clearIncorrectValues();

  assert.deepEqual(
    matrix.value,
    { row1: "col2" },
    "Remove values with incorrect row and incorrect column"
  );
});

QUnit.test(
  "Matrix Question getFirstInputElementId - https://surveyjs.answerdesk.io/ticket/details/T2048",
  function(assert) {
    var matrix = new QuestionMatrixModel("q1");
    matrix.rows = ["row1", "row2"];
    matrix.columns = ["col1", "col2"];
    matrix.value = { row1: "col2", row2: "col3", row3: "col1" };

    assert.equal(
      matrix["getFirstInputElementId"](),
      matrix.inputId + "_row1_0",
      "First row name 0th control"
    );
  }
);

QUnit.test("Rubric Matrix Question cells get/set cell text", function(assert) {
  var matrix = new QuestionMatrixModel("q1");
  matrix.rows = ["row1", "row2"];
  matrix.columns = ["col1", "col2"];
  assert.equal(matrix.hasCellText, false, "There is no cell text");
  matrix.setCellText(0, 0, "cell11");
  assert.equal(matrix.hasCellText, true, "There is cell text");
  assert.equal(
    matrix.getCellText(0, 0),
    "cell11",
    "get/set by index works correctly"
  );
  matrix.setCellText(0, 0, "");
  assert.equal(matrix.hasCellText, false, "There is no cell text again");
});
QUnit.test("Rubric Matrix Question cells get cell displayText", function(
  assert
) {
  var matrix = new QuestionMatrixModel("q1");
  matrix.rows = ["row1", "row2"];
  matrix.columns = ["col1", "col2"];
  matrix.setCellText(0, 0, "cell11");
  assert.equal(
    matrix.getCellDisplayText(0, 0),
    "cell11",
    "get cell text by indexes"
  );
  assert.equal(
    matrix.getCellDisplayText(matrix.rows[0], matrix.columns[0]),
    "cell11",
    "get cell text by objects"
  );
  assert.equal(
    matrix.getCellDisplayText(matrix.rows[0], matrix.columns[1]),
    "col2",
    "get column text by indexes"
  );
  assert.equal(
    matrix.getCellDisplayText(matrix.rows[0], matrix.columns[1]),
    "col2",
    "get column text by objects"
  );
});

QUnit.test("Rubric Matrix Question cells serialize/deserialize", function(
  assert
) {
  var matrix = new QuestionMatrixModel("q1");
  matrix.rows = ["row1", "row2"];
  matrix.columns = ["col1", "col2"];
  matrix.setCellText(0, 0, "cell11");
  matrix.setCellText(0, 1, "cell12");
  matrix.setCellText(1, 1, "cell22");
  var json = new JsonObject().toJsonObject(matrix);
  assert.deepEqual(
    json,
    {
      name: "q1",
      rows: ["row1", "row2"],
      columns: ["col1", "col2"],
      cells: {
        row1: { col1: "cell11", col2: "cell12" },
        row2: { col2: "cell22" },
      },
    },
    "serialized correctly"
  );
  var matrix2 = new QuestionMatrixModel("q2");
  new JsonObject().toObject(json, matrix2);
  assert.equal(
    matrix2.getCellText(0, 0),
    "cell11",
    "deserialized correctly, cell11"
  );
  assert.equal(
    matrix2.getCellText(0, 1),
    "cell12",
    "deserialized correctly, cell12"
  );
  assert.equal(
    matrix2.getCellText(1, 1),
    "cell22",
    "deserialized correctly, cell22"
  );
});

QUnit.test("Rubric Matrix Question cells default row", function(assert) {
  var matrix = new QuestionMatrixModel("q1");
  matrix.rows = ["row1", "row2"];
  matrix.columns = ["col1", "col2"];
  matrix.setDefaultCellText(1, "defaultCell2");
  matrix.setCellText(0, 0, "cell11");

  assert.equal(matrix.getCellDisplayText(0, 0), "cell11", "Use cell text");
  assert.equal(
    matrix.getCellDisplayText(0, 1),
    "defaultCell2",
    "Use default row cell text"
  );
  assert.equal(matrix.getCellDisplayText(1, 0), "col1", "Use rows text");
  var json = new JsonObject().toJsonObject(matrix);
  assert.deepEqual(
    json,
    {
      name: "q1",
      rows: ["row1", "row2"],
      columns: ["col1", "col2"],
      cells: {
        default: { col2: "defaultCell2" },
        row1: { col1: "cell11" },
      },
    },
    "serialized correctly"
  );
  var matrix2 = new QuestionMatrixModel("q2");
  new JsonObject().toObject(json, matrix2);
  assert.equal(
    matrix2.getCellText(0, 0),
    "cell11",
    "deserialized correctly, cell11"
  );
  assert.equal(
    matrix2.getDefaultCellText(1),
    "defaultCell2",
    "deserialized default cell correctly, defaultCell2"
  );
});

QUnit.test("Multiple Text Item: text property", function(assert) {
  var mItem = new MultipleTextItemModel("text1");
  assert.equal(mItem.title, "text1", "get value from name");
  mItem.title = "display1";
  assert.equal(mItem.title, "display1", "get value from textValue");
});
QUnit.test("Multiple Text Question: get/set values for two texts", function(
  assert
) {
  var mText = new QuestionMultipleTextModel("q1");
  mText.items.push(new MultipleTextItemModel("text1"));
  mText.items.push(new MultipleTextItemModel("text2"));
  mText.value = { text1: "val1" };
  assert.equal(mText.items[0].value, "val1", "get the value from the question");
  mText.items[1].value = "val2";
  assert.deepEqual(
    mText.value,
    { text1: "val1", text2: "val2" },
    "set the value from the text item"
  );
});
QUnit.test(
  "Multiple Text Question: get/set values and properties via question text",
  function(assert) {
    var mText = new QuestionMultipleTextModel("q1");
    mText.items.push(new MultipleTextItemModel("text1"));
    mText.items.push(new MultipleTextItemModel("text2"));
    mText.value = { text1: "val1" };
    assert.ok(mText.items[0].editor, "question has been created");
    assert.equal(
      mText.items[0].editor.value,
      "val1",
      "the value is set correctly from the mText"
    );
    mText.items[0].editor.value = "newValue";
    assert.deepEqual(
      mText.value,
      { text1: "newValue" },
      "can set the value from question"
    );
    mText.items[0].title = "my title";
    assert.equal(
      mText.items[0].editor.title,
      "my title",
      "Title was set correctly"
    );
  }
);
QUnit.test("Multiple Text Question: support goNextPageAutomatic", function(
  assert
) {
  var mText = new QuestionMultipleTextModel("q1");
  mText.items.push(new MultipleTextItemModel("text1"));
  mText.items.push(new MultipleTextItemModel("text2"));

  assert.equal(mText.supportGoNextPageAutomatic(), false, "all text are empty");
  mText.value = { tex1: "val1" };
  assert.equal(
    mText.supportGoNextPageAutomatic(),
    false,
    "The second text is empty"
  );
  mText.value = { text1: "val1", text2: "val2" };
  assert.equal(
    mText.supportGoNextPageAutomatic(),
    true,
    "Both text inputs are set"
  );
});

QUnit.test(
  "Radiogroup Question: support goNextPageAutomatic + hasOther",
  function(assert) {
    var json = {
      pages: [
        {
          elements: [
            {
              type: "radiogroup",
              name: "q1",
              hasOther: true,
              items: [1, 2, 3],
            },
          ],
        },
        {
          elements: [
            {
              type: "text",
              name: "q2",
            },
          ],
        },
      ],
      goNextPageAutomatic: true,
    };
    var survey = new SurveyModel(json);
    var question = survey.getQuestionByName("q1");
    question.value = "other";
    assert.equal(survey.currentPageNo, 0, "Stay on the first page");
    question.comment = "123";
    assert.equal(survey.currentPageNo, 1, "Go to the second page");
  }
);

QUnit.test(
  "Radiogroup Question: support goNextPageAutomatic + hasOther + textUpdateMode = onTyping",
  function(assert) {
    var json = {
      pages: [
        {
          elements: [
            {
              type: "radiogroup",
              name: "q1",
              hasOther: true,
              items: [1, 2, 3],
            },
          ],
        },
        {
          elements: [
            {
              type: "text",
              name: "q2",
            },
          ],
        },
      ],
      textUpdateMode: "onTyping",
      goNextPageAutomatic: true,
    };
    var survey = new SurveyModel(json);
    var question = survey.getQuestionByName("q1");
    question.value = "other";
    assert.equal(survey.currentPageNo, 0, "Stay on the first page");
    question.comment = "123";
    assert.equal(survey.currentPageNo, 0, "Still stay on the first page");
  }
);

QUnit.test("Validators for text question + getAllErrors", function(assert) {
  var mText = new QuestionTextModel("");
  assert.equal(mText.hasErrors(), false, "There is no error by default");
  mText.validators.push(new NumericValidator(10, 20));
  assert.equal(
    mText.hasErrors(),
    false,
    "There is no error since the value is empty"
  );
  assert.equal(mText.getAllErrors().length, 0, "There is no error at all");
  mText.value = "ss";
  assert.equal(mText.hasErrors(), true, "The value should be numeric");
  assert.equal(mText.getAllErrors().length, 1, "There is an error");
  mText.value = 25;
  assert.equal(
    mText.hasErrors(),
    true,
    "The value should be between 10 and 20"
  );
  mText.value = "15";
  assert.equal(mText.hasErrors(), false, "The value is fine now.");
  assert.equal(mText.value, 15, "Convert to numeric");
});
QUnit.test("Numeric validation and with 0, Bug #462", function(assert) {
  var mText = new QuestionTextModel("");
  mText.validators.push(new NumericValidator(1, 100));
  mText.value = 0;
  assert.equal(mText.hasErrors(), true, "0 is less than 1");
});
QUnit.test("Use Email validator for inputType = email", function(assert) {
  var mText = new QuestionTextModel("");
  assert.equal(mText.validators.length, 0);
  mText.inputType = "email";
  mText.value = "1";
  assert.equal(mText.validators.length, 0, "There is no validators");
  assert.equal(mText.hasErrors(), true, "Email is wrong");
});

QUnit.test("Validators for multiple text question", function(assert) {
  var mText = new QuestionMultipleTextModel("q1");
  mText.items.push(new MultipleTextItemModel("t1"));
  assert.equal(mText.hasErrors(), false, "There is no error by default");
  assert.equal(mText.getAllErrors().length, 0, "There is no error at all");
  mText.items[0].validators.push(new NumericValidator(10, 20));
  mText.value = { t1: "ss" };
  assert.equal(mText.hasErrors(), true, "The value should be numeric");
  assert.equal(mText.getAllErrors().length, 1, "There is error in one item");
  mText.value = { t1: 25 };
  assert.equal(
    mText.hasErrors(),
    true,
    "The value should be between 10 and 20"
  );
  mText.value = { t1: 15 };
  assert.equal(mText.hasErrors(), false, "The value is fine now.");
  assert.equal(mText.items[0].value, 15, "Convert to numeric");
});
QUnit.test("Validators for array value question", function(assert) {
  var question = new QuestionCheckboxModel("q1");
  question.choices = ["item1", "item2", "item3", "item4", "item5"];
  question.value = ["item1"];
  assert.equal(question.hasErrors(), false, "There is no error by default");
  question.validators.push(new AnswerCountValidator(2, 3));
  question.value = ["item1"];
  assert.equal(
    question.hasErrors(),
    true,
    "It should be at least two items selected"
  );
  question.value = ["item1", "item2", "item3"];
  assert.equal(question.hasErrors(), false, "There is one item in value");
  question.value = ["item1", "item2", "item3", "item4"];
  assert.equal(question.hasErrors(), true, "It should be less than 3 items");
  question.value = ["item1", "item3"];
  assert.equal(question.hasErrors(), false, "There is two items in value");
});
QUnit.test("validator.toString()", function(assert) {
  var validator = new RegexValidator("[0-9]+");
  assert.equal(validator.toString(), "regex", "validator type");
  validator.text = "incorrect number";
  assert.equal(
    validator.toString(),
    "regex, incorrect number",
    "validator type + text"
  );
});

QUnit.test("Validators for other values - dropdown, Bug #722", function(
  assert
) {
  var question = new QuestionDropdownModel("q1");
  question.choices = ["1", "2", "3", "4", "5"];
  question.hasOther = true;
  question.value = "1";
  assert.equal(question.hasErrors(), false, "There is no validators");
  question.validators.push(new RegexValidator("[0-9]+"));
  assert.equal(question.hasErrors(), false, "There is no error, 1 is fine");
  question.value = question.otherItem.value;
  question.comment = "aaa";
  assert.equal(
    question.hasErrors(),
    true,
    "The comment doesn't math the regex"
  );
  question.comment = "222";
  assert.equal(question.hasErrors(), false, "The comment math the regex");
});
QUnit.test("Validators for other values - checkbox, Bug #722", function(
  assert
) {
  var question = new QuestionCheckboxModel("q1");
  question.choices = ["1", "2", "3", "4", "5"];
  question.hasOther = true;
  question.value = ["1", "2", question.otherItem.value];
  question.comment = "33";
  assert.equal(question.isOtherSelected, true, "Other is selected");
  question.validators.push(new RegexValidator("[0-9]+"));
  question.validators.push(new AnswerCountValidator(2, 3));
  assert.equal(question.hasErrors(), false, "validation pass correctly");
  question.comment = "aaa";
  assert.equal(question.hasErrors(), true, "'aaa' is not a number");
  question.comment = "11";
  assert.equal(question.hasErrors(), false, "it is fine again");
  question.value = [question.otherItem.value];
  assert.equal(
    question.hasErrors(),
    true,
    "There should be at least 2 values selected"
  );
  question.value = [];
  assert.equal(question.hasErrors(), false, "We do not check the empty array");
  question.value = undefined;
  assert.equal(question.hasErrors(), false, "We do not check the empty value");
});
QUnit.test(
  "other values in choices, hasOther=false, Bug(Editor) #242",
  function(assert) {
    var question = new QuestionRadiogroupModel("q1");
    question.choices = ["1", "2", "3", "other"];
    question.isRequired = true;
    question.value = "1";
    assert.equal(question.hasErrors(), false, "Everything is fine");
    question.value = "other";
    assert.equal(
      question.hasErrors(),
      false,
      "Everything is still fine, hasOther = false"
    );
  }
);
QUnit.test(
  "Boolean value set as string in item.value, Bug #T3118 (private)",
  function(assert) {
    var json = {
      elements: [
        { type: "radiogroup", name: "q1", choices: ["true", "false"] },
      ],
    };
    var survey = new SurveyModel(json);
    var question = <QuestionRadiogroupModel>survey.getQuestionByName("q1");
    survey.setValue("q1", true);
    assert.ok(question.selectedItem, "Item is selected");
    assert.equal(
      question.selectedItem.value,
      "true",
      "the first item is selected"
    );
    survey.setValue("q1", false);
    assert.ok(question.selectedItem, "Item is selected");
    assert.equal(
      question.selectedItem.value,
      "false",
      "the second item is selected"
    );
  }
);
QUnit.test("checkbox selectedItems property", function(assert) {
  var json = {
    elements: [
      {
        type: "checkbox",
        name: "q1",
        choices: ["item1", "item2", "item3"],
        hasOther: true,
      },
    ],
  };
  var survey = new SurveyModel(json);
  var question = <QuestionCheckboxModel>survey.getQuestionByName("q1");
  survey.setValue("q1", ["item1", "item2", "other"]);
  assert.equal(question.selectedItems.length, 3);
});
QUnit.test("Show errors if others value is selected, but not entered", function(
  assert
) {
  var radio = new QuestionRadiogroupModel("q1");
  new SurveyModel().addNewPage("p1").addQuestion(radio);
  radio.choices = ["one"];
  radio.hasOther = true;
  assert.equal(radio.hasErrors(), false, "There is no error by default");
  radio.value = radio.otherItem.value;
  assert.equal(radio.hasErrors(), true, "The other comment should be entered");
  radio.comment = "Many";
  assert.equal(radio.hasErrors(), false, "We have entered the comment");
});

QUnit.test("dropdown properties: choicesMin, choicesMax, choicesStep", function(
  assert
) {
  var q = new QuestionDropdownModel("q1");
  q.choices = ["one", "two"];
  q.choicesMin = 1;
  q.choicesMax = 20;
  assert.equal(
    q.visibleChoices.length,
    22,
    "genereated choices have been aded"
  );
  assert.equal(q.visibleChoices[0].value, "one", "from choices");
  assert.equal(q.visibleChoices[2].value, 1, "auto generated");
  q.hasOther = true;
  assert.equal(q.visibleChoices.length, 2 + 20 + 1, "has other has been aded");
  q.choicesStep = 2;
  assert.equal(
    q.visibleChoices.length,
    2 + 10 + 1,
    "we have in two less autogeneated items"
  );
});

QUnit.test(
  "Clear comment on unset the other value, Bug: https://surveyjs.answerdesk.io/ticket/details/T1916",
  function(assert) {
    var singleSelection = new QuestionDropdownModel("q1");
    var multipleSelection = new QuestionCheckboxModel("q2");
    var survey = new SurveyModel();
    survey.addNewPage("p1").addQuestion(singleSelection);
    survey.pages[0].addQuestion(multipleSelection);

    singleSelection.choices = ["one"];
    singleSelection.hasOther = true;
    singleSelection.value = singleSelection.otherItem.value;
    singleSelection.comment = "Comment1 is here";

    multipleSelection.choices = ["one"];
    multipleSelection.hasOther = true;
    multipleSelection.value = [multipleSelection.otherItem.value];
    multipleSelection.comment = "Comment2 is here";

    assert.equal(
      survey.getComment("q1"),
      "Comment1 is here",
      "Comment1 is in survey"
    );
    assert.equal(
      survey.getComment("q2"),
      "Comment2 is here",
      "Comment2 is in survey"
    );

    singleSelection.value = "one";
    assert.notOk(survey.getComment("q1"), "Comment1 is cleaned in survey");
    assert.notOk(singleSelection.comment, "Comment1 is cleaned in question1");

    multipleSelection.value = ["one"];
    assert.notOk(survey.getComment("q2"), "Comment2 is cleaned in survey");
    assert.notOk(multipleSelection.comment, "Comment2 is cleaned in question2");
  }
);

QUnit.test("SelectBase visibleChoices order", function(assert) {
  var question = new QuestionSelectBase("dropdownQuestion");
  question.choices = ["B", "A", "D", "C"];
  assert.equal(question.choicesOrder, "none", "The default value is 'none'");
  assert.equal(
    question.visibleChoices[0].calculatedText,
    "B",
    "By default visible choices is not sorted"
  );
  question.choicesOrder = "asc";
  assert.equal(
    question.visibleChoices[0].calculatedText,
    "A",
    "Sorted order is 'asc'"
  );
  question.choicesOrder = "desc";
  assert.equal(
    question.visibleChoices[0].calculatedText,
    "D",
    "Sorted order is 'desc'"
  );
});
QUnit.test("Question callbacks test", function(assert) {
  var question = new QuestionTextModel("textQuestion");
  var valueChanged = 0;
  var commentChanged = 0;
  var visibleChanged = 0;
  var visibleIndexChanged = 0;
  question.valueChangedCallback = function() {
    valueChanged++;
  };
  question.commentChangedCallback = function() {
    commentChanged++;
  };
  question.registerFunctionOnPropertyValueChanged("visible", function() {
    visibleChanged++;
  });
  question.registerFunctionOnPropertyValueChanged("visibleIndex", function() {
    visibleIndexChanged++;
  });
  question.value = "test";
  question.comment = "comment";
  question.visible = false;
  question.setVisibleIndex(5);
  assert.equal(valueChanged, 1, "value changed one time");
  assert.equal(commentChanged, 1, "comment changed one time");
  assert.equal(visibleChanged, 1, "visibiblity changed one time");
  assert.equal(visibleIndexChanged, 1, "visibleIndex changed one time");
});
QUnit.test(
  "Call valueChangedCallback on survey.setValue(), Bug# 1599",
  function(assert) {
    var survey = new SurveyModel();
    var page = survey.addNewPage();
    var question = page.addNewQuestion("text", "q1");
    var valueChanged = 0;
    question.valueChangedCallback = function() {
      valueChanged++;
    };
    assert.equal(valueChanged, 0, "value changed is not called");
    question.value = "va1";
    assert.equal(valueChanged, 1, "value changed is called the first time");
    survey.setValue("q1", "val2");
    assert.equal(valueChanged, 2, "value changed is called the second time");
  }
);
QUnit.test("Init SelectBase with comment comment", function(assert) {
  var survey = new SurveyModel();
  survey.data = { q: "other", "q-Comment": "aaaa" };
  survey.addNewPage("page1");
  var question = new QuestionSelectBase("q");
  question.choices = ["A", "B", "C", "D"];
  question.hasOther = true;
  survey.pages[0].addQuestion(question);
  assert.equal(question.comment, "aaaa", "Set the initial comment");
});
QUnit.test("SelectBase store others value not in comment", function(assert) {
  var survey = new SurveyModel();
  survey.addNewPage("page1");
  var question = new QuestionSelectBase("q");
  question.choices = ["A", "B", "C", "D"];
  question.hasOther = true;
  survey.pages[0].addQuestion(question);
  survey.storeOthersAsComment = false;

  question.value = null;
  assert.equal(question.isOtherSelected, false, "Others is not selected");
  assert.deepEqual(survey.data, {}, "There is no data in survey");

  question.value = "A";
  question.comment = "test";
  assert.equal(question.isOtherSelected, false, "Others is not selected");
  assert.deepEqual(survey.data, { q: "A" }, "'A' is set");

  question.comment = null;
  question.value = question.otherItem.value;
  assert.equal(
    question.isOtherSelected,
    true,
    "Any other value that is not from choices is other"
  );
  assert.deepEqual(
    survey.data,
    { q: question.otherItem.value },
    "Other Item is set"
  );

  question.comment = "commentTest";
  assert.equal(
    question.isOtherSelected,
    true,
    "Any other value that is not from choices is other"
  );
  assert.deepEqual(survey.data, { q: "commentTest" }, "Other text is set");

  survey.setValue("q", "A");
  assert.equal(question.isOtherSelected, false, "Others is not selected");
  assert.deepEqual(question.value, "A", "'A' is set to the question");

  survey.setValue("q", "FF");
  assert.equal(question.isOtherSelected, true, "set other from survey");
  assert.equal(
    question.renderedValue,
    question.otherItem.value,
    "value is otherItem.value"
  );
  assert.equal(question.value, "FF", "value equals to survey.getValue");
  assert.equal(question.comment, "FF", "comment set correctly");

  question.value = "B";
  assert.equal(question.isOtherSelected, false, "Others is not selected");
  assert.deepEqual(survey.data, { q: "B" }, "'B' is set");
});
QUnit.test("Checkbox store others value not in comment", function(assert) {
  var survey = new SurveyModel();
  survey.addNewPage("page1");
  var question = new QuestionCheckboxModel("q");
  question.choices = ["A", "B", "C", "D"];
  question.hasOther = true;
  survey.pages[0].addQuestion(question);
  survey.storeOthersAsComment = false;

  question.value = null;
  assert.equal(question.isOtherSelected, false, "Others is not selected");
  assert.deepEqual(survey.data, {}, "There is no data in survey");

  question.value = ["A"];
  question.comment = "test";
  assert.equal(question.isOtherSelected, false, "Others is not selected");
  assert.deepEqual(survey.data, { q: ["A"] }, "'A' is set");

  question.comment = null;
  question.value = ["A", question.otherItem.value];
  assert.equal(
    question.isOtherSelected,
    true,
    "Any other value that is not from choices is other"
  );
  assert.deepEqual(
    survey.data,
    { q: ["A", question.otherItem.value] },
    "Other Item is set"
  );

  question.comment = "commentTest";
  assert.equal(
    question.isOtherSelected,
    true,
    "Any other value that is not from choices is other"
  );
  assert.deepEqual(
    survey.data,
    { q: ["A", "commentTest"] },
    "Other text is set"
  );

  survey.setValue("q", ["A"]);
  assert.equal(question.isOtherSelected, false, "Others is not selected");
  assert.deepEqual(question.value, ["A"], "'A' is set to the question");

  survey.setValue("q", ["A", "FF"]);
  assert.equal(question.isOtherSelected, true, "set other from survey");
  assert.deepEqual(
    question.value,
    ["A", "FF"],
    "value equals to survey.getValue"
  );
  assert.deepEqual(
    question.renderedValue,
    ["A", question.otherItem.value],
    "value is otherItem.value"
  );

  question.value = ["A", "B"];
  assert.equal(question.isOtherSelected, false, "Others is not selected");
  assert.deepEqual(survey.data, { q: ["A", "B"] }, "'B' is set");
});
QUnit.test("Checkbox store others value not in comment", function(assert) {
  var survey = new SurveyModel({
    elements: [
      {
        type: "checkbox",
        name: "q1",
        defaultValue: ["A", "B"],
        hasOther: true,
      },
    ],
  });
  var question = <QuestionCheckboxModel>survey.getQuestionByName("q1");
  survey.mode = "display";
  assert.deepEqual(
    question.renderedValue,
    ["A", "B"],
    "do not convert value into others"
  );
  question.choices = ["A", "B", "C"];
  assert.deepEqual(
    question.renderedValue,
    ["A", "B"],
    "do not convert value into others, #2"
  );
});

QUnit.test(
  "Checkbox store others value not in comment after select another items - https://github.com/surveyjs/survey-library/issues/2221",
  function(assert) {
    var survey = new SurveyModel();
    survey.addNewPage("page1");
    var question = new QuestionCheckboxModel("q");
    question.choices = ["A", "B", "C", "D"];
    question.hasOther = true;
    question.storeOthersAsComment = false;
    survey.pages[0].addQuestion(question);
    // survey.storeOthersAsComment = false;

    question.value = null;
    assert.equal(question.isOtherSelected, false, "Others is not selected");
    assert.deepEqual(survey.data, {}, "There is no data in survey");

    question.comment = null;
    question.value = ["A", question.otherItem.value];
    assert.equal(
      question.isOtherSelected,
      true,
      "Any other value that is not from choices is other"
    );
    assert.deepEqual(
      survey.data,
      { q: ["A", question.otherItem.value] },
      "Other Item is set"
    );
    question.comment = "commentTest";
    assert.equal(
      question.isOtherSelected,
      true,
      "Any other value that is not from choices is other"
    );
    assert.deepEqual(
      survey.data,
      { q: ["A", "commentTest"] },
      "Other text is set"
    );

    question.value = ["A", question.otherItem.value, "B"];
    assert.deepEqual(
      question.value,
      ["A", "commentTest", "B"],
      "'commentTest' is still set to the question"
    );
    assert.deepEqual(
      survey.data,
      { q: ["A", "commentTest", "B"] },
      "'commentTest' is still set in the survey data"
    );
  }
);

QUnit.test("radiogroup.renderedValue - simple synhronization", function(
  assert
) {
  var survey = new SurveyModel();
  survey.addNewPage("page1");
  var question = new QuestionSelectBase("q");
  question.choices = ["A", "B", "C", "D"];
  question.hasOther = true;
  survey.pages[0].addQuestion(question);

  question.value = "A";
  assert.equal(
    question.renderedValue,
    "A",
    "renderedValue set correctly, question.value"
  );
  assert.equal(
    survey.getValue("q"),
    "A",
    "survey has correct value, question.value"
  );
  survey.setValue("q", "B");
  assert.equal(
    question.renderedValue,
    "B",
    "renderedValue set correctly, survey.setValue"
  );
  assert.equal(
    question.value,
    "B",
    "question.value set correctly, survey.setValue"
  );
  question.renderedValue = "C";
  assert.equal(
    question.value,
    "C",
    "question.value set correctly, survey.rendredValue"
  );
  assert.equal(
    survey.getValue("q"),
    "C",
    "survey has correct value, question.rendredValue"
  );
});
QUnit.test("radiogroup.renderedValue - storeOthersAsComment = false;", function(
  assert
) {
  var survey = new SurveyModel();
  survey.addNewPage("page1");
  var question = new QuestionSelectBase("q");
  question.choices = ["A", "B", "C", "D"];
  question.hasOther = true;
  survey.storeOthersAsComment = false;
  survey.pages[0].addQuestion(question);

  question.value = "A";
  assert.equal(
    question.renderedValue,
    "A",
    "renderedValue set correctly, question.value"
  );
  assert.equal(
    survey.getValue("q"),
    "A",
    "survey has correct value, question.value"
  );
  survey.setValue("q", "B");
  assert.equal(
    question.renderedValue,
    "B",
    "renderedValue set correctly, survey.setValue"
  );
  assert.equal(
    question.value,
    "B",
    "question.value set correctly, survey.setValue"
  );
  question.renderedValue = "C";
  assert.equal(
    question.value,
    "C",
    "question.value set correctly, survey.rendredValue"
  );
  assert.equal(
    survey.getValue("q"),
    "C",
    "survey has correct value, question.rendredValue"
  );

  question.renderedValue = "other";
  assert.equal(
    question.value,
    "other",
    "question.value set correctly, survey.rendredValue"
  );
  assert.equal(
    survey.getValue("q"),
    "other",
    "survey has correct value, question.rendredValue"
  );
  question.comment = "Some value";
  assert.equal(
    question.value,
    "Some value",
    "question.value, comment as value"
  );
  assert.equal(
    survey.getValue("q"),
    "Some value",
    "survey.getValue, comment as value"
  );
  question.value = "A";
  assert.equal(
    question.renderedValue,
    "A",
    "renderedValue set correctly, survey.setValue"
  );
  survey.setValue("q", "X");
  assert.equal(question.value, "X", "question.value = survey.getValue");
  assert.equal(question.renderedValue, "other", "renderedValue is other");
  assert.equal(question.comment, "X", "set comment");
});
QUnit.test("checkbox.renderedValue - storeOthersAsComment = false;", function(
  assert
) {
  var survey = new SurveyModel();
  survey.addNewPage("page1");
  var question = new QuestionCheckboxModel("q");
  question.choices = ["A", "B", "C", "D"];
  question.hasOther = true;
  survey.storeOthersAsComment = false;
  survey.pages[0].addQuestion(question);

  question.value = ["A", "B"];
  assert.deepEqual(
    question.renderedValue,
    ["A", "B"],
    "renderedValue set correctly, question.value"
  );
  assert.deepEqual(
    survey.getValue("q"),
    ["A", "B"],
    "survey has correct value, question.value"
  );
  survey.setValue("q", ["B", "C"]);
  assert.deepEqual(
    question.renderedValue,
    ["B", "C"],
    "renderedValue set correctly, survey.setValue"
  );
  assert.deepEqual(
    question.value,
    ["B", "C"],
    "question.value set correctly, survey.setValue"
  );
  question.renderedValue = ["A", "C"];
  assert.deepEqual(
    question.value,
    ["A", "C"],
    "question.value set correctly, survey.rendredValue"
  );
  assert.deepEqual(
    survey.getValue("q"),
    ["A", "C"],
    "survey has correct value, question.rendredValue"
  );

  question.renderedValue = ["B", "other"];
  assert.deepEqual(
    question.value,
    ["B", "other"],
    "question.value set correctly, survey.rendredValue"
  );
  assert.deepEqual(
    survey.getValue("q"),
    ["B", "other"],
    "survey has correct value, question.rendredValue"
  );
  question.comment = "Some value";
  assert.deepEqual(
    question.renderedValue,
    ["B", "other"],
    "question.value, comment as value"
  );
  assert.deepEqual(
    question.value,
    ["B", "Some value"],
    "question.value, comment as value"
  );
  assert.deepEqual(
    survey.getValue("q"),
    ["B", "Some value"],
    "survey.getValue, comment as value"
  );
  question.value = ["A", "C"];
  assert.deepEqual(
    question.renderedValue,
    ["A", "C"],
    "renderedValue set correctly, survey.setValue"
  );
  survey.setValue("q", ["B", "X"]);
  assert.deepEqual(
    question.value,
    ["B", "X"],
    "question.value = survey.getValue"
  );
  assert.deepEqual(
    question.renderedValue,
    ["B", "other"],
    "renderedValue is other"
  );
  assert.equal(question.comment, "X", "set comment");
});
QUnit.test("checkbox.renderedValue - hasNone = true, Bug #1609", function(
  assert
) {
  var survey = new SurveyModel();
  survey.addNewPage("page1");
  var question = new QuestionCheckboxModel("q");
  question.choices = ["A", "B", "C", "D"];
  question.hasNone = true;
  survey.pages[0].addQuestion(question);

  question.value = ["A", "B"];
  assert.deepEqual(
    question.renderedValue,
    ["A", "B"],
    "renderedValue set correctly, question.value"
  );
  question.renderedValue = ["A", "B", "none"];
  assert.deepEqual(question.value, ["none"], "value set correctly - 'none'");
  assert.deepEqual(
    question.renderedValue,
    ["none"],
    "renderedValue set correctly - 'none'"
  );
});
QUnit.test(
  "checkbox.renderedValue - hasNone = true and survey.storeOthersAsComment = false, Bug #1609",
  function(assert) {
    var survey = new SurveyModel();
    survey.storeOthersAsComment = false;
    survey.addNewPage("page1");
    var question = new QuestionCheckboxModel("q");
    question.choices = ["A", "B", "C", "D"];
    question.hasNone = true;
    survey.pages[0].addQuestion(question);

    question.value = ["A", "B"];
    assert.deepEqual(
      question.renderedValue,
      ["A", "B"],
      "renderedValue set correctly, question.value"
    );
    question.renderedValue = ["A", "B", "none"];
    assert.deepEqual(question.value, ["none"], "value set correctly - 'none'");
    assert.deepEqual(
      question.renderedValue,
      ["none"],
      "renderedValue set correctly - 'none'"
    );
  }
);
QUnit.test(
  "radiogroup.hasOthers = true and survey.storeOthersAsComment = false, Bug https://surveyjs.answerdesk.io/ticket/details/T1789",
  function(assert) {
    var json = {
      storeOthersAsComment: false,
      questions: [
        {
          type: "radiogroup",
          name: "q1",
          choices: [1, 2],
          hasOther: true,
        },
        {
          type: "checkbox",
          name: "q2",
          choices: [1, 2],
          hasOther: true,
        },
      ],
    };
    var survey = new SurveyModel(json);
    var data = { q1: "other 1", q2: [1, "other 2"] };
    survey.data = data;
    survey.doComplete();
    assert.deepEqual(survey.data, data, "The data is correct");
  }
);

QUnit.test("Text inputType=number", function(assert) {
  var question = new QuestionTextModel("text");
  question.inputType = "number";
  question.value = "2";
  assert.strictEqual(question.value, 2, "make it numeric");
  question.value = "2.25";
  assert.strictEqual(question.value, 2.25, "make it numeric/float");
  question.value = "2.25sdd";
  assert.ok(!question.value, "it is empty");
  question.value = "0";
  assert.strictEqual(question.value, 0, "zero value");
});
QUnit.test("Text inputType=range", function(assert) {
  var question = new QuestionTextModel("text");
  question.inputType = "range";
  question.value = "25";
  assert.strictEqual(question.value, 25, "make it numeric");
});
QUnit.test("Text questions spaces is not a valid answer for required", function(
  assert
) {
  var question = new QuestionTextModel("text");
  question.isRequired = true;
  assert.equal(question.hasErrors(), true, "Question is empty");
  assert.equal(
    question.errors[0].locText.textOrHtml,
    "Response required.",
    "error has correct text"
  );
  question.value = "  ";
  assert.equal(question.hasErrors(), true, "spaces is not an answer");
  question.value = " 1 ";
  assert.equal(question.hasErrors(), false, "got the answer");
});
QUnit.test("Custom text in required error", function(assert) {
  var question = new QuestionTextModel("text");
  question.requiredErrorText = "Custom required error";
  question.isRequired = true;
  assert.equal(question.hasErrors(), true, "Question is empty");
  assert.equal(question.errors.length, 1, "There is one error");
  assert.equal(
    question.errors[0].locText.textOrHtml,
    "Custom required error",
    "there is a custom errror text"
  );
});
QUnit.test("Boolean question checkedValue", function(assert) {
  var question = new QuestionBooleanModel("bool");
  assert.equal(question.checkedValue, null, "Indertemenated by default");
  question.value = true;
  assert.equal(
    question.checkedValue,
    true,
    "value == true, checkedvalue == true"
  );
  question.value = false;
  assert.equal(
    question.checkedValue,
    false,
    "value == false, checkedvalue == false"
  );
  question.value = null;
  assert.equal(
    question.checkedValue,
    null,
    "value == null, checkedvalue == null"
  );
  question.value = "a";
  assert.equal(
    question.checkedValue,
    false,
    "value == 'a', checkedvalue == false"
  );
});
QUnit.test("Boolean question valueTrue, valueFalse", function(assert) {
  var question = new QuestionBooleanModel("bool");
  question.valueTrue = "yes";
  question.valueFalse = "no";
  assert.equal(question.checkedValue, null, "Indertemenated by default");
  question.value = "yes";
  assert.equal(
    question.checkedValue,
    true,
    "value == 'yes', checkedvalue == true"
  );
  question.value = "no";
  assert.equal(
    question.checkedValue,
    false,
    "value == 'no', checkedvalue == false"
  );
  question.checkedValue = true;
  assert.equal(question.value, "yes", "checkedvalue == true, value = 'yes'");
  question.checkedValue = false;
  assert.equal(question.value, "no", "checkedvalue == false, value = 'no'");
});
QUnit.test("Boolean question defaultValue", function(assert) {
  var question = new QuestionBooleanModel("bool");
  assert.equal(question.checkedValue, null, "Indertemenated by default");
  question.defaultValue = "true";
  assert.equal(
    question.checkedValue,
    true,
    "defaultValue is set to 'true', checkedvalue == true"
  );
  question.defaultValue = "false";
  assert.equal(
    question.checkedValue,
    true,
    "defaultValue is set to 'false', but value has been already set to checkedvalue == true"
  );

  var survey = new SurveyModel();
  survey.addNewPage("p1");
  survey.pages[0].addQuestion(question);
  assert.deepEqual(survey.data, { bool: false }, "add question into survey");
});

QUnit.test("Boolean question defaultValue as a boolean values", function(
  assert
) {
  var question = new QuestionBooleanModel("bool");
  assert.equal(question.checkedValue, null, "Indertemenated by default");
  question.defaultValue = true;
  assert.equal(question.defaultValue, "true", "default value is true");
  assert.equal(
    question.checkedValue,
    true,
    "defaultValue is set to 'true', checkedvalue == true"
  );
  question.defaultValue = false;
  assert.equal(question.defaultValue, "false", "default value is false");
  assert.equal(
    question.checkedValue,
    true,
    "defaultValue is set to 'false', but value has been already set to checkedvalue == true"
  );

  var survey = new SurveyModel();
  survey.addNewPage("p1");
  survey.pages[0].addQuestion(question);
  assert.deepEqual(survey.data, { bool: false }, "add question into survey");
});

QUnit.test("Boolean question read only checkedValue", function(assert) {
  var question = new QuestionBooleanModel("bool");
  question.readOnly = true;
  assert.equal(question.checkedValue, null, "Indertemenated by default");
  question.checkedValue = false;
  assert.equal(
    question.checkedValue,
    null,
    "Indertemenated by default is not changed due to read only mode"
  );
  question.checkedValue = true;
  assert.equal(
    question.checkedValue,
    null,
    "Indertemenated by default is not changed due to read only mode"
  );
});

QUnit.test("defaultValue and hasOther - radiogroup, bug#384 (Editor)", function(
  assert
) {
  var json = {
    elements: [
      {
        type: "radiogroup",
        name: "q1",
        choices: [1, 2, 3],
        hasOther: true,
        defaultValue: "otherValue",
      },
    ],
  };
  var survey = new SurveyModel(json);
  var question = <QuestionRadiogroupModel>survey.getQuestionByName("q1");
  assert.equal(question.isOtherSelected, true, "The other is selected");
  assert.equal(question.comment, "otherValue", "other value is set");
});

QUnit.test("defaultValue and hasOther - checkbox, bug#384 (Editor)", function(
  assert
) {
  var json = {
    elements: [
      {
        type: "checkbox",
        name: "q1",
        choices: [1, 2, 3],
        hasOther: true,
        defaultValue: [2, "otherValue"],
      },
    ],
  };
  var survey = new SurveyModel(json);
  var question = <QuestionCheckboxModel>survey.getQuestionByName("q1");
  assert.equal(question.isOtherSelected, true, "The other is selected");
  assert.deepEqual(
    question.renderedValue,
    [2, "other"],
    "rendredValue set correctly"
  );
  assert.deepEqual(question.value, [2, "otherValue"], "value set correctly");
  assert.equal(question.comment, "otherValue", "other value is set");
});

QUnit.test(
  "defaultValue for checkbox where value is object, bug: https://surveyjs.answerdesk.io/ticket/details/T2055",
  function(assert) {
    var json = {
      pages: [
        {
          name: "page1",
          elements: [
            {
              type: "checkbox",
              name: "q1",
              defaultValue: [
                {
                  id: "2",
                  test: "a2",
                },
                {
                  id: "3",
                  test: "a2",
                },
              ],
              choices: [
                {
                  value: {
                    id: "1",
                    test: "a1",
                  },
                  text: "a1",
                },
                {
                  value: {
                    id: "2",
                    test: "a2",
                  },
                  text: "a2",
                },
                {
                  value: {
                    id: "3",
                    test: "a3",
                  },
                  text: "a3",
                },
              ],
            },
          ],
        },
      ],
    };
    var survey = new SurveyModel(json);
    var question = <QuestionCheckboxModel>survey.getQuestionByName("q1");
    assert.equal(
      question.isItemSelected(question.choices[0]),
      false,
      "Item[0] is not selected"
    );
    assert.equal(
      question.isItemSelected(question.choices[1]),
      true,
      "Item[1] is selected"
    );
    assert.equal(
      question.isItemSelected(question.choices[2]),
      false,
      "Item[2] is not selected"
    );
    survey.doComplete();
    assert.deepEqual(
      question.value,
      [
        {
          id: "2",
          test: "a2",
        },
      ],
      "Initial value set correctly"
    );
    assert.ok(
      question.value[0] === question.choices[1].value,
      "Chosen exactly choice item value"
    );
  }
);

QUnit.test(
  "defaultValue for radiogroup where value is object, bug: https://surveyjs.answerdesk.io/ticket/details/T2055",
  function(assert) {
    var json = {
      pages: [
        {
          name: "page1",
          elements: [
            {
              type: "radiogroup",
              name: "q1",
              defaultValue: {
                id: "2",
                test: "a2",
              },
              choices: [
                {
                  value: {
                    id: "1",
                    test: "a1",
                  },
                  text: "a1",
                },
                {
                  value: {
                    id: "2",
                    test: "a2",
                  },
                  text: "a2",
                },
                {
                  value: {
                    id: "3",
                    test: "a3",
                  },
                  text: "a3",
                },
              ],
            },
          ],
        },
      ],
    };
    var survey = new SurveyModel(json);
    var question = <QuestionRadiogroupModel>survey.getQuestionByName("q1");
    assert.ok(
      question.value === question.choices[1].value,
      "Chosen exactly choice item value"
    );
    survey.doComplete();
    assert.deepEqual(
      question.value,
      {
        id: "2",
        test: "a2",
      },
      "Initial value is set correctly"
    );
  }
);

QUnit.test("Rating question, visibleRateValues property", function(assert) {
  var rate = new QuestionRatingModel("q1");
  assert.equal(
    rate.visibleRateValues.length,
    5,
    "There are 5 items by default"
  );
  rate.rateMin = 6;
  assert.equal(rate.rateMin, 4, "the min is max - step");
  rate.rateMin = 2;
  rate.rateMax = 1;
  assert.equal(rate.rateMax, 3, "the min is min + step");
  rate.rateMin = 2;
  rate.rateMax = 7;
  rate.rateStep = 10;
  assert.equal(rate.rateStep, 5, "the step is max - min");
  rate.rateStep = 2;
  rate.rateMax = 200;
  assert.equal(
    rate.visibleRateValues.length,
    settings.ratingMaximumRateValueCount,
    "Values can be more than MaximumRateValueCount."
  );
  rate.rateValues = [1, 2, 3];
  assert.equal(rate.visibleRateValues.length, 3, "Use rate values");
});

QUnit.test("Rating question, renderedRateItems", function(assert) {
  var rate = new QuestionRatingModel("q1");
  assert.equal(
    rate.visibleRateValues.length,
    5,
    "There are 5 items by default"
  );

  assert.notOk(rate.hasMinLabel, "Rating has no min label by default");
  assert.notOk(rate.hasMaxLabel, "Rating has no max label by default");

  rate.minRateDescription = "Worst";
  rate.maxRateDescription = "Best";

  assert.deepEqual(rate.renderedRateItems.map(r=> r.locText.renderedHtml),
    ["1", "2", "3", "4", "5"],
    "List of numeric values"
  );
  assert.ok(rate.hasMinLabel, "Rating has min label");
  assert.ok(rate.hasMaxLabel, "Rating has max label");

  rate.displayRateDescriptionsAsExtremeItems = true;
  assert.deepEqual(rate.renderedRateItems.map(r=> r.locText.renderedHtml),
    ["Worst", "2", "3", "4", "Best"],
    "List of numeric values and min/max"
  );
  assert.notOk(rate.hasMinLabel, "Rating has no min label");
  assert.notOk(rate.hasMaxLabel, "Rating has no max label");
});

QUnit.test(
  "Rating question, visibleRateValues property load from JSON",
  function(assert) {
    var survey = new SurveyModel({
      elements: [
        {
          type: "rating",
          name: "q1",
          rateMin: 40,
          rateMax: 90,
          rateStep: 10,
        },
      ],
    });
    var rate = <QuestionRatingModel>survey.getQuestionByName("q1");
    assert.equal(rate.rateMin, 40, "the min is 40");
    assert.equal(rate.rateMax, 90, "the max is 90");
    assert.equal(rate.rateStep, 10, "the step is 10");
    assert.equal(
      rate.visibleRateValues.length,
      6,
      "There are 5 items by default"
    );
    var values = rate.visibleRateValues;
    assert.equal(values[0].value, 40, "The first is 40");
    assert.equal(values[1].value, 50, "The second is 50");
    assert.equal(values[5].value, 90, "The last is 90");
  }
);
QUnit.test("defaultValue propeprty as array", function(assert) {
  var question = new QuestionCheckboxModel("q1");
  assert.notOk(question.defaultValue, "It is empty by default");
  question.defaultValue = [1];
  assert.deepEqual(question.defaultValue, [1], "It is not empty no");
  question.defaultValue = null;
  assert.deepEqual(question.defaultValue, [], "It is empty by default");
});
QUnit.test("Restore/Store item value in checkbox on hiding/showing", function(
  assert
) {
  var survey = new SurveyModel({
    elements: [
      {
        type: "checkbox",
        name: "q2",
        choices: [
          "item1",
          "item2",
          {
            value: "item3",
            text: "item3 - conditional Item",
            visibleIf: "{q1}='yes'",
          },
          "item4",
          "item5",
        ],
        defaultValue: ["item1", "item3", "item5"],
      },
    ],
  });
  var question = <QuestionCheckboxModel>survey.getQuestionByName("q2");
  assert.deepEqual(
    question.value,
    ["item1", "item5"],
    "item3 is invisible - remove it"
  );
  survey.setValue("q1", "yes");
  assert.deepEqual(
    question.value,
    ["item1", "item5", "item3"],
    "item3 is visible - restore it's value"
  );
  survey.setValue("q1", "no");
  assert.deepEqual(
    question.value,
    ["item1", "item5"],
    "item3 is invisible again - remove it"
  );
  survey.setValue("q1", "yes");
  assert.deepEqual(
    question.value,
    ["item1", "item5", "item3"],
    "item3 is visible again - restore it's value"
  );
  survey.setValue("q1", "no");
  question.value = ["item1", "item5"];
  survey.setValue("q1", "yes");
  assert.deepEqual(
    question.value,
    ["item1", "item5"],
    "item3 is visible again, but we uncheck the value when it was hidden"
  );
});

QUnit.test("Clear errors on making question invisible, bug#846", function(
  assert
) {
  var question = new QuestionTextModel("q1");
  question.isRequired = true;
  question.hasErrors(true);
  assert.equal(question.errors.length, 1, "There is an error");
  question.visible = false;
  question.visible = true;
  assert.equal(question.errors.length, 0, "There is no error now");
});
QUnit.test("Clear errors on making question readOnly, bug#950", function(
  assert
) {
  var question = new QuestionTextModel("q1");
  question.isRequired = true;
  question.hasErrors(true);
  assert.equal(question.errors.length, 1, "There is an error");
  question.readOnly = true;
  question.hasErrors(true);
  assert.equal(question.errors.length, 0, "There is no error now");
  question.readOnly = false;
  question.hasErrors(true);
  assert.equal(question.errors.length, 1, "There is an error again");
});
QUnit.test("displayValue and choice value as object, bug#952", function(
  assert
) {
  var question = new QuestionRadiogroupModel("q1");
  question.choices.push(new ItemValue({ id: 1, val: "v1" }, "item 1"));
  question.choices.push(new ItemValue({ id: 2, val: "v2" }, "item 2"));
  question.value = { id: 2, val: "v2" };
  assert.deepEqual(question.value, { id: 2, val: "v2" }, "value set correctly");
  assert.equal(question.displayValue, "item 2", "display value get correctly");
});
QUnit.test("question.addConditionObjectsByContext", function(assert) {
  var objs = [];
  var html = new QuestionHtmlModel("q_html");
  html.addConditionObjectsByContext(objs, null);
  var checkbox = new QuestionCheckboxModel("q_check");
  checkbox.title = "My check title";
  checkbox.addConditionObjectsByContext(objs, null);
  var q_mt = new QuestionMultipleTextModel("q_mt");
  q_mt.addItem("item1", "Item 1 title");
  q_mt.addItem("item2");
  q_mt.addConditionObjectsByContext(objs, null);
  var q_matrix = new QuestionMatrixModel("q_matrix");
  q_matrix.rows = ["row1", "row2"];
  q_matrix.rows[0].text = "Row 1";
  q_matrix.addConditionObjectsByContext(objs, null);
  var qValueName = new QuestionTextModel("q_text");
  qValueName.valueName = "valueText";
  qValueName.title = "Text Question";
  qValueName.addConditionObjectsByContext(objs, null);
  for (var i = 0; i < objs.length; i++) {
    objs[i].question = objs[i].question.name;
  }
  assert.deepEqual(
    objs,
    [
      { name: "q_check", text: "My check title", question: "q_check" },
      { name: "q_mt.item1", text: "q_mt.Item 1 title", question: "q_mt" },
      { name: "q_mt.item2", text: "q_mt.item2", question: "q_mt" },
      { name: "q_matrix.row1", text: "q_matrix.Row 1", question: "q_matrix" },
      { name: "q_matrix.row2", text: "q_matrix.row2", question: "q_matrix" },
      { name: "valueText", text: "Text Question", question: "q_text" },
    ],
    "addConditionObjectsByContext work correctly"
  );
});

QUnit.test("question.getConditionJson", function(assert) {
  var json = new QuestionHtmlModel("q_html").getConditionJson("equals");
  assert.equal(json, null, "Html has not input value - so it is null");
  var qRadio = new QuestionRadiogroupModel("qRadio");
  qRadio.choices = [1, 2, 3, 4, 5];
  json = qRadio.getConditionJson("equals");
  assert.deepEqual(
    json.choices,
    [1, 2, 3, 4, 5],
    "radiogroup: choices correctly converted"
  );
  assert.equal(json.type, "radiogroup", "radiogroup: type set correctly");

  var qCheckbox = new QuestionCheckboxModel("qCheckbox");
  qCheckbox.choices = [1, 2, 3, 4, 5];
  json = qCheckbox.getConditionJson("equals");
  assert.deepEqual(
    json.choices,
    [1, 2, 3, 4, 5],
    "checkbox: choices correctly converted"
  );
  assert.equal(json.type, "checkbox", "checkbox: type set correctly");
  json = qCheckbox.getConditionJson("contains");
  assert.equal(
    json.type,
    "radiogroup",
    "checkbox: type set correctly for operator contains"
  );
  var q_mt = new QuestionMultipleTextModel("q_mt");
  q_mt.addItem("item1");
  q_mt.addItem("item2");
  json = q_mt.getConditionJson("equals", "dummy");
  assert.equal(json, null, "There is no item as dummy");
  json = q_mt.getConditionJson("equals", "item2");
  assert.ok(json, "multiple text item returns json");
  assert.equal(json.type, "text", "mutltiple text item: type set correctly");
  var q_matrix = new QuestionMatrixModel("q_matrix");
  q_matrix.rows = ["row1", "row2"];
  q_matrix.columns = ["col1", "col2"];
  json = q_matrix.getConditionJson("equals", "row1");
  assert.ok(json, "matrix text item returns json");
  assert.equal(json.type, "dropdown", "matrix row: type set correctly");
});

QUnit.test("question.clearIncorrectValues", function(assert) {
  var qText = new QuestionTextModel("q1");
  qText.value = "1";
  qText.clearIncorrectValues();
  assert.equal(qText.value, "1", "do nothing for text question");
  var qRadio = new QuestionRadiogroupModel("q1");
  qRadio.choices = ["1", "2", "3"];
  qRadio.value = "1";
  qRadio.clearIncorrectValues();
  assert.equal(qRadio.value, "1", "do nothing since item exists in choices");
  qRadio.value = "5";
  qRadio.clearIncorrectValues();
  assert.notOk(qRadio.value, "clear value since item doesn't exist in choices");

  var qcheck = new QuestionCheckboxModel("q1");
  qcheck.choices = ["1", "2", "3"];
  qcheck.value = ["1", "2"];
  qcheck.clearIncorrectValues();
  assert.deepEqual(
    qcheck.value,
    ["1", "2"],
    "do nothing since item exists in choices"
  );
  qcheck.value = ["1", "5"];
  qcheck.clearIncorrectValues();
  assert.deepEqual(qcheck.value, ["1"], "remove one item from choices");
  qcheck.value = ["7", "5"];
  qcheck.clearIncorrectValues();
  assert.deepEqual(
    qcheck.value,
    [],
    "clear values, there is no these items in choices"
  );
  qcheck.value = ["", 0, undefined, null];
  qcheck.clearIncorrectValues();
  assert.deepEqual(qcheck.value, [], "clear values, clear empty values");
});

QUnit.test("question.clearIncorrectValues and choicesByUrl", function(assert) {
  var question = new QuestionRadiogroupModel("q1");
  question.choicesByUrl.url = "some url";
  question.value = "item1";
  question.clearIncorrectValues();
  assert.equal(
    question.value,
    "item1",
    "Do not do anything if choicesByUrl is not empty"
  );
});

QUnit.test("questiontext.maxLength", function(assert) {
  var survey = new SurveyModel();
  var page = survey.addNewPage("p1");
  var qText = new QuestionTextModel("q1");
  page.addElement(qText);
  assert.equal(qText.getMaxLength(), null, "By default it is null");
  survey.maxTextLength = 10;
  assert.equal(qText.getMaxLength(), 10, "get from survey");
  qText.maxLength = 0;
  assert.equal(qText.getMaxLength(), null, "makes it undefined");
  qText.maxLength = 5;
  assert.equal(qText.getMaxLength(), 5, "gets 5 from question");
});

QUnit.test("readOnlyCommentRenderMode", function(assert) {
  var survey = new SurveyModel();
  var page = survey.addNewPage("p1");
  var qComment = new QuestionCommentModel("q1");
  var qRadio = new QuestionRadiogroupModel("q2");
  survey.mode = "display";

  page.addElement(qComment);
  page.addElement(qRadio);

  assert.equal(
    qComment["isReadOnlyRenderDiv"](),
    false,
    "isReadOnlyRenderDiv false"
  );
  assert.equal(
    qRadio["isReadOnlyRenderDiv"](),
    false,
    "isReadOnlyRenderDiv false"
  );
});
QUnit.test("readOnlyCommentRenderMode+readOnlyTextRenderMode", function(assert) {
  var survey = new SurveyModel();
  var page = survey.addNewPage("p1");
  var qComment = new QuestionCommentModel("q1");
  var qText = new QuestionTextModel("q3");
  survey.mode = "display";

  page.addElement(qComment);
  page.addElement(qText);

  assert.equal(
    qComment["isReadOnlyRenderDiv"](),
    false,
    "1. Comment - isReadOnlyRenderDiv false"
  );
  assert.equal(
    qText["isReadOnlyRenderDiv"](),
    false,
    "1. Text - isReadOnlyRenderDiv false"
  );

  settings.readOnlyCommentRenderMode = "div";

  assert.equal(
    qComment["isReadOnlyRenderDiv"](),
    true,
    "2. Comment - isReadOnlyRenderDiv true"
  );
  assert.equal(
    qText["isReadOnlyRenderDiv"](),
    false,
    "3. Text - isReadOnlyRenderDiv false"
  );

  settings.readOnlyTextRenderMode = "div";
  assert.equal(
    qComment["isReadOnlyRenderDiv"](),
    true,
    "3. Comment - isReadOnlyRenderDiv true"
  );

  assert.equal(
    qText["isReadOnlyRenderDiv"](),
    true,
    "3. Text - isReadOnlyRenderDiv true"
  );

  settings.readOnlyCommentRenderMode = "textarea";
  assert.equal(
    qComment["isReadOnlyRenderDiv"](),
    false,
    "4. Comment - isReadOnlyRenderDiv false"
  );
  assert.equal(
    qText["isReadOnlyRenderDiv"](),
    true,
    "4. Text - isReadOnlyRenderDiv true"
  );

  settings.readOnlyCommentRenderMode = "div";
  survey.mode = "edit";
  assert.equal(
    qComment["isReadOnlyRenderDiv"](),
    false,
    "5. Comment - isReadOnlyRenderDiv false"
  );
  assert.equal(
    qText["isReadOnlyRenderDiv"](),
    false,
    "5. Text - isReadOnlyRenderDiv false"
  );
});

QUnit.test("runCondition on adding element into survey", function(assert) {
  var survey = new SurveyModel();
  var page = survey.addNewPage("p1");
  var q = new QuestionCheckboxModel("cars");
  q.visibleIf = "{val} = 1";
  page.addElement(q);
  assert.equal(q.isVisible, false, "It should be invisible");
});

QUnit.test("questionselectbase.choicesVisibleIf", function(assert) {
  var survey = new SurveyModel();
  var page = survey.addNewPage("p1");
  var qCars = new QuestionCheckboxModel("cars");
  qCars.choices = ["Audi", "BMW", "Mercedes", "Volkswagen"];
  page.addElement(qCars);
  var qBestCar = new QuestionRadiogroupModel("bestCar");
  qBestCar.choices = ["Audi", "BMW", "Mercedes", "Volkswagen"];
  qBestCar.choicesVisibleIf = "{cars} contains {item}";
  page.addElement(qBestCar);
  assert.equal(qBestCar.visibleChoices.length, 0, "cars are not selected yet");
  qCars.value = ["BMW"];
  assert.equal(qBestCar.visibleChoices.length, 1, "BMW is selected");
  qCars.value = ["Audi", "BMW", "Mercedes"];
  assert.equal(qBestCar.visibleChoices.length, 3, "3 cars are selected");
  qBestCar.choicesVisibleIf = "";
  assert.equal(qBestCar.visibleChoices.length, 4, "there is no filter");
});

QUnit.test("questionselectbase.choicesEnableIf", function(assert) {
  var survey = new SurveyModel();
  var page = survey.addNewPage("p1");
  var qCars = new QuestionCheckboxModel("cars");
  qCars.choices = ["Audi", "BMW", "Mercedes", "Volkswagen"];
  page.addElement(qCars);
  var qBestCar = new QuestionRadiogroupModel("bestCar");
  qBestCar.choices = ["Audi", "BMW", "Mercedes", "Volkswagen"];
  qBestCar.choicesEnableIf = "{cars} contains {item}";
  page.addElement(qBestCar);
  assert.equal(qBestCar.enabledChoices.length, 0, "cars are disabled");
  qCars.value = ["BMW"];
  assert.equal(qBestCar.enabledChoices.length, 1, "BMW is enabled");
  qCars.value = ["Audi", "BMW", "Mercedes"];
  assert.equal(qBestCar.enabledChoices.length, 3, "3 cars are enabled");
  qBestCar.choicesEnableIf = "";
  assert.equal(qBestCar.enabledChoices.length, 4, "there is no filter");
});

QUnit.test("questionselectbase.choicesVisibleIf, support {choice}", function(
  assert
) {
  var survey = new SurveyModel();
  var page = survey.addNewPage("p1");
  var qCars = new QuestionCheckboxModel("cars");
  qCars.choices = ["Audi", "BMW", "Mercedes", "Volkswagen"];
  page.addElement(qCars);
  var qBestCar = new QuestionRadiogroupModel("bestCar");
  qBestCar.choices = ["Audi", "BMW", "Mercedes", "Volkswagen"];
  qBestCar.choicesVisibleIf = "{cars} contains {choice}";
  page.addElement(qBestCar);
  assert.equal(qBestCar.visibleChoices.length, 0, "cars are not selected yet");
  qCars.value = ["BMW"];
  assert.equal(qBestCar.visibleChoices.length, 1, "BMW is selected");
  qCars.value = ["Audi", "BMW", "Mercedes"];
  assert.equal(qBestCar.visibleChoices.length, 3, "3 cars are selected");
});

QUnit.test("matrix.rowsVisibleIf", function(assert) {
  var survey = new SurveyModel();
  var page = survey.addNewPage("p1");
  var qCars = new QuestionCheckboxModel("cars");
  qCars.choices = ["Audi", "BMW", "Mercedes", "Volkswagen"];
  page.addElement(qCars);
  var qBestCar = new QuestionMatrixModel("bestCar");
  qBestCar.columns = ["col1"];
  qBestCar.rows = ["Audi", "BMW", "Mercedes", "Volkswagen"];
  qBestCar.rowsVisibleIf = "{cars} contains {item}";
  page.addElement(qBestCar);
  assert.equal(qBestCar.visibleRows.length, 0, "cars are not selected yet");
  qCars.value = ["BMW"];
  assert.equal(qBestCar.visibleRows.length, 1, "BMW is selected");
  qCars.value = ["Audi", "BMW", "Mercedes"];
  assert.equal(qBestCar.visibleRows.length, 3, "3 cars are selected");
  qBestCar.rowsVisibleIf = "";
  assert.equal(qBestCar.visibleRows.length, 4, "there is no filter");
});

QUnit.test("matrix.columnsVisibleIf", function(assert) {
  var survey = new SurveyModel();
  var page = survey.addNewPage("p1");
  var qCars = new QuestionCheckboxModel("cars");
  qCars.choices = ["Audi", "BMW", "Mercedes", "Volkswagen"];
  page.addElement(qCars);
  var qBestCar = new QuestionMatrixModel("bestCar");
  qBestCar.rows = ["col1"];
  qBestCar.columns = ["Audi", "BMW", "Mercedes", "Volkswagen"];
  qBestCar.columnsVisibleIf = "{cars} contains {item}";
  page.addElement(qBestCar);
  assert.equal(qBestCar.visibleColumns.length, 0, "cars are not selected yet");
  qCars.value = ["BMW"];
  assert.equal(qBestCar.visibleColumns.length, 1, "BMW is selected");
  qCars.value = ["Audi", "BMW", "Mercedes"];
  assert.equal(qBestCar.visibleColumns.length, 3, "3 cars are selected");
  qBestCar.columnsVisibleIf = "";
  assert.equal(qBestCar.visibleColumns.length, 4, "there is no filter");
});

QUnit.test(
  "matrix.rowsVisibleIf, clear value on making the value invisible",
  function(assert) {
    var survey = new SurveyModel();
    survey.clearInvisibleValues = "onHidden";
    var page = survey.addNewPage("p1");
    var qBestCar = new QuestionMatrixModel("bestCar");
    qBestCar.columns = ["col1", "col2"];
    qBestCar.rows = ["Audi", "BMW", "Mercedes", "Volkswagen"];
    qBestCar.rowsVisibleIf = "{cars} contains {item}";
    page.addElement(qBestCar);
    survey.setValue("cars", ["BMW", "Audi", "Mercedes"]);
    qBestCar.value = { BMW: "col1", Audi: "col2" };
    assert.deepEqual(
      qBestCar.value,
      { BMW: "col1", Audi: "col2" },
      "Audi is selected"
    );
    survey.setValue("cars", ["BMW"]);
    assert.deepEqual(qBestCar.value, { BMW: "col1" }, "Audi is removed");
    survey.setValue("cars", ["Mercedes"]);
    assert.deepEqual(qBestCar.isEmpty(), true, "All checks are removed");
  }
);

QUnit.test(
  "matrix.columnsVisibleIf, clear value on making the value invisible",
  function(assert) {
    var survey = new SurveyModel();
    survey.clearInvisibleValues = "onHidden";
    var page = survey.addNewPage("p1");
    var qBestCar = new QuestionMatrixModel("bestCar");
    qBestCar.rows = ["col1", "col2"];
    qBestCar.columns = ["Audi", "BMW", "Mercedes", "Volkswagen"];
    qBestCar.columnsVisibleIf = "{cars} contains {item}";
    page.addElement(qBestCar);
    survey.setValue("cars", ["BMW", "Audi", "Mercedes"]);
    qBestCar.value = { col1: "BMW", col2: "Audi" };
    assert.deepEqual(
      qBestCar.value,
      { col1: "BMW", col2: "Audi" },
      "Audi is selected"
    );
    survey.setValue("cars", ["BMW"]);
    assert.deepEqual(qBestCar.value, { col1: "BMW" }, "Audi is removed");
    survey.setValue("cars", ["Mercedes"]);
    assert.deepEqual(qBestCar.isEmpty(), true, "All checks are removed");
  }
);

QUnit.test("matrixdropdown.rowsVisibleIf", function(assert) {
  var survey = new SurveyModel();
  var page = survey.addNewPage("p1");
  var qCars = new QuestionCheckboxModel("cars");
  qCars.choices = ["Audi", "BMW", "Mercedes", "Volkswagen"];
  page.addElement(qCars);
  var qBestCar = new QuestionMatrixDropdownModel("bestCar");
  qBestCar.addColumn("col1");
  qBestCar.rows = ["Audi", "BMW", "Mercedes", "Volkswagen"];
  qBestCar.rowsVisibleIf = "{cars} contains {item}";
  page.addElement(qBestCar);
  assert.equal(qBestCar.visibleRows.length, 0, "cars are not selected yet");
  qCars.value = ["BMW"];
  assert.equal(qBestCar.visibleRows.length, 1, "BMW is selected");
  qCars.value = ["Audi", "BMW", "Mercedes"];
  assert.equal(qBestCar.visibleRows.length, 3, "3 cars are selected");
  qBestCar.rowsVisibleIf = "";
  assert.equal(qBestCar.visibleRows.length, 4, "there is no filter");
});

QUnit.test("matrixdropdown.columnsVisibleIf", function(assert) {
  var survey = new SurveyModel();
  var page = survey.addNewPage("p1");
  var qCars = new QuestionCheckboxModel("cars");
  qCars.choices = ["Audi", "BMW", "Mercedes", "Volkswagen"];
  page.addElement(qCars);
  var qBestCar = new QuestionMatrixDropdownModel("bestCar");
  qBestCar.rows = ["col1"];
  qBestCar.addColumn("Audi");
  qBestCar.addColumn("BMW");
  qBestCar.addColumn("Mercedes");
  qBestCar.addColumn("Volkswagen");
  qBestCar.columnsVisibleIf = "{cars} contains {item}";
  page.addElement(qBestCar);
  assert.equal(qBestCar.visibleColumns.length, 0, "cars are not selected yet");
  qCars.value = ["BMW"];
  assert.equal(qBestCar.visibleColumns.length, 1, "BMW is selected");
  qCars.value = ["Audi", "BMW", "Mercedes"];
  assert.equal(qBestCar.visibleColumns.length, 3, "3 cars are selected");
  qBestCar.columnsVisibleIf = "";
  assert.equal(qBestCar.visibleColumns.length, 4, "there is no filter");
});

QUnit.test(
  "radiogroup.choicesVisibleIf, clear value on making the value invisible, bug #1093",
  function(assert) {
    var survey = new SurveyModel();
    var page = survey.addNewPage("p1");
    var qBestCar = new QuestionRadiogroupModel("bestCar");
    qBestCar.choices = ["Audi", "BMW", "Mercedes", "Volkswagen"];
    qBestCar.choicesVisibleIf = "{cars} contains {item}";
    page.addElement(qBestCar);
    survey.setValue("cars", ["BMW", "Audi"]);
    qBestCar.value = "Audi";
    assert.equal(qBestCar.value, "Audi", "Audi is selected");
    survey.setValue("cars", ["BMW"]);
    assert.equal(qBestCar.isEmpty(), true, "Audi is cleared");
  }
);
QUnit.test(
  "radiogroup.choicesEnableIf, clear value on making the value disable, survey.clearValueOnDisableItems",
  function(assert) {
    var survey = new SurveyModel();
    survey.clearValueOnDisableItems = true;
    var page = survey.addNewPage("p1");
    var qBestCar = new QuestionRadiogroupModel("bestCar");
    qBestCar.choices = ["Audi", "BMW", "Mercedes", "Volkswagen"];
    qBestCar.choicesEnableIf = "{cars} contains {item}";
    page.addElement(qBestCar);
    survey.setValue("cars", ["BMW", "Audi"]);
    qBestCar.value = "Audi";
    assert.equal(qBestCar.value, "Audi", "Audi is selected");
    survey.setValue("cars", ["BMW"]);
    assert.equal(qBestCar.isEmpty(), true, "Audi is cleared");
  }
);
QUnit.test(
  "checkbox.choicesVisibleIf, clear value on making the value invisible, bug #1093",
  function(assert) {
    var survey = new SurveyModel();
    var page = survey.addNewPage("p1");
    var qBestCar = new QuestionCheckboxModel("bestCar");
    qBestCar.choices = ["Audi", "BMW", "Mercedes", "Volkswagen"];
    qBestCar.choicesVisibleIf = "{cars} contains {item}";
    page.addElement(qBestCar);
    survey.setValue("cars", ["BMW", "Audi", "Mercedes"]);
    qBestCar.value = ["BMW", "Audi"];
    assert.deepEqual(qBestCar.value, ["BMW", "Audi"], "Audi is selected");
    survey.setValue("cars", ["BMW"]);
    assert.deepEqual(qBestCar.value, ["BMW"], "Audi is removed");
    survey.setValue("cars", ["Mercedes"]);
    assert.deepEqual(qBestCar.isEmpty(), true, "All checks are removed");
  }
);
QUnit.test(
  "checkbox.choicesEnableIf, clear value on making the value disable, survey.clearValueOnDisableItems",
  function(assert) {
    var survey = new SurveyModel();
    survey.clearValueOnDisableItems = true;
    var page = survey.addNewPage("p1");
    var qBestCar = new QuestionCheckboxModel("bestCar");
    qBestCar.choices = ["Audi", "BMW", "Mercedes", "Volkswagen"];
    qBestCar.choicesEnableIf = "{cars} contains {item}";
    page.addElement(qBestCar);
    survey.setValue("cars", ["BMW", "Audi", "Mercedes"]);
    qBestCar.value = ["BMW", "Audi"];
    assert.deepEqual(qBestCar.value, ["BMW", "Audi"], "Audi is selected");
    survey.setValue("cars", ["BMW"]);
    assert.deepEqual(qBestCar.value, ["BMW"], "Audi is removed");
    survey.setValue("cars", ["Mercedes"]);
    assert.deepEqual(qBestCar.isEmpty(), true, "All checks are removed");
  }
);

QUnit.test("itemValue.visibleIf", function(assert) {
  var json = {
    elements: [
      {
        type: "checkbox",
        name: "q",
        choices: [
          { value: "contactbyphone", visibleIf: "{phone} notempty" },
          { value: "contactbyemail", visibleIf: "{email} notempty" },
        ],
      },
    ],
  };
  var survey = new SurveyModel(json);
  var q = <QuestionCheckboxModel>survey.getQuestionByName("q");
  assert.equal(
    q.choices[0].visibleIf,
    "{phone} notempty",
    "itemValue.visibleIf loaded correctly"
  );
  assert.equal(q.visibleChoices.length, 0, "Nothing is set");
  survey.setValue("phone", "1");
  assert.equal(q.visibleChoices.length, 1, "phone is set");
  survey.setValue("email", "2");
  assert.equal(q.visibleChoices.length, 2, "phone and e-mail are set");
});

QUnit.test("itemValue.enableIf", function(assert) {
  var json = {
    elements: [
      {
        type: "checkbox",
        name: "q",
        choices: [
          { value: "contactbyphone", enableIf: "{phone} notempty" },
          { value: "contactbyemail", enableIf: "{email} notempty" },
        ],
      },
    ],
  };
  var survey = new SurveyModel(json);
  var q = <QuestionCheckboxModel>survey.getQuestionByName("q");
  assert.equal(
    q.choices[0].enableIf,
    "{phone} notempty",
    "itemValue.visibleIf loaded correctly"
  );
  assert.equal(q.enabledChoices.length, 0, "Nothing is set");
  survey.setValue("phone", "1");
  assert.equal(q.enabledChoices.length, 1, "phone is set");
  survey.setValue("email", "2");
  assert.equal(q.enabledChoices.length, 2, "phone and e-mail are set");
});

QUnit.test(
  "multipletext item title renders incorrectly if survey.questionTitleTemplate is set, bug #1170",
  function(assert) {
    var json = {
      questionTitleTemplate: "{no}. {title} {require}",
      elements: [
        {
          type: "multipletext",
          name: "question1",
          items: [
            {
              name: "text1",
            },
          ],
        },
      ],
    };
    var survey = new SurveyModel(json);
    var q = <QuestionMultipleTextModel>survey.getQuestionByName("question1");
    assert.equal(q.items[0].locTitle.renderedHtml, "text1", "There is no .");
  }
);
QUnit.test(
  "Question.locCommentText.renderedHtml should return the default text correctly",
  function(assert) {
    var question = new Question("q1");
    assert.equal(
      question.locCommentText.renderedHtml,
      surveyLocalization.getString("otherItemText"),
      "Get the default value correctly"
    );
    question.commentText = "New Comment Text";
    assert.equal(
      question.locCommentText.renderedHtml,
      "New Comment Text",
      "Do not use the default text"
    );
  }
);

QUnit.test(
  "multipletext item is not readonly when survey is readonly, bug #1177",
  function(assert) {
    var json = {
      mode: "display",
      elements: [
        {
          type: "multipletext",
          name: "question1",
          items: [
            {
              name: "text1",
            },
          ],
        },
      ],
    };
    var survey = new SurveyModel(json);
    var q = <QuestionMultipleTextModel>survey.getQuestionByName("question1");
    assert.equal(q.items[0].editor.isReadOnly, true, "It should be readonly");
  }
);

QUnit.test("space in others does not work correctly , bug #1214", function(
  assert
) {
  var json = {
    elements: [
      {
        type: "radiogroup",
        name: "q1",
        hasOther: true,
        choices: ["high"],
        storeOthersAsComment: false,
      },
    ],
  };
  var survey = new SurveyModel(json);
  var q = <QuestionRadiogroupModel>survey.getQuestionByName("q1");
  q.value = q.otherItem.value;
  assert.equal(q.isOtherSelected, true, "other is selected");
  assert.equal(q.hasErrors(), true, "other is not entered");
  q.comment = " ";
  assert.equal(q.isOtherSelected, true, "other is still selected");
  assert.equal(
    q.hasErrors(),
    true,
    "other is not entered, whitespace doesn't count"
  );
});

QUnit.test("Checkbox hasNone", function(assert) {
  var json = {
    elements: [
      {
        type: "checkbox",
        name: "q1",
        hasNone: true,
        choices: [1, 2, 3, 4, 5],
      },
    ],
  };
  var survey = new SurveyModel(json);
  var q = <QuestionCheckboxModel>survey.getQuestionByName("q1");
  assert.equal(q.visibleChoices.length, 6, "5 items + none");
  q.hasNone = false;
  assert.equal(q.visibleChoices.length, 5, "none is removed");
  q.hasNone = true;
  assert.equal(q.visibleChoices.length, 6, "none is added");
  q.value = [1, 2, "none"];
  assert.deepEqual(q.value, ["none"], "we keep only none");
  q.value = [1, "none"];
  assert.deepEqual(q.value, [1], "none should gone");
});
QUnit.test("Dropdown hasNone", function(assert) {
  var json = {
    elements: [
      {
        type: "dropdown",
        name: "q1",
        hasNone: true,
        choices: [1, 2, 3, 4, 5],
      },
    ],
  };
  var survey = new SurveyModel(json);
  var q = <QuestionDropdownModel>survey.getQuestionByName("q1");
  assert.equal(q.visibleChoices.length, 6, "5 items + none");
  q.hasNone = false;
  assert.equal(q.visibleChoices.length, 5, "none is removed");
  q.hasNone = true;
  assert.equal(q.visibleChoices.length, 6, "none is added");
});

QUnit.test("Checkbox hasSelectAll", function(assert) {
  var json = {
    elements: [
      {
        type: "checkbox",
        name: "q1",
        hasSelectAll: true,
        choices: [1, 2, 3],
      },
    ],
  };
  var survey = new SurveyModel(json);
  var q = <QuestionCheckboxModel>survey.getQuestionByName("q1");
  assert.equal(q.visibleChoices.length, 4, "3 items + select all");
  q.hasSelectAll = false;
  assert.equal(q.visibleChoices.length, 3, "select all is removed");
  q.hasSelectAll = true;
  assert.equal(q.visibleChoices.length, 4, "none is added");
  assert.equal(q.isAllSelected, false, "All items are not selected");
  assert.equal(
    q.isItemSelected(q.selectAllItem),
    false,
    "isItemSelected returns false"
  );
  q.value = [1, 2, 3];
  assert.equal(q.isAllSelected, true, "All items are selected");
  assert.equal(
    q.isItemSelected(q.selectAllItem),
    true,
    "isItemSelected returns true"
  );
  q.hasOther = true;
  q.value = [1, 2, "other"];
  assert.equal(q.isAllSelected, false, "3 is not selected");
  q.value = [1, 2, 3, "other"];
  assert.equal(q.isAllSelected, true, "all + other are selected");
  q.value = [1, 2];
  q.toggleSelectAll();
  assert.deepEqual(
    q.value,
    [1, 2, 3],
    "all items are selected after clicking select all"
  );
  q.toggleSelectAll();
  assert.equal(q.isEmpty(), true, "value is empty");
  q.toggleSelectAll();
  assert.deepEqual(
    q.value,
    [1, 2, 3],
    "all items are selected again after clicking select all"
  );
});

QUnit.test(
  "Do not replace period '.' with space ' ' on setting a string with '.' into valueName",
  function(assert) {
    var question = new Question("q1");
    question.valueName = "q.1.";
    assert.equal(question.valueName, "q.1.", "Correct the value name");
  }
);

QUnit.test(
  "readOnly property doesn't work for multipletext question, #1217",
  function(assert) {
    var survey = new SurveyModel();
    var page = survey.addNewPage("p");
    var question = new QuestionMultipleTextModel("q1");
    page.addQuestion(question);
    question.addItem("text1");
    question.addItem("text2");
    var itemQuestion = question.items[0].editor;
    assert.equal(
      itemQuestion.isReadOnly,
      false,
      "It is not readOnly by default"
    );
    survey.mode = "display";
    assert.equal(itemQuestion.isReadOnly, true, "survey mode is display");
    survey.mode = "edit";
    assert.equal(itemQuestion.isReadOnly, false, "survey mode is edit");
    question.readOnly = true;
    assert.equal(itemQuestion.isReadOnly, true, "question is readOnly");
  }
);

QUnit.test(
  "Multipletext, item isRequired, 0 is a valid value, bug #1225",
  function(assert) {
    var question = new QuestionMultipleTextModel("q1");
    var item = question.addItem("text1");
    item.isRequired = true;
    item.inputType = "number";
    item.value = 0;
    assert.equal(
      question.hasErrors(),
      false,
      "There is no errors, 0 is a valid value"
    );
  }
);

QUnit.test(
  "Multipletext, item isRequired, make item question isRequired, bug #1983",
  function(assert) {
    var survey = new SurveyModel({
      questions: [
        {
          type: "multipletext",
          name: "q1",
          items: [
            {
              name: "item1",
              isRequired: true,
            },
          ],
        },
      ],
    });
    var question = <QuestionMultipleTextModel>survey.getQuestionByName("q1");
    assert.equal(
      question.items[0].editor.isRequired,
      true,
      "Editor is requried"
    );
    assert.equal(
      question.items[0].editor.hasErrors(),
      true,
      "item editor is required"
    );
    assert.equal(question.hasErrors(), true, "question is required");
  }
);

QUnit.test("Test property hideIfChoicesEmpty", function(assert) {
  var survey = new SurveyModel();
  var page = survey.addNewPage("p1");
  var question = new QuestionCheckboxModel("q1");
  page.addElement(question);
  assert.equal(question.isVisible, true, "By default it is visible");
  question.hideIfChoicesEmpty = true;
  assert.equal(question.isVisible, false, "Choices are empty");
  question.hasOther = true;
  question.hasSelectAll = true;
  question.hasNone = true;
  assert.equal(question.isVisible, false, "Still choices are empty");
  question.choices = [1, 2, 3];
  assert.equal(question.isVisible, true, "Choices are not empty");
  question.choicesVisibleIf = "{item} = {val1}";
  assert.equal(question.isVisible, false, "Filtered choices are empty");
  survey.setValue("val1", 2);
  assert.equal(question.isVisible, true, "There is one visible item");
});

QUnit.test("Test property hideIfRowsEmpty", function(assert) {
  var survey = new SurveyModel();
  var page = survey.addNewPage("p1");
  var question = new QuestionMatrixModel("q1");
  page.addElement(question);
  assert.equal(question.isVisible, true, "By default it is visible");
  question.hideIfRowsEmpty = true;
  assert.equal(question.isVisible, false, "Rows are empty");
  question.rows = [1, 2, 3];
  assert.equal(question.isVisible, true, "Rows are not empty");
  question.rowsVisibleIf = "{item} = {val1}";
  assert.equal(question.isVisible, false, "Filtered rows are empty");
  survey.setValue("val1", 2);
  assert.equal(question.isVisible, true, "There is one visible item");
});

QUnit.test("Test property hideIfRowsEmpty - load from json", function(assert) {
  var survey = new SurveyModel({
    elements: [{ type: "matrix", name: "q1", hideIfRowsEmpty: true }],
  });
  var question = <QuestionMatrixModel>survey.getQuestionByName("q1");
  assert.equal(question.rows.length, 0, "There is no rows");
  assert.equal(question.isVisible, false, "It is invisible");
});

QUnit.test(
  "Do not change value for readOnly dropdown even if value is not in choices",
  function(assert) {
    var survey = new SurveyModel({
      elements: [
        {
          type: "dropdown",
          name: "q1",
          readOnly: true,
          defaultValue: 3,
        },
      ],
    });
    var question = <QuestionDropdownModel>survey.getQuestionByName("q1");
    assert.equal(question.value, 3, "Value is still 3");
  }
);

QUnit.test("QuestionHtml + Survey.onProcessHtml event, bug#1294", function(
  assert
) {
  var survey = new SurveyModel();
  var page = survey.addNewPage("p1");
  var question = <QuestionHtmlModel>page.addNewQuestion("html", "q1");
  survey.onProcessHtml.add(function(survey, options) {
    options.html = options.html + "-add-";
  });
  question.html = "text";
  assert.equal(question.locHtml.renderedHtml, "text-add-", "process html");
});

QUnit.test("Question Html ignore Html processing = true", function(assert) {
  var survey = new SurveyModel();
  var page = survey.addNewPage("p1");
  survey.onProcessHtml.add(function(survey, options) {
    options.html = options.html + "-add-";
  });
  var question = <QuestionHtmlModel>page.addNewQuestion("html", "q1");
  question.html = "text1";
  assert.equal(question.locHtml.renderedHtml, "text1-add-", "proccess html");
  question.ignoreHtmlProgressing = true;
  question.html = "text2";
  assert.equal(question.locHtml.renderedHtml, "text2", "do not proccess html");
});

QUnit.test("question.paddingLeft and question.paddingRight", function(assert) {
  var survey = new SurveyModel({
    elements: [{ type: "dropdown", name: "q1" }],
  });
  var question = <Question>survey.getQuestionByName("q1");
  assert.equal(question.paddingLeft, "", "left is empty");
  assert.equal(question.paddingRight, "", "right is empty");
  question.indent = 1;
  question.rightIndent = 2;
  assert.equal(question.paddingLeft, "20px", "left is not empty");
  assert.equal(question.paddingRight, "40px", "right is not empty");
  survey.css = {
    question: {
      indent: 0
    }
  };
  assert.equal(question.paddingLeft, "", "left is empty");
  assert.equal(question.paddingRight, "", "right is empty");
});

QUnit.test(
  "selectbase question item.visibleIf and survey.data on set, bug#1394, https://surveyjs.answerdesk.io/ticket/details/T1228",
  function(assert) {
    var survey = new SurveyModel({
      elements: [
        {
          type: "matrix",
          name: "qid261",
          columns: ["0", "1"],
          rows: [
            {
              value: "oid11772",
              text: "AES",
              visibleIf: "{qid260} contains 'oid11772'",
            },
            {
              value: "oid13403",
              text: "RC6",
              visibleIf: "{qid260} contains 'oid13403'",
            },
            {
              value: "oid13404",
              text: "SEED",
              visibleIf: "{qid260} contains 'oid13404'",
            },
          ],
        },
      ],
    });
    survey.data = {
      qid260: ["oid11772", "oid13404"],
      qid261: { oid11772: "1", oid13404: "1" },
    };

    var question = <QuestionMatrixModel>survey.getQuestionByName("qid261");
    assert.deepEqual(
      question.value,
      { oid11772: "1", oid13404: "1" },
      "value set correctly"
    );
    assert.equal(question.visibleRows.length, 2, "Two rows are visible");
    assert.equal(
      question.visibleRows[0].value,
      "1",
      "The first row value is set"
    );
    assert.equal(
      question.visibleRows[1].value,
      "1",
      "The second row value is set"
    );
  }
);
QUnit.test(
  "matrix single choice. Restore new visible values from defaultValue if they are exists, Issue# T3038, https://surveyjs.answerdesk.io/ticket/details/T3038",
  function(assert) {
    var survey = new SurveyModel({
      clearInvisibleValues: "onHidden",
      elements: [
        {
          type: "matrix",
          name: "q1",
          columns: ["1", "2", "3", "4"],
          rows: [
            {
              value: "v1",
            },
            {
              value: "v2",
            },
            {
              value: "v3",
              visibleIf: "{val1} = 'a'",
            },
            {
              value: "v4",
              visibleIf: "{val1} = 'a'",
            },
          ],
          defaultValue: { v1: "1", v2: "2", v3: "3", v4: "4" },
        },
      ],
    });
    var question = <QuestionMatrixModel>survey.getQuestionByName("q1");
    assert.deepEqual(question.value, { v1: "1", v2: "2" }, "Remove two rows");
    survey.setValue("val1", "a");
    assert.deepEqual(
      question.value,
      { v1: "1", v2: "2", v3: "3", v4: "4" },
      "Restore rows values from default"
    );
  }
);

QUnit.test("Load survey with requiredIf expression", function(assert) {
  var survey = new SurveyModel({
    elements: [
      {
        type: "text",
        name: "q1",
        defaultValue: 1,
      },
      {
        type: "text",
        name: "q2",
        requiredIf: "{q1} = 1",
      },
    ],
  });
  var question = <Question>survey.getQuestionByName("q2");
  assert.equal(
    question.isRequired,
    true,
    "The question becomes required on loading"
  );
  survey.setValue("q1", 2);
  assert.equal(
    question.isRequired,
    false,
    "The question becomes unrequired on changing value"
  );
  survey.setValue("q1", 1);
  assert.equal(
    question.isRequired,
    true,
    "The question becomes required on changing value"
  );
});
QUnit.test(
  "dropdown showOptionsCaption, https://surveyjs.answerdesk.io/ticket/details/T1499",
  function(assert) {
    var question = new QuestionDropdownModel("q1");
    assert.equal(
      question.showOptionsCaption,
      true,
      "showOptionsCaption is true by default"
    );

    question.showOptionsCaption = false;
    var json = new JsonObject().toJsonObject(question);
    var checkedJson = {
      name: "q1",
      showOptionsCaption: false,
    };
    assert.deepEqual(json, checkedJson, "showOptionsCaption is serialized");
  }
);
QUnit.test(
  "multipletext could not load default value correctly, https://surveyjs.answerdesk.io/ticket/details/T1659",
  function(assert) {
    var json = {
      pages: [
        {
          name: "p1",
          elements: [
            {
              type: "multipletext",
              name: "_metaData",
              defaultValue: {
                _metaQuestVersion: "1.0.1",
                _metaQuestName: "Packaging",
                _metaQuestDateTime: "2019-02-20",
                _metaQuestAuthor: "Someone",
              },
              items: [
                {
                  name: "_metaQuestVersion",
                },
                {
                  name: "_metaQuestName",
                },
                {
                  name: "_metaQuestDateTime",
                },
                {
                  name: "_metaQuestAuthor",
                },
              ],
            },
          ],
        },
      ],
    };
    var survey = new SurveyModel();
    survey.setDesignMode(true);
    survey.setJsonObject(json);
    var question = <QuestionMultipleTextModel>(
      survey.getQuestionByName("_metaData")
    );
    assert.equal(
      question.items[0].editor.isDesignMode,
      true,
      "Question has design mode"
    );
    assert.deepEqual(
      question.defaultValue,
      {
        _metaQuestVersion: "1.0.1",
        _metaQuestName: "Packaging",
        _metaQuestDateTime: "2019-02-20",
        _metaQuestAuthor: "Someone",
      },
      "Default value loads correctly"
    );
  }
);

QUnit.test(
  "Options do not work correctly together: survey.storeOthersAsComment and question.storeOthersAsComment, Bug#1635",
  function(assert) {
    var json = {
      storeOthersAsComment: false,
      questions: [
        {
          storeOthersAsComment: true,
          type: "radiogroup",
          name: "q1",
          hasOther: true,
          choices: [1, 2],
        },
      ],
    };
    var survey = new SurveyModel(json);
    var q = <QuestionRadiogroupModel>survey.getQuestionByName("q1");
    q.value = "other";
    q.comment = "Other text";
    assert.deepEqual(
      survey.data,
      { q1: "other", "q1-Comment": "Other text" },
      "Store other in comment"
    );

    survey.clear();
    q.storeOthersAsComment = false;
    q.value = "other";
    q.comment = "Other text2";
    assert.deepEqual(
      survey.data,
      { q1: "Other text2" },
      "Store other in value"
    );

    survey.clear();
    survey.storeOthersAsComment = false;
    q.storeOthersAsComment = "default";
    q.value = "other";
    q.comment = "Other text3";
    assert.deepEqual(
      survey.data,
      { q1: "Other text3" },
      "Store other in value, take the opton from survey"
    );

    survey.clear();
    survey.storeOthersAsComment = true;
    q.storeOthersAsComment = "default";
    q.value = "other";
    q.comment = "Other text4";
    assert.deepEqual(
      survey.data,
      { q1: "other", "q1-Comment": "Other text4" },
      "Store other in comment, take the opton from survey"
    );
  }
);

QUnit.test("Could not assign validators", function(assert) {
  var question = new QuestionTextModel("q1");
  question.validators.push(new NumericValidator(1, 10));
  question.validators = [new NumericValidator(1, 10)];
  assert.equal(
    (<NumericValidator>question.validators[0]).minValue,
    1,
    "MinValue is correct"
  );
});

QUnit.test("Restore comment on uncheck/check others", function(assert) {
  var qCheck = new QuestionCheckboxModel("q1");
  qCheck.choices = ["1", "2", "3"];
  qCheck.hasOther = true;
  var qRadio = new QuestionRadiogroupModel("q2");
  qRadio.choices = ["1", "2", "3"];
  qRadio.hasOther = true;
  qCheck.value = [qCheck.otherItem.value];
  qRadio.value = qRadio.otherItem.value;
  qCheck.comment = "comment-check";
  qRadio.comment = "comment-radio";
  qCheck.value = ["1"];
  qRadio.value = "1";
  assert.equal(qCheck.comment, "", "checkbox comment is empty");
  assert.equal(qRadio.comment, "", "radiobox comment is empty");
  qCheck.value = ["1", qCheck.otherItem.value];
  qRadio.value = qRadio.otherItem.value;
  assert.equal(qCheck.comment, "comment-check", "checkbox comment is restored");
  assert.equal(qRadio.comment, "comment-radio", "radiobox comment is restored");
});

QUnit.test("Radio group comment without hasOther, Bug #1747", function(assert) {
  var json = {
    questions: [
      {
        type: "radiogroup",
        name: "q1",
        hasComment: true,
        choices: [1, 2, 3, 4, 5],
      },
    ],
  };
  var survey = new SurveyModel(json);
  survey.data = { q1: 2, "q1-Comment": "Init data" };
  var question = <QuestionRadiogroupModel>survey.getQuestionByName("q1");
  assert.equal(question.comment, "Init data", "Initial data is here");
  survey.data = { q1: 3, "q1-Comment": "Next data" };
  assert.equal(question.comment, "Next data", "It is set correctley");
  survey.doComplete();
  assert.deepEqual(
    survey.data,
    { q1: 3, "q1-Comment": "Next data" },
    "Comment is here"
  );
});

QUnit.test("other's comment value is properly set from data", function(assert) {
  var json = {
    questions: [
      {
        type: "checkbox",
        name: "q1",
        hasOther: true,
      },
    ],
  };
  var survey = new SurveyModel(json);
  var question = <QuestionSelectBase>survey.getAllQuestions()[0];
  survey.data = { q1: ["other"], "q1-Comment": "comment" };
  survey.data = { q1: [] };
  survey.data = { q1: ["other"], "q1-Comment": "comment1" };
  assert.equal(question.comment, "comment1");
});

QUnit.test("QuestionImagePicker.isItemSelected function", function(assert) {
  var question = new QuestionImagePickerModel("q1");
  new JsonObject().toObject(
    {
      type: "imagepicker",
      name: "question3",
      multiSelect: true,
      choices: [1, 2, 3, 4, 5],
    },
    question
  );

  question.value = [1, 3];
  assert.equal(
    question.isItemSelected(question.choices[0]),
    true,
    "The first time is selected"
  );
  assert.equal(
    question.isItemSelected(question.choices[1]),
    false,
    "The second time is not selected"
  );
  assert.equal(
    question.isItemSelected(question.choices[2]),
    true,
    "The third time is selected"
  );
  question = new QuestionImagePickerModel("q1");
  new JsonObject().toObject(
    {
      type: "imagepicker",
      name: "question3",
      multiSelect: false,
      choices: [1, 2, 3, 4, 5],
    },
    question
  );
  question.value = 2;
  assert.equal(question.renderedValue, 2, "The first set correctly");
  assert.equal(
    question.isItemSelected(question.choices[0]),
    false,
    "The first time is not selected"
  );
  assert.equal(
    question.isItemSelected(question.choices[1]),
    true,
    "The second time is selected"
  );
  assert.equal(
    question.isItemSelected(question.choices[2]),
    false,
    "The third time is not selected"
  );
});

QUnit.test("QuestionImagePicker 0 item value test", function(assert) {
  var question = new QuestionImagePickerModel("q1");
  new JsonObject().toObject(
    {
      type: "imagepicker",
      name: "question3",
      choices: [1, 2, 3, 4, 0],
    },
    question
  );
  question.value = 0;
  assert.equal(question.value, 0, "Value should be 0 and not undefined");
  assert.equal(question.isEmpty(), false, "Question is not empty");
});

QUnit.test(
  "QuestionImagePicker create item value for choices restful test",
  function(assert) {
    var question = new QuestionImagePickerModel("q1");
    const itemValue = question.choicesByUrl.createItemValue("val");
    assert.equal(
      itemValue.getType(),
      "imageitemvalue",
      "imageitemvalue created"
    );
  }
);

QUnit.test("QuestionImagePicker.isAnswerCorrect function", function(assert) {
  var question = new QuestionImagePickerModel("q1");
  new JsonObject().toObject(
    {
      type: "imagepicker",
      name: "question3",
      multiSelect: true,
      correctAnswer: [1, 2],
      choices: [1, 2, 3, 4, 5],
    },
    question
  );
  question.value = [2, 1];
  assert.equal(question.isAnswerCorrect(), true, "[1,2]== [2, 1] for image picker");
  question.value = [2, 3];
  assert.equal(question.isAnswerCorrect(), false, "[1,2]!= [2, 3] for image picker");
  question = new QuestionImagePickerModel("q1");
  new JsonObject().toObject(
    {
      type: "imagepicker",
      name: "question3",
      multiSelect: false,
      correctAnswer: 2,
      choices: [1, 2, 3, 4, 5],
    },
    question
  );
  question.value = 1;
  assert.equal(question.isAnswerCorrect(), false, "1 <> 2");
  question.value = 2;
  assert.equal(question.isAnswerCorrect(), true, "2 = 2");
});

QUnit.test(
  "question visibleIf, enableIf and requiredIf with async functions in expression",
  function(assert) {
    var returnResult1: (res: any) => void;
    var returnResult2: (res: any) => void;
    var returnResult3: (res: any) => void;
    function asyncFunc1(params: any): any {
      returnResult1 = this.returnResult;
      return false;
    }
    function asyncFunc2(params: any): any {
      returnResult2 = this.returnResult;
      return false;
    }
    function asyncFunc3(params: any): any {
      returnResult3 = this.returnResult;
      return false;
    }
    var returnResult = function(res) {
      if (!!returnResult1) returnResult1(res);
      if (!!returnResult2) returnResult2(res);
      if (!!returnResult3) returnResult3(res);
    };
    FunctionFactory.Instance.register("asyncFunc1", asyncFunc1, true);
    FunctionFactory.Instance.register("asyncFunc2", asyncFunc2, true);
    FunctionFactory.Instance.register("asyncFunc3", asyncFunc3, true);
    var survey = new SurveyModel({
      elements: [
        {
          type: "text",
          name: "q1",
          visibleIf: "asyncFunc1({q2}) = 2",
          enableIf: "asyncFunc2({q2}) = 4",
          requiredIf: "asyncFunc3({q2}) = 6",
        },
        { type: "text", name: "q2" },
      ],
    });
    returnResult(0);
    var question = survey.getQuestionByName("q1");
    survey.setValue("q2", 1);
    assert.equal(question.isVisible, false, "q1 is invisible by default");
    returnResult(survey.getValue("q2") * 2);
    assert.equal(question.isVisible, true, "q1 is visible, q2 = 1");
    assert.equal(question.isReadOnly, true, "q1 is not enabled, q2 = 1");
    assert.equal(question.isRequired, false, "q1 is not required, q2 = 1");
    survey.setValue("q2", 2);
    assert.equal(question.isReadOnly, true, "q1.isReadOnly is not changed yet");
    returnResult(survey.getValue("q2") * 2);
    assert.equal(question.isVisible, false, "q1 is invisible, q2 = 2");
    assert.equal(question.isReadOnly, false, "q1 is enabled, q2 = 2");
    assert.equal(question.isRequired, false, "q1 is not required, q2 = 2");
    survey.setValue("q2", 3);
    assert.equal(
      question.isRequired,
      false,
      "q1.isRequired is not changed yet"
    );
    returnResult(survey.getValue("q2") * 2);
    assert.equal(question.isVisible, false, "q1 is invisible, q2 = 3");
    assert.equal(question.isReadOnly, true, "q1 is not enabled, q2 = 3");
    assert.equal(question.isRequired, true, "q1 is required, q2 = 3");

    FunctionFactory.Instance.unregister("asyncFunc1");
    FunctionFactory.Instance.unregister("asyncFunc2");
    FunctionFactory.Instance.unregister("asyncFunc3");
  }
);

QUnit.test("test question.getDisplayValue(key, value)", function(assert) {
  var survey = new SurveyModel({
    elements: [
      {
        type: "radiogroup",
        name: "q1",
        choices: [
          { value: 1, text: "one" },
          { value: 2, text: "two" },
        ],
      },
      {
        type: "checkbox",
        name: "q2",
        choices: [
          { value: 1, text: "one" },
          { value: 2, text: "two" },
          { value: 3, text: "three" },
        ],
      },
      {
        type: "boolean",
        name: "q3",
      },
      {
        type: "multipletext",
        name: "q4",
        items: [
          { name: "item1", title: "Item 1" },
          { name: "item2", title: "Item 2" },
          { name: "item3", title: "Item 3" },
        ],
      },
    ],
  });
  survey.data = { q1: 1, q2: [1, 2] };
  var q1 = survey.getQuestionByName("q1");
  var q2 = survey.getQuestionByName("q2");
  var q3 = survey.getQuestionByName("q3");
  var q4 = survey.getQuestionByName("q4");
  assert.equal(q1.getDisplayValue(true), "one", "radigroup displayvalue works");
  assert.equal(
    q1.getDisplayValue(true, 2),
    "two",
    "radigroup displayvalue for value as a param works"
  );
  assert.equal(
    q2.getDisplayValue(true),
    "one, two",
    "checkbox displayvalue works"
  );
  assert.equal(
    q2.getDisplayValue(true, [2, 3]),
    "two, three",
    "checkbox displayvalue for value as a param works"
  );
  assert.equal(
    q2.getDisplayValue(true, 2),
    "two",
    "checkbox displayvalue for non array value as a param works"
  );
  assert.equal(
    q3.getDisplayValue(true, true),
    "Yes",
    "boolean displayvalue for true"
  );
  assert.equal(
    q3.getDisplayValue(true, false),
    "No",
    "boolean displayvalue for false"
  );
  assert.deepEqual(
    q4.getDisplayValue(true, { item1: "value1", item3: "value3" }),
    { "Item 1": "value1", "Item 3": "value3" },
    "multiple text displayvalue"
  );
});

QUnit.test(
  "Multiple text question validation and async functions in expression",
  function(assert) {
    var returnResult1: (res: any) => void;
    var returnResult2: (res: any) => void;
    function asyncFunc1(params: any): any {
      returnResult1 = this.returnResult;
      return false;
    }
    function asyncFunc2(params: any): any {
      returnResult2 = this.returnResult;
      return false;
    }
    FunctionFactory.Instance.register("asyncFunc1", asyncFunc1, true);
    FunctionFactory.Instance.register("asyncFunc2", asyncFunc2, true);

    var question = new QuestionMultipleTextModel("q1");
    var item1 = question.addItem("item1");
    var item2 = question.addItem("item2");
    item1.validators.push(new ExpressionValidator("asyncFunc1() = 1"));
    item2.validators.push(new ExpressionValidator("asyncFunc2() = 1"));
    question.hasErrors();
    var onCompletedAsyncValidatorsCounter = 0;
    question.onCompletedAsyncValidators = (hasErrors: boolean) => {
      onCompletedAsyncValidatorsCounter++;
    };
    assert.equal(
      question.isRunningValidators,
      true,
      "We have two running validators"
    );
    assert.equal(
      onCompletedAsyncValidatorsCounter,
      0,
      "onCompletedAsyncValidators is not called yet"
    );
    returnResult1(1);
    assert.equal(
      question.isRunningValidators,
      true,
      "We have one running validator"
    );
    assert.equal(
      onCompletedAsyncValidatorsCounter,
      0,
      "onCompletedAsyncValidators is not called yet, 2"
    );
    returnResult2(1);
    assert.equal(question.isRunningValidators, false, "We are fine now");
    assert.equal(
      onCompletedAsyncValidatorsCounter,
      1,
      "onCompletedAsyncValidators is called"
    );

    FunctionFactory.Instance.unregister("asyncFunc1");
    FunctionFactory.Instance.unregister("asyncFunc2");
  }
);
QUnit.test("question.getSupportedValidators", function(assert) {
  assert.deepEqual(new QuestionMatrixModel("q").getSupportedValidators(), [
    "expression",
  ]);
  assert.deepEqual(new QuestionTextModel("q").getSupportedValidators(), [
    "expression",
    "numeric",
    "text",
    "regex",
    "email",
  ]);
  assert.deepEqual(new QuestionCommentModel("q").getSupportedValidators(), [
    "expression",
    "text",
    "regex",
  ]);
  assert.deepEqual(new QuestionCheckboxModel("q").getSupportedValidators(), [
    "expression",
    "answercount",
  ]);
  assert.deepEqual(new QuestionImagePickerModel("q").getSupportedValidators(), [
    "expression",
    "answercount",
  ]);
});

QUnit.test("Question<=Base propertyValueChanged", function(assert) {
  var json = { title: "title", questions: [{ type: "text", name: "q" }] };
  var survey = new SurveyModel(json);
  var question = survey.getQuestionByName("q");
  var counter = 0;

  survey.onPropertyValueChangedCallback = (
    name: string,
    oldValue: any,
    newValue: any,
    sender: SurveyModel,
    arrayChanges: ArrayChanges
  ) => {
    counter++;
  };

  assert.equal(counter, 0, "initial");

  question.title = "new";

  assert.equal(counter, 1, "callback called");
});

QUnit.test("Question.addError(SurveyError|string)", function(assert) {
  var question = new QuestionTextModel("q");
  question.addError(new RequreNumericError("Error 1"));
  question.addError("Error 2");
  assert.equal(question.errors.length, 2, "There are two errors");
  assert.equal(question.errors[0].getErrorType(), "requirenumeric", "numeric");
  assert.equal(question.errors[1].getErrorType(), "custom", "custom");
  assert.equal(question.errors[0].text, "Error 1", "numeric error text");
  assert.equal(question.errors[1].text, "Error 2", "custom error text");
});

QUnit.test("QuestionText min/max value and renderedMin/renderedMax", function(
  assert
) {
  var survey = new SurveyModel({ questions: [{ type: "text", name: "q" }] });
  var question = <QuestionTextModel>survey.getQuestionByName("q");
  assert.equal(question.min, undefined, "Empty min");
  assert.equal(question.max, undefined, "Empty max");
  question.min = "1";
  question.max = "5";
  assert.equal(question.min, "1", "min 1");
  assert.equal(question.max, "5", "max 5");
  question.inputType = "number";
  assert.equal(question.min, undefined, "min reset");
  assert.equal(question.max, undefined, "max reset");
  question.inputType = "date";
  assert.equal(question.min, undefined, "min not set");
  assert.equal(question.max, undefined, "max is not set");
  assert.equal(question.renderedMin, undefined, "renderedMin not set");
  assert.equal(question.renderedMax, "2999-12-31", "renderedMax is default");
  question.min = "2000-01-01";
  question.max = "2020-12-31";
  assert.equal(question.min, "2000-01-01", "min is set");
  assert.equal(question.max, "2020-12-31", "max is set");
  question.inputType = "number";
  question.min = "1";
  question.max = "=1+2";
  assert.equal(question.renderedMin, 1, "min is set to 1");
  assert.equal(question.renderedMax, 3, "max is set to 3");
});
QUnit.test("QuestionText renderedMin/renderedMax, today()", function(assert) {
  var survey = new SurveyModel({
    questions: [{ type: "text", name: "q", max: "=today()" }],
  });
  var question = <QuestionTextModel>survey.getQuestionByName("q");
  var todayStr = new Date().toISOString().slice(0, 10);
  assert.equal(question.renderedMax, todayStr, "today in format yyyy-mm-dd");
});
QUnit.test("QuestionText min/maxValueExpression, today()", function(assert) {
  var survey = new SurveyModel({
    questions: [{ type: "text", name: "q", maxValueExpression: "today()" }],
  });
  var question = <QuestionTextModel>survey.getQuestionByName("q");
  var todayStr = new Date().toISOString().slice(0, 10);
  assert.equal(
    question.renderedMax,
    todayStr,
    "renderedMax: today in format yyyy-mm-dd"
  );
});
QUnit.test("QuestionText min/maxValueExpression, today()", function(assert) {
  var survey = new SurveyModel({
    questions: [{ type: "text", name: "q", min: "=today()" }],
  });
  var question = <QuestionTextModel>survey.getQuestionByName("q");
  assert.equal(
    question.minValueExpression,
    "today()",
    "convert the min into minValueExpression"
  );
  assert.notOk(question.min, "min value becomes empty");
  var todayStr = new Date().toISOString().slice(0, 10);
  assert.equal(
    question.renderedMin,
    todayStr,
    "renderedMin: today in format yyyy-mm-dd"
  );
});
QUnit.test("QuestionText min/maxValueExpression, today()", function(assert) {
  var survey = new SurveyModel({
    questions: [
      { type: "text", inputType: "date", name: "q1" },
      {
        type: "text",
        inputType: "date",
        name: "q2",
        minValueExpression: "{q1}",
      },
    ],
  });
  var question = <QuestionTextModel>survey.getQuestionByName("q2");
  assert.notOk(question.renderedMin, "renderedMin is empty");
  survey.setValue("q1", "2021-02-18");
  assert.equal(question.renderedMin, "2021-02-18", "renderedMin: gets from q1");
});
QUnit.test(
  "QuestionText min/max do not allow to set value to survey if values are not in the range",
  function(assert) {
    var survey = new SurveyModel({
      questions: [
        { type: "text", name: "q1", inputType: "number", min: 3, max: 10 },
        {
          type: "text",
          name: "q2",
          inputType: "date",
          min: "2020-01-01",
          max: "2030-01-01",
        },
      ],
    });
    var q1 = <QuestionTextModel>survey.getQuestionByName("q1");
    var q2 = <QuestionTextModel>survey.getQuestionByName("q2");
    q1.value = 2;
    assert.equal(q1.value, 2, "Value 2 is set into question");
    assert.equal(
      survey.getValue("q1"),
      undefined,
      "Value 2 is not set into survey"
    );
    assert.equal(
      q1.errors.length,
      0,
      "There is no errors on setting invalid value"
    );
    assert.equal(q1.hasErrors(), true, "has errors on calling hasErrors");
    assert.equal(q1.errors.length, 1, "We have one error now");
    assert.equal(
      q1.errors[0].text,
      "The value should not be less than 3",
      "Check error text"
    );
    q1.value = 5;
    assert.equal(q1.value, 5, "Value 5 is set into question");
    assert.equal(survey.getValue("q1"), 5, "Value 5 is set into survey");
    assert.equal(
      q1.errors.length,
      0,
      "There is no errors on setting valid value"
    );
    assert.equal(q1.hasErrors(), false, "hasErrors return false");
    q1.value = 3;
    assert.equal(q1.value, 3, "Value 3 is set into question");
    assert.equal(survey.getValue("q1"), 3, "Value 3 is set into survey");
    q1.value = 11;
    assert.equal(q1.value, 11, "Value 11 is set into question");
    assert.equal(survey.getValue("q1"), 3, "Value 11 is not set into survey");
    q1.value = 10;
    assert.equal(q1.value, 10, "Value 3 is set into question");
    assert.equal(survey.getValue("q1"), 10, "Value 10 is set into survey");

    q2.value = "2019-01-01";
    assert.equal(
      new Date(q2.value).getUTCFullYear(),
      2019,
      "Value new Date('2019-01-01') is set into question"
    );
    assert.equal(
      survey.getValue("q2"),
      undefined,
      "Value new Date('2019-01-01') is not set into survey"
    );
    q2.value = "2022-01-01";
    assert.equal(
      new Date(q2.value).getUTCFullYear(),
      2022,
      "Value new Date('2022-01-01') is set into question"
    );
    assert.equal(
      new Date(survey.getValue("q2")).getUTCFullYear(),
      2022,
      "Value new Date('2022-01-01') is set into survey"
    );
    q2.value = "2020-01-01";
    assert.equal(
      new Date(q2.value).getUTCFullYear(),
      2020,
      "Value new Date('2020-01-01') is set into question"
    );
    assert.equal(
      new Date(survey.getValue("q2")).getUTCFullYear(),
      2020,
      "Value new Date('2020-01-01') is set into survey"
    );
    q2.value = "2031-01-01";
    assert.equal(
      new Date(q2.value).getUTCFullYear(),
      2031,
      "Value new Date('2031-01-01') is set into question"
    );
    assert.equal(
      new Date(survey.getValue("q2")).getUTCFullYear(),
      2020,
      "Value new Date('2031-01-01') is not set into survey"
    );
    q2.value = "2030-01-01";
    assert.equal(
      new Date(q2.value).getUTCFullYear(),
      2030,
      "Value Date('2030-01-01') is set into question"
    );
    assert.equal(
      new Date(survey.getValue("q2")).getUTCFullYear(),
      2030,
      "Value new Date('2030-01-01') is set into survey"
    );
  }
);

QUnit.test("QuestionText min/max properties and global setting", function(
  assert
) {
  settings.minDate = "1900-01-01";
  settings.maxDate = "2100-01-01";
  var survey = new SurveyModel({
    questions: [
      { type: "text", inputType: "date", name: "q1", min: "2020-01-01" },
      { type: "text", inputType: "date", name: "q2", max: "2030-01-01" },
    ],
  });
  var q1 = <QuestionTextModel>survey.getQuestionByName("q1");
  var q2 = <QuestionTextModel>survey.getQuestionByName("q2");

  assert.equal(q1.renderedMin, "2020-01-01");
  assert.equal(q1.renderedMax, "2100-01-01");
  assert.equal(q2.renderedMin, "1900-01-01");
  assert.equal(q2.renderedMax, "2030-01-01");
  settings.minDate = "";
  settings.maxDate = "";
});

QUnit.test("Question defaultValue as expression", function(assert) {
  var survey = new SurveyModel({
    questions: [{ type: "text", name: "q", defaultValue: "=1+2" }],
  });
  var question = <QuestionTextModel>survey.getQuestionByName("q");
  assert.notOk(question.defaultValue, "defaultValue is empty");
  assert.equal(
    question.defaultValueExpression,
    "1+2",
    "convert expression from default value"
  );
  assert.equal(question.value, 3, "run expression");
});
QUnit.test("Question defaultValueExpression", function(assert) {
  var survey = new SurveyModel({
    questions: [{ type: "text", name: "q", defaultValueExpression: "1+2" }],
  });
  var question = <QuestionTextModel>survey.getQuestionByName("q");
  assert.equal(question.value, 3, "run expression");
});
QUnit.test("Question defaultValueExpression with async function", function(
  assert
) {
  var returnResultFunc: (res: any) => void;
  function asyncFunc(params: any): any {
    returnResultFunc = this.returnResult;
    return false;
  }
  FunctionFactory.Instance.register("asyncFunc", asyncFunc, true);

  var survey = new SurveyModel({
    questions: [
      { type: "text", name: "q1", defaultValue: 1 },
      { type: "text", name: "q2", defaultValueExpression: "asyncFunc({q1})" },
    ],
  });
  var question = <QuestionTextModel>survey.getQuestionByName("q2");
  assert.notOk(question.value, "value is empty");
  returnResultFunc(survey.getValue("q1") * 3);
  assert.equal(question.value, 3, "Default async function is executed");
  FunctionFactory.Instance.unregister("asyncFunc");
});

QUnit.test("Question defaultValueExpression change value until it is not modified directly", function(
  assert
) {
  const survey = new SurveyModel({
    elements: [
      { type: "text", name: "q1", defaultValue: 1 },
      { type: "text", name: "q2", defaultValueExpression: "{q1} + 2" },
    ],
  });
  const q1 = survey.getQuestionByName("q1");
  const q2 = survey.getQuestionByName("q2");
  assert.equal(q2.value, 3, "initial value");
  q1.value = 5;
  assert.equal(q2.value, 7, "q1 is changed");
  q2.value = 4;
  assert.equal(q2.value, 4, "changed dirrectly");
  q1.value = 10;
  assert.equal(q2.value, 4, "stop react on defaultValueExpression");
});

QUnit.test("QuestionRating rateStep less than 1", function(assert) {
  var question = new QuestionRatingModel("q");
  assert.equal(question.visibleRateValues.length, 5, "There are 5 values");
  assert.equal(
    question.visibleRateValues[2].locText.renderedHtml,
    "3",
    "The third value"
  );
  question.rateMin = 0;
  question.rateStep = 0.1;
  question.rateMax = 0.5;
  assert.equal(question.visibleRateValues.length, 6, "There are 6 values");
  assert.equal(
    question.visibleRateValues[3].locText.renderedHtml,
    "0.3",
    "The fourth value"
  );
});
QUnit.test(
  "QuestionRating convert value to number when needed, Bug#2421",
  function(assert) {
    var question = new QuestionRatingModel("q");
    question.value = "2";
    assert.strictEqual(question.value, 2, "Convert to 2");
    question.value = undefined;
    assert.strictEqual(question.value, undefined, "undefined 1");
    question.rateValues = [1, "2", "3", 4];
    question.value = "3";
    assert.strictEqual(question.value, "3", "No need to convert");
    question.value = "1";
    assert.strictEqual(question.value, 1, "Convert to item.value, 1");
    question.value = undefined;
    assert.strictEqual(question.value, undefined, "undefined 2");
  }
);

QUnit.test(
  "QuestionRating value is reset when clicked again, Issue#2886",
  function(assert) {
    var question = new QuestionRatingModel("q");
    question.setValueFromClick("1");
    assert.strictEqual(question.value, 1, "Set to 1");
    question.setValueFromClick("2");
    assert.strictEqual(question.value, 2, "Set to 2");
    question.setValueFromClick("2");
    assert.notStrictEqual(question.value, 2, "No longer 2");
    assert.strictEqual(isNaN(question.value), true, "Value is reset");
  }
);

QUnit.test(
  "Do not serialize default values labelTrue/labelFalse for boolean question, Bug #2231",
  function(assert) {
    var question = new QuestionBooleanModel("q");
    assert.equal(
      question.locLabelTrue.textOrHtml,
      "Yes",
      "Default value for labelTrue"
    );
    assert.equal(
      question.locLabelFalse.textOrHtml,
      "No",
      "Default value for labelFalse"
    );
    assert.deepEqual(
      question.toJSON(),
      { name: "q" },
      "Serialize type and name only"
    );
  }
);
QUnit.test("Checkbox question getItemClass() + survey.onUpdateChoiceItemCss", function(assert) {
  var survey = new SurveyModel({
    elements: [
      {
        type: "checkbox",
        name: "q1",
        storeOthersAsComment: false,
        hasSelectAll: true,
        hasNone: true,
        choices: [1, 2],
      },
    ],
  });
  var q1 = <QuestionCheckboxModel>survey.getQuestionByName("q1");
  q1.value = [1];
  assert.equal(
    q1.getItemClass(q1.visibleChoices[0]),
    "sv_q_checkbox sv-q-col-1 sv_q_checkbox_selectall",
    "select all"
  );
  assert.equal(
    q1.getItemClass(q1.visibleChoices[1]),
    "sv_q_checkbox sv-q-col-1 checked",
    "item 1"
  );
  assert.equal(
    q1.getItemClass(q1.visibleChoices[2]),
    "sv_q_checkbox sv-q-col-1",
    "item 2"
  );
  assert.equal(
    q1.getItemClass(q1.visibleChoices[3]),
    "sv_q_checkbox sv-q-col-1 sv_q_checkbox_none",
    "None"
  );
  survey.onUpdateChoiceItemCss.add((sender, options) => {
    if(options.item.value == 2) {
      options.css = options.css + " custom";
    }
  });
  assert.equal(
    q1.getItemClass(q1.visibleChoices[2]),
    "sv_q_checkbox sv-q-col-1 custom",
    "item 2, value = 2, survey.onUpdateChoiceItemCss"
  );
});
QUnit.test(
  "Convert correctValue/defaultValue correctly on JSON loading",
  function(assert) {
    var json = {
      elements: [
        {
          type: "radiogroup",
          name: "radio_correct",
          items: [1, 2, 3],
          defaultValue: 1,
          correctAnswer: "234",
        },
        {
          type: "checkbox",
          name: "check_correct",
          items: [1, 2, 3],
          defaultValue: [1],
          correctAnswer: [2],
        },
        {
          type: "radiogroup",
          name: "radio_incorrect",
          items: [1, 2, 3],
          defaultValue: [1, 2],
          correctAnswer: [2],
        },
        {
          type: "checkbox",
          name: "check_incorrect",
          items: [1, 2, 3],
          defaultValue: 1,
          correctAnswer: "123",
        },
      ],
    };
    var survey = new SurveyModel(json);
    var radio_correct = survey.getQuestionByName("radio_correct");
    var check_correct = survey.getQuestionByName("check_correct");
    var radio_incorrect = survey.getQuestionByName("radio_incorrect");
    var check_incorrect = survey.getQuestionByName("check_incorrect");
    assert.equal(radio_correct.defaultValue, 1, "radio_correct, defaultValue");
    assert.equal(
      radio_correct.correctAnswer,
      "234",
      "radio_correct, correctAnswer"
    );
    assert.deepEqual(
      check_correct.defaultValue,
      [1],
      "check_correct, defaultValue"
    );
    assert.deepEqual(
      check_correct.correctAnswer,
      [2],
      "check_correct, correctAnswer"
    );
    assert.equal(
      radio_incorrect.defaultValue,
      1,
      "radio_incorrect, defaultValue"
    );
    assert.equal(
      radio_incorrect.correctAnswer,
      2,
      "radio_incorrect, correctAnswer"
    );
    assert.deepEqual(
      check_incorrect.defaultValue,
      [1],
      "check_incorrect, defaultValue"
    );
    assert.deepEqual(
      check_incorrect.correctAnswer,
      ["123"],
      "check_incorrect, correctAnswer"
    );
  }
);

QUnit.test("QuestionSignaturePadModel dataFormat default value", function(
  assert
) {
  var question = new QuestionSignaturePadModel("q");
  assert.equal(question.dataFormat, "", "default value");
});

QUnit.test("QuestionSignaturePadModel dataFormat values", function(assert) {
  var question = new QuestionSignaturePadModel("q");
  assert.equal(question.dataFormat, "", "defaultValue");

  var el = document.createElement("div");
  el.appendChild(document.createElement("canvas"));
  el.appendChild(document.createElement("button"));
  question.initSignaturePad(el);

  question["updateValue"]();
  assert.equal(question.value.substring(0, 15), "data:image/png;", "png");

  question.dataFormat = "image/jpeg";
  assert.equal(question.dataFormat, "image/jpeg", "jpeg format");
  question["updateValue"]();
  assert.equal(question.value.substring(0, 15), "data:image/jpeg", "jpeg");

  question.dataFormat = "image/svg+xml";
  assert.equal(question.dataFormat, "image/svg+xml", "svg format");
  question["updateValue"]();
  assert.equal(question.value.substring(0, 15), "data:image/svg+", "svg");
});

QUnit.test("Question.getProgressInfo()", function(assert) {
  var question = new QuestionTextModel("q1");
  assert.deepEqual(question.getProgressInfo(), {
    questionCount: 1,
    answeredQuestionCount: 0,
    requiredQuestionCount: 0,
    requiredAnsweredQuestionCount: 0,
  });
  question.value = "1";
  assert.deepEqual(question.getProgressInfo(), {
    questionCount: 1,
    answeredQuestionCount: 1,
    requiredQuestionCount: 0,
    requiredAnsweredQuestionCount: 0,
  });
  question.isRequired = true;
  assert.deepEqual(question.getProgressInfo(), {
    questionCount: 1,
    answeredQuestionCount: 1,
    requiredQuestionCount: 1,
    requiredAnsweredQuestionCount: 1,
  });
});
QUnit.test("QuestionMultipleText.getProgressInfo()", function(assert) {
  var question = new QuestionMultipleTextModel("q1");
  question.addItem("item1");
  question.addItem("item2");
  question.addItem("item3");
  assert.deepEqual(
    question.getProgressInfo(),
    {
      questionCount: 3,
      answeredQuestionCount: 0,
      requiredQuestionCount: 0,
      requiredAnsweredQuestionCount: 0,
    },
    "empty"
  );
  question.isRequired = true;
  assert.deepEqual(
    question.getProgressInfo(),
    {
      questionCount: 3,
      answeredQuestionCount: 0,
      requiredQuestionCount: 1,
      requiredAnsweredQuestionCount: 0,
    },
    "root is required"
  );
  question.value = { item1: "1" };
  assert.deepEqual(
    question.getProgressInfo(),
    {
      questionCount: 3,
      answeredQuestionCount: 1,
      requiredQuestionCount: 1,
      requiredAnsweredQuestionCount: 1,
    },
    "root is requried and has one value"
  );
  question.isRequired = false;
  assert.deepEqual(
    question.getProgressInfo(),
    {
      questionCount: 3,
      answeredQuestionCount: 1,
      requiredQuestionCount: 0,
      requiredAnsweredQuestionCount: 0,
    },
    "has one value"
  );
  question.items[0].isRequired = true;
  question.items[1].isRequired = true;
  assert.deepEqual(
    question.getProgressInfo(),
    {
      questionCount: 3,
      answeredQuestionCount: 1,
      requiredQuestionCount: 2,
      requiredAnsweredQuestionCount: 1,
    },
    "two items are required and has one value"
  );
  question.isRequired = true;
  assert.deepEqual(
    question.getProgressInfo(),
    {
      questionCount: 3,
      answeredQuestionCount: 1,
      requiredQuestionCount: 2,
      requiredAnsweredQuestionCount: 1,
    },
    "root is required and two items are required and has one value"
  );
  question.items[1].editor.visible = false;
  assert.deepEqual(
    question.getProgressInfo(),
    {
      questionCount: 2,
      answeredQuestionCount: 1,
      requiredQuestionCount: 1,
      requiredAnsweredQuestionCount: 1,
    },
    "root is required and two items are required and has one value and one required item is invisible"
  );
});
QUnit.test("Set value with hasOther that is not in the list", function(assert) {
  var survey = new SurveyModel({
    elements: [
      { type: "dropdown", name: "q1", choices: [1, 2], hasOther: true },
      { type: "checkbox", name: "q2", choices: [1, 2], hasOther: true },
    ],
  });
  survey.data = { q1: "NonInList" };
  var question = <QuestionDropdownModel>survey.getQuestionByName("q1");
  assert.equal(question.value, question.otherItem.value, "other is set");
  assert.equal(question.comment, "NonInList", "comment is set");
  survey.data = { q1: 1 };
  assert.equal(question.value, 1, "value is set");
  assert.equal(question.comment, "", "comment is empty");
  survey.data = { q1: "NonInList2" };
  assert.equal(
    question.value,
    question.otherItem.value,
    "other is set second time"
  );
  assert.equal(question.comment, "NonInList2", "comment is set second time");

  survey.data = { q2: [1, "NonInList"] };
  var question2 = <QuestionCheckboxModel>survey.getQuestionByName("q2");
  assert.deepEqual(
    question2.value,
    [1, question2.otherItem.value],
    "checkbox: other is set"
  );
  assert.equal(question2.comment, "NonInList", "checkbox: comment is set");
  survey.data = { q2: [1, 2] };
  assert.deepEqual(question2.value, [1, 2], "checkbox: value is set");
  assert.equal(question2.comment, "", "checkbox: comment is empty");
  survey.data = { q2: [2, "NonInList2"] };
  assert.deepEqual(
    question2.value,
    [2, question2.otherItem.value],
    "checkbox: other is set second time"
  );
  assert.equal(
    question2.comment,
    "NonInList2",
    "checkbox: comment is set second time"
  );
});
QUnit.test("question.isInputTextUpdate", function(assert) {
  var survey = new SurveyModel({
    elements: [{ type: "text", name: "q1" }],
  });
  var question = <QuestionTextModel>survey.getQuestionByName("q1");
  assert.equal(
    question.isInputTextUpdate,
    false,
    "survey.textUpdateMode == onBlur (default)"
  );
  survey.textUpdateMode = "onTyping";
  assert.equal(
    question.isInputTextUpdate,
    true,
    "survey.textUpdateMode == onTyping"
  );
  question.inputType = "date";
  assert.equal(question.isInputTextUpdate, false, "inputType = date");
  question.inputType = "number";
  assert.equal(question.isInputTextUpdate, true, "inputType = number");
});
QUnit.test("matirix row, rowClasses property", function(assert) {
  var survey = new SurveyModel({
    elements: [
      {
        type: "matrix",
        name: "q1",
        columns: ["col1", "col2"],
        rows: ["row1", "row2"],
        isAllRowRequired: true,
      },
    ],
  });
  survey.css = { matrix: { row: "row", rowError: "row_error" } };
  var question = <QuestionMatrixModel>survey.getQuestionByName("q1");
  assert.ok(question.cssClasses.row, "Row class is not empty");
  assert.equal(question.visibleRows[0].rowClasses, "row", "Set row class");
  question.hasErrors();
  assert.equal(
    question.visibleRows[0].rowClasses,
    "row row_error",
    "Error for the first row"
  );
  question.visibleRows[0].value = "col1";
  assert.equal(
    question.visibleRows[0].rowClasses,
    "row",
    "first row value is set"
  );
  assert.equal(
    question.visibleRows[1].rowClasses,
    "row row_error",
    "Error for the second row"
  );
});
QUnit.test("matirix and survey.onValueChanged event, Bug#2408", function(
  assert
) {
  var survey = new SurveyModel({
    elements: [
      {
        type: "matrix",
        name: "q1",
        columns: ["col1", "col2"],
        rows: ["row1", "row2"],
      },
    ],
  });
  var question = <QuestionMatrixModel>survey.getQuestionByName("q1");
  survey.onValueChanging.add(function(sender, options) {
    var keys = [];
    for (var key in options.value) {
      keys.push(key);
    }
    if (keys.length == 2 && !!options.oldValue) {
      for (var key in options.oldValue) {
        delete options.value[key];
        break;
      }
    }
  });
  var rows = question.visibleRows;
  rows[0].value = "col1";
  assert.deepEqual(question.value, { row1: "col1" }, "initial set correctly");
  rows[1].value = "col1";
  assert.deepEqual(
    question.value,
    { row2: "col1" },
    "remove value in question"
  );
  assert.notOk(rows[0].value, "Clear value onValueChanging event");
});
QUnit.test(
  "min/max properties do not load if they are upper inputType, Bug#",
  function(assert) {
    var survey = new SurveyModel({
      elements: [
        {
          type: "text",
          name: "q1",
          min: 0,
          max: 100,
          inputType: "number",
        },
      ],
    });
    var question = <QuestionTextModel>survey.getQuestionByName("q1");
    assert.equal(question.min, 0, "min value is set");
    assert.equal(question.max, 100, "max value is set");
  }
);
QUnit.test(
  "min/max properties and checkErrorsMode equals to 'onValueChanging', Bug#2647",
  function(assert) {
    var survey = new SurveyModel({
      checkErrorsMode: "onValueChanging",
      elements: [
        {
          type: "text",
          name: "q1",
          min: 0,
          max: 100,
          inputType: "number",
        },
      ],
    });
    var question = <QuestionTextModel>survey.getQuestionByName("q1");
    question.value = 10;
    assert.equal(survey.getValue("q1"), 10, "Set 10 to survey");
    question.value = -5;
    assert.equal(survey.getValue("q1"), 10, "Could not set -5 to survey");
    question.value = 500;
    assert.equal(survey.getValue("q1"), 10, "Could not set 500 to survey");
    question.value = 50;
    assert.equal(survey.getValue("q1"), 50, "Set 50 to survey");
  }
);

QUnit.test(
  "setvalue trigger dosen't work for question name with '.', Bug#2420",
  function(assert) {
    var survey = new SurveyModel({
      elements: [
        {
          type: "text",
          name: "a.b",
        },
      ],
      triggers: [
        {
          type: "setvalue",
          expression: "{q1} = 1",
          setToName: "a.b",
          setValue: 2,
        },
      ],
    });
    survey.setValue("q1", 1);
    assert.deepEqual(
      survey.data,
      { q1: 1, "a.b": 2 },
      "trigger works correctly"
    );
  }
);
QUnit.test(
  "setvalue trigger dosen't work for question name with '.', Bug#2597",
  function(assert) {
    var survey = new SurveyModel({
      elements: [
        {
          type: "dropdown",
          name: "question.name1",
          choices: ["item1", "item2", "item3", "item4"],
        },
        {
          type: "text",
          name: "question.name2",
        },
      ],
      triggers: [
        {
          type: "setvalue",
          expression: "{question.name1} anyof ['item1', 'item2']",
          setToName: "question.name2",
          setValue: "one",
        },
        {
          type: "setvalue",
          expression: "{question.name1} anyof ['item3', 'item4']",
          setToName: "question.name2",
          setValue: "two",
        },
      ],
    });
    survey.setValue("question.name1", ["item1"]);
    assert.equal(
      survey.getValue("question.name2"),
      "one",
      "trigger one works correctly"
    );
    survey.setValue("question.name1", ["item3"]);
    assert.equal(
      survey.getValue("question.name2"),
      "two",
      "trigger two works correctly"
    );
  }
);
QUnit.test("maxSelectedChoices in checkbox", function(assert) {
  var survey = new SurveyModel({
    elements: [
      {
        type: "checkbox",
        name: "q1",
        choices: [1, 2, 3, 4, 5],
        maxSelectedChoices: 2,
        hasSelectAll: true,
        hasOther: true,
      },
    ],
  });
  var question = <QuestionCheckboxModel>survey.getQuestionByName("q1");
  assert.equal(
    question.choices[0].isEnabled,
    true,
    "the first item is enabled"
  );
  assert.equal(question.otherItem.isEnabled, true, "otherItem is enabled");
  assert.equal(
    question.selectAllItem.isEnabled,
    false,
    "select all is disabled"
  );
  question.value = [2, 3];
  assert.equal(
    question.choices[0].isEnabled,
    false,
    "the first item is disabled now"
  );
  assert.equal(
    question.choices[1].isEnabled,
    true,
    "the second item is selected"
  );
  assert.equal(question.otherItem.isEnabled, false, "otherItem is disabled");
  question.value = [2];
  assert.equal(
    question.choices[0].isEnabled,
    true,
    "the first item is enabled again"
  );
  assert.equal(
    question.otherItem.isEnabled,
    true,
    "otherItem is enabled again"
  );
  question.value = [2, "other"];
  assert.equal(
    question.choices[0].isEnabled,
    false,
    "the first item is disabled again"
  );
  assert.equal(
    question.otherItem.isEnabled,
    true,
    "otherItem is enabled, it is selected"
  );
});

QUnit.test("Matrix Question: columns with true/false values", function(assert) {
  var matrix = new QuestionMatrixModel("q1");
  matrix.columns = [true, false, 0, "0", 1];
  matrix.rows = ["row1", "row2", "row3", "row4"];
  matrix.visibleRows[0].value = "true";
  assert.strictEqual(
    matrix.visibleRows[0].value,
    true,
    "Set true and not 'true'"
  );
  matrix.visibleRows[0].value = "false";
  assert.strictEqual(
    matrix.visibleRows[0].value,
    false,
    "Set false and not 'false'"
  );
  matrix.visibleRows[0].value = "0";
  assert.strictEqual(matrix.visibleRows[0].value, "0", "Set '0' and not 0");
});
QUnit.test("Base Select Question: choicesFromQuestion", function(assert) {
  var survey = new SurveyModel({
    elements: [
      { type: "checkbox", name: "q1", choices: [1, 2, 3, 4, 5] },
      {
        type: "checkbox",
        name: "q2",
        choices: [1, 2, 3],
        choicesFromQuestion: "q1",
      },
      { type: "radiogroup", name: "q3", choices: [1, 2, 3, 4, 5, 6, 7] },
    ],
  });
  var q1 = <QuestionCheckboxModel>survey.getQuestionByName("q1");
  var q2 = <QuestionCheckboxModel>survey.getQuestionByName("q2");
  assert.equal(q2.visibleChoices.length, 5, "Get choices from q1");
  q2.choicesFromQuestion = "q3";
  assert.equal(q2.visibleChoices.length, 7, "Get choices from q3");
  q2.choicesFromQuestion = "q1";
  assert.equal(q2.visibleChoices.length, 5, "Get choices from q1 again");
  q1.choices.push(new ItemValue(6));
  assert.equal(q2.visibleChoices.length, 6, "q1.choices updated");
});
QUnit.test("Base Select Question: choicesFromQuestionMode", function(assert) {
  var survey = new SurveyModel({
    elements: [
      { type: "checkbox", name: "q1", choices: [1, 2, 3, 4, 5] },
      {
        type: "checkbox",
        name: "q2",
        choices: [1, 2, 3],
        choicesFromQuestion: "q1",
        choicesFromQuestionMode: "selected",
      },
    ],
  });
  var q1 = <QuestionCheckboxModel>survey.getQuestionByName("q1");
  var q2 = <QuestionCheckboxModel>survey.getQuestionByName("q2");
  assert.equal(q2.visibleChoices.length, 0, "There is no selected");
  q1.value = [1, 4];
  assert.equal(q2.visibleChoices.length, 2, "There are two selected items");
  q2.choicesFromQuestionMode = "unselected";
  assert.equal(q2.visibleChoices.length, 3, "There are 3  unselected items");
  q2.choicesFromQuestionMode = "all";
  assert.equal(q2.visibleChoices.length, 5, "Show all items");
  q1.choicesVisibleIf = "{item} > 2";
  assert.equal(q2.visibleChoices.length, 3, "Appy q1.choicesVisibleIf");
  q2.choicesFromQuestionMode = "unselected";
  assert.equal(
    q2.visibleChoices.length,
    2,
    "Appy choicesFromQuestionMode and choicesVisibleIf"
  );
});
QUnit.test("Base Select Question: choicesFromQuestion double tunnel", function(
  assert
) {
  var survey = new SurveyModel({
    elements: [
      { type: "checkbox", name: "q1", choices: [1, 2, 3, 4, 5] },
      {
        type: "radiogroup",
        name: "q2",
        choicesFromQuestion: "q1",
        choicesFromQuestionMode: "selected",
      },
      {
        type: "dropdown",
        name: "q3",
        choicesFromQuestion: "q2",
        choicesFromQuestionMode: "unselected",
      },
    ],
  });
  var q1 = <QuestionCheckboxModel>survey.getQuestionByName("q1");
  var q2 = <QuestionCheckboxModel>survey.getQuestionByName("q2");
  var q3 = <QuestionCheckboxModel>survey.getQuestionByName("q3");
  assert.equal(q2.visibleChoices.length, 0, "There is no selected in q2");
  assert.equal(q3.visibleChoices.length, 0, "There is no selected in q3");
  q1.value = [1, 4, 5];
  assert.equal(
    q2.visibleChoices.length,
    3,
    "There are three selected items in q2"
  );
  assert.equal(
    q3.visibleChoices.length,
    3,
    "There are three selected items in q3"
  );
  q2.value = 4;
  assert.equal(
    q3.visibleChoices.length,
    2,
    "There are two selected items in q3 now"
  );
});
QUnit.test("Reset choicesFromQuestion on deleting main question", function(
  assert
) {
  var survey = new SurveyModel({
    elements: [
      { type: "checkbox", name: "q1", choices: [1, 2, 3, 4, 5] },
      {
        type: "checkbox",
        name: "q2",
        choices: [1, 2, 3],
        choicesFromQuestion: "q1",
      },
      { type: "radiogroup", name: "q3", choices: [1, 2, 3, 4, 5, 6, 7] },
    ],
  });
  var q1 = <QuestionCheckboxModel>survey.getQuestionByName("q1");
  var q2 = <QuestionCheckboxModel>survey.getQuestionByName("q2");
  assert.ok(q2.choicesFromQuestion, "choicesFromQuestion is here");
  assert.equal(q2.visibleChoices.length, 5, "Get choices from q1");
  survey.pages[0].removeElement(q1);
  q1.dispose();
  assert.notOk(q2.choicesFromQuestion, "choicesFromQuestion is reset");
  assert.equal(q2.visibleChoices.length, 3, "Get choices from q2");
});
QUnit.test("choicesFromQuestion predefined data, Bug#2648", function(assert) {
  var survey = new SurveyModel({
    elements: [
      { type: "checkbox", name: "q1", choices: [1, 2, 3, 4, 5] },
      {
        type: "checkbox",
        name: "q2",
        choicesFromQuestion: "q1",
        choicesFromQuestionMode: "selected",
      },
    ],
  });
  survey.data = { q1: [1, 3, 5] };
  var q2 = <QuestionCheckboxModel>survey.getQuestionByName("q2");
  assert.ok(q2.choicesFromQuestion, "choicesFromQuestion is here");
  assert.equal(q2.visibleChoices.length, 3, "Get choices from q1.value");
});
QUnit.test(
  "choicesFromQuestion hasSelectAll, hasNone, hasOther properties, Bug#",
  function(assert) {
    var survey = new SurveyModel({
      elements: [
        {
          type: "checkbox",
          name: "q1",
          choices: [1, 2, 3],
          hasSelectAll: true,
          hasNone: true,
          hasOther: true,
        },
        {
          type: "checkbox",
          name: "q2",
          choicesFromQuestion: "q1",
          hasSelectAll: true,
          hasNone: true,
          hasOther: true,
        },
      ],
    });
    var q2 = <QuestionCheckboxModel>survey.getQuestionByName("q2");
    assert.ok(q2.choicesFromQuestion, "choicesFromQuestion is here");
    assert.equal(
      q2.visibleChoices.length,
      6,
      "We do not duplicate selectedAll, none and other"
    );
  }
);
QUnit.test("text question dataList", function(assert) {
  var survey = new SurveyModel({
    elements: [
      { type: "text", name: "q1", dataList: ["abc", "def", "ghk"] },
      { type: "text", name: "q2" },
    ],
  });
  var q1 = <QuestionTextModel>survey.getQuestionByName("q1");
  var q2 = <QuestionTextModel>survey.getQuestionByName("q2");
  assert.deepEqual(q1.dataList, ["abc", "def", "ghk"]);
  assert.equal(q1.dataListId, q1.id + "_datalist");
  assert.deepEqual(q2.dataList, []);
  assert.equal(q2.dataListId, "");
  q2.dataList = ["item1", "item2"];
  assert.deepEqual(
    q2.dataList,
    ["item1", "item2"],
    "Set from the code correctly"
  );
});
QUnit.test("text question renderedStep", function(assert) {
  var survey = new SurveyModel({
    elements: [
      { type: "text", inputType: "number", name: "q1" },
      { type: "text", inputType: "number", name: "q2", step: 0.2 },
    ],
  });
  var q1 = <QuestionTextModel>survey.getQuestionByName("q1");
  var q2 = <QuestionTextModel>survey.getQuestionByName("q2");
  assert.equal(q1.renderedStep, "any", "Default value is 'any'");
  assert.equal(q2.renderedStep, 0.2, "get value from step");
});
QUnit.test("text question inputSize and inputWidth", function(assert) {
  var survey = new SurveyModel({
    elements: [
      { type: "text", inputType: "text", name: "q1", size: 10 },
      { type: "text", inputType: "number", name: "q2", size: 10 },
      { type: "text", inputType: "text", name: "q3" },
    ],
  });
  var q1 = <QuestionTextModel>survey.getQuestionByName("q1");
  var q2 = <QuestionTextModel>survey.getQuestionByName("q2");
  var q3 = <QuestionTextModel>survey.getQuestionByName("q2");
  assert.equal(q1.inputSize, 10, "q1 rendered size is 10");
  assert.equal(q2.inputSize, 0, "q2 rendered size is empty");
  assert.equal(q3.inputSize, 0, "q3 rendered size is empty");
  q1.size = 12;
  assert.equal(q1.inputSize, "12", "q1 rendered size is 12");

  assert.equal(q1.inputWidth, "auto", "q1 inputWidth is auto");
  assert.equal(q2.inputWidth, "", "q2 inputWidth is empty");
  assert.equal(q3.inputWidth, "", "q3 inputWidth is empty");

  assert.equal(q1.inputStyle.width, "auto", "q1 inputStyle width is auto");
  assert.equal(q2.inputStyle.width, undefined, "q2 inputStyle width is undefined");
  assert.equal(q3.inputStyle.width, undefined, "q3 inputStyle width is undefined");
});
QUnit.test("Multiple Text Question: itemSize", function(assert) {
  var mText = new QuestionMultipleTextModel("mText");
  mText.items.push(new MultipleTextItemModel("q1"));
  mText.items.push(new MultipleTextItemModel("q2"));
  mText.items.push(new MultipleTextItemModel("q3"));
  var q1 = mText.items[0].editor;
  var q2 = mText.items[1].editor;
  var q3 = mText.items[2].editor;
  q2.inputType = "number";
  q1.size = 10;
  assert.equal(q1.inputSize, 10, "q1 rendered size is 10");
  assert.equal(q2.inputSize, 0, "q2 rendered size is empty");
  assert.equal(q3.inputSize, 0, "q3 rendered size is empty");
  mText.itemSize = 15;
  assert.equal(q1.inputSize, 10, "q1 rendered size is 10");
  assert.equal(q2.inputSize, 0, "q2 rendered size is still empty");
  assert.equal(q3.inputSize, 15, "q3 rendered size is 15, from parent");
});
QUnit.test(
  "multipletext question: empty string should return isEmpty(), bug #2803",
  function(assert) {
    var json = {
      questionTitleTemplate: "{no}. {title} {require}",
      elements: [
        {
          type: "multipletext",
          name: "question1",
          items: [
            {
              name: "text1",
            },
            {
              name: "text2",
            },
          ],
        },
      ],
    };
    var survey = new SurveyModel(json);
    var q = <QuestionMultipleTextModel>survey.getQuestionByName("question1");
    q.items[0].value = "1";
    q.items[1].value = "";
    assert.deepEqual(q.value, { text1: "1" }, "There is no item2");
    q.items[1].value = 0;
    assert.deepEqual(q.value, { text1: "1", text2: 0 }, "Include item2");
  }
);
QUnit.test(
  "Expression question: should not calculate value when survey in display mode, bug #2808",
  function(assert) {
    var json = {
      questionTitleTemplate: "{no}. {title} {require}",
      elements: [
        {
          type: "text",
          name: "q1",
        },
        {
          type: "text",
          name: "q2",
        },
        {
          type: "expression",
          name: "q3",
          expression: "{q1}+{q2}",
        },
      ],
    };
    var survey = new SurveyModel(json);
    survey.mode = "display";
    survey.data = { q1: 1, q2: 2, q3: 5 };
    assert.equal(
      survey.getValue("q3"),
      5,
      "We do not run expressions in display mode"
    );
  }
);
QUnit.test(
  "Creator V2: add into visibleChoices others/hasOther items in design mode",
  function(assert) {
    var json = {
      elements: [
        {
          type: "radiogroup",
          name: "q1",
          choices: ["item1", "item2", "item3"],
        },
        {
          type: "checkbox",
          name: "q2",
          choices: ["item1", "item2", "item3"],
        },
      ],
    };
    settings.supportCreatorV2 = true;
    var survey = new SurveyModel();
    survey.setDesignMode(true);
    survey.fromJSON(json);
    var q1 = <QuestionRadiogroupModel>survey.getQuestionByName("q1");
    var q2 = <QuestionCheckboxModel>survey.getQuestionByName("q2");
    assert.equal(q1.visibleChoices.length, 6, "Show None+hasOther+new: 3+3");
    assert.equal(
      q2.visibleChoices.length,
      7,
      "Show SelectAll+None+hasOther+new: 3+4"
    );

    assert.equal(q1.visibleChoices[0].value, "item1", "item1 is the first");
    assert.equal(
      q1.isItemInList(q1.visibleChoices[0]),
      true,
      "item1 is in list"
    );
    assert.equal(
      q1.visibleChoices[3].value,
      "newitem",
      "new item is next after real items"
    );

    assert.equal(
      q1.isItemInList(q1.visibleChoices[3]),
      false,
      "new item is never in the list"
    );

    assert.equal(q1.visibleChoices[5].value, "none", "index=5, none");
    assert.equal(
      q1.isItemInList(q1.visibleChoices[5]),
      false,
      "none not in list"
    );
    q1.hasNone = true;
    assert.equal(q1.isItemInList(q1.visibleChoices[5]), true, "none in list");

    assert.equal(q1.visibleChoices[4].value, "other", "index=4, other");
    assert.equal(
      q1.isItemInList(q1.visibleChoices[4]),
      false,
      "other not in list"
    );
    q1.hasOther = true;
    assert.equal(q1.isItemInList(q1.visibleChoices[4]), true, "other in list");

    assert.equal(q2.visibleChoices[0].value, "selectall", "index=0, selectall");
    assert.equal(
      q2.isItemInList(q2.visibleChoices[0]),
      false,
      "selectall not in list"
    );
    q2.hasSelectAll = true;
    assert.equal(
      q2.isItemInList(q2.visibleChoices[0]),
      true,
      "selectall in list"
    );

    settings.supportCreatorV2 = false;
  }
);
QUnit.test(
  "Creator V2: add into visibleChoices others/hasOther items in design mode and canShowOptionItemCallback",
  function(assert) {
    var json = {
      elements: [
        {
          type: "checkbox",
          name: "q1",
          choices: ["item1", "item2"],
        },
      ],
    };
    settings.supportCreatorV2 = true;
    var survey = new SurveyModel();
    survey.setDesignMode(true);
    survey.fromJSON(json);
    var q1 = <QuestionCheckboxModel>survey.getQuestionByName("q1");
    var isReadOnly = false;
    q1.setCanShowOptionItemCallback((item: ItemValue): boolean => {
      return !isReadOnly && (item.value !== "newitem" || q1.choices.length < 3);
    });
    assert.equal(
      q1.visibleChoices.length,
      6,
      "Show SelectAll+None+hasOther+new: 2+4"
    );
    q1.choices.push(new ItemValue("item3"));
    assert.equal(
      q1.visibleChoices.length,
      6,
      "Show SelectAll+None+hasOther-new: 3+3"
    );
    isReadOnly = true;
    q1.choices.splice(2, 1);
    assert.equal(
      q1.visibleChoices.length,
      2,
      "Do not show SelectAll+None+hasOther+new: 2"
    );
    q1.hasSelectAll = true;
    q1.hasNone = true;
    q1.hasOther = true;
    assert.equal(
      q1.visibleChoices.length,
      5,
      "Do not show SelectAll+None+hasOther are set: 2 + 3"
    );
    settings.supportCreatorV2 = false;
  }
);

QUnit.test(
  "Creator V2: Hide selectAll, hasNone and hasOther if this properties are invisible",
  function(assert) {
    var json = {
      elements: [
        {
          type: "checkbox",
          name: "q1",
          choices: ["item1", "item2", "item3"],
        },
      ],
    };
    settings.supportCreatorV2 = true;
    Serializer.findProperty("selectbase", "hasOther").visible = false;
    Serializer.findProperty("selectbase", "hasNone").visible = false;
    Serializer.findProperty("checkbox", "hasSelectAll").visible = false;
    var survey = new SurveyModel();
    survey.setDesignMode(true);
    survey.fromJSON(json);
    var q1 = <QuestionCheckboxModel>survey.getQuestionByName("q1");
    assert.equal(
      q1.visibleChoices.length,
      4,
      "Hide SelectAll+None+hasOther and show only new: 3+4 - 3"
    );
    Serializer.findProperty("selectbase", "hasOther").visible = true;
    Serializer.findProperty("selectbase", "hasNone").visible = true;
    Serializer.findProperty("checkbox", "hasSelectAll").visible = true;
    settings.supportCreatorV2 = false;
  }
);
QUnit.test(
  "Creator V2: add into visibleChoices others/hasOther items in design mode, add new question",
  function(assert) {
    var json = {
      elements: [
        {
          type: "radiogroup",
          name: "q1",
        },
      ],
    };
    settings.supportCreatorV2 = true;
    var survey = new SurveyModel();
    survey.setDesignMode(true);
    survey.fromJSON(json);
    var q2 = new QuestionCheckboxModel("q2");
    q2.choices = ["item1", "item2", "item3"];
    survey.pages[0].addQuestion(q2);
    var q1 = <QuestionRadiogroupModel>survey.getQuestionByName("q1");
    (q1.choices = ["item1", "item2", "item3"]),
    assert.equal(q1.visibleChoices.length, 6, "Show None+hasOther+new: 3+3");
    assert.equal(
      q2.visibleChoices.length,
      7,
      "Show SelectAll+None+hasOther+new: 3+4"
    );
    settings.supportCreatorV2 = false;
  }
);
QUnit.test(
  "Creator V2: add into visibleChoices None item for ranking question and don't add Select All",
  function(assert) {
    var json = {
      elements: [
        {
          type: "ranking",
          name: "q1",
        },
      ],
    };
    settings.supportCreatorV2 = true;
    var survey = new SurveyModel();
    survey.setDesignMode(true);
    survey.fromJSON(json);
    var q1 = <QuestionRankingModel>survey.getQuestionByName("q1");
    q1.choices = ["item1", "item2", "item3"];
    assert.notOk(q1["supportSelectAll"]());
    assert.equal(q1.visibleChoices.length, 4, "Show new: 3+1");
    settings.supportCreatorV2 = false;
  }
);
QUnit.test(
  "Creator V2: do not add into visibleChoices items for inner matrix questions",
  function(assert) {
    var json = {
      elements: [
        {
          type: "matrixdynamic",
          name: "question1",
          columns: [
            { name: "Column 1" },
            { name: "Column 2" },
            { name: "Column 3" },
          ],
          choices: [1, 2, 3],
          cellType: "checkbox",
        },
      ],
    };
    settings.supportCreatorV2 = true;
    var survey = new SurveyModel();
    survey.setDesignMode(true);
    survey.fromJSON(json);
    var q1 = <QuestionMatrixDropdownModelBase>(
      survey.getQuestionByName("question1")
    );
    var innerQuestion = q1.visibleRows[0].cells[0].question;
    assert.equal(
      innerQuestion.visibleChoices.length,
      3,
      "Show only 3 choice items"
    );
    settings.supportCreatorV2 = false;
  }
);
QUnit.test("Update choices order on changing locale, bug #2832", function(
  assert
) {
  var json = {
    elements: [
      {
        type: "checkbox",
        name: "q1",
        choices: [
          {
            value: "item1",
            text: {
              default: "Aaa",
              fr: "ccc",
            },
          },
          {
            value: "item2",
            text: {
              default: "Bbb",
              fr: "aaa",
            },
          },
          {
            value: "item3",
            text: {
              default: "Cccc",
              fr: "bbb",
            },
          },
        ],
        choicesOrder: "asc",
      },
    ],
  };
  var survey = new SurveyModel(json);
  survey.locale = "fr";
  var q1 = <QuestionCheckboxModel>survey.getQuestionByName("q1");
  assert.equal(q1.visibleChoices[0].value, "item2", "aaa in fr locale");
  assert.equal(q1.visibleChoices[1].value, "item3", "bbb in fr locale");
  assert.equal(q1.visibleChoices[2].value, "item1", "ccc in fr locale");
});
QUnit.test(
  "boolean question default value is not assign into readOnly question, bug #",
  function(assert) {
    var json = {
      elements: [
        {
          type: "boolean",
          name: "q1",
          defaultValue: true,
          readOnly: true,
        },
        {
          type: "text",
          name: "q2",
          defaultValue: "abc",
          readOnly: true,
        },
      ],
    };
    var survey = new SurveyModel(json);
    var q1 = survey.getQuestionByName("q1");
    var q2 = survey.getQuestionByName("q2");
    assert.equal(q1.value, true, "default value is set, boolean");
    assert.equal(q2.value, "abc", "default value is set, text");
  }
);
QUnit.test("Use empty string as a valid value", function(assert) {
  var json = {
    elements: [
      {
        type: "dropdown",
        name: "q1",
        choices: [{ value: "", text: "empty" }, "item2", "item3"],
      },
    ],
  };
  var survey = new SurveyModel(json);
  var q1 = <QuestionDropdownModel>survey.getQuestionByName("q1");
  assert.equal(
    q1.displayValue,
    "empty",
    "We get display Value for empty string"
  );
});
QUnit.test("Use question onDisplayValueCallback", function(assert) {
  var json = {
    elements: [
      {
        type: "dropdown",
        name: "q1",
        optionsCaption: "Empty",
        choices: ["item2", "item3"],
      },
    ],
  };
  var survey = new SurveyModel(json);
  var q1 = <QuestionDropdownModel>survey.getQuestionByName("q1");
  q1.displayValueCallback = (val: string): string => {
    if (q1.isEmpty()) return q1.optionsCaption;
    return val;
  };
  assert.equal(q1.displayValue, "Empty", "We get display Value on callback");
});
QUnit.test("QuestionExpression expression validator", function(assert) {
  var survey = new SurveyModel({
    elements: [
      { type: "text", name: "q1" },
      { type: "text", name: "q2" },
      {
        type: "expression",
        name: "q3",
        expression: "{q1} + {q2}",
        validators: [{ type: "expression", expression: "{q3} = 10" }],
      },
    ],
  });
  survey.setValue("q1", 5);
  survey.setValue("q2", 4);
  var question = <QuestionTextModel>survey.getQuestionByName("q3");
  assert.ok(question.hasErrors(), "There is an error");
  survey.setValue("q2", 5);
  assert.equal(question.value, 10);
  assert.notOk(question.hasErrors(), "There is no errors");
});
QUnit.test("Check isAnswered property", function(assert) {
  const survey = new SurveyModel({
    elements: [
      { type: "text", name: "q1" },
      { type: "radiogroup", name: "q2", choices: [1, 2, 3] },
      { type: "radiogroup", name: "q3", choices: [1, 2, 3], defaultValue: 2 },
      { type: "checkbox", name: "q4", choices: [1, 2, 3] },
      { type: "checkbox", name: "q5", choices: [1, 2, 3], defaultValue: [2] }
    ],
  });
  const prevStyle = survey.css.question.titleOnAnswer;
  survey.css.question.titleOnAnswer = "answer";
  survey.currentPage.updateElementCss();
  const q1 = survey.getQuestionByName("q1");
  const q2 = survey.getQuestionByName("q2");
  const q3 = survey.getQuestionByName("q3");
  const q4 = survey.getQuestionByName("q4");
  const q5 = survey.getQuestionByName("q5");
  assert.notOk(q1.isAnswered);
  assert.notOk(q2.isAnswered);
  assert.ok(q3.isAnswered);
  assert.notOk(q4.isAnswered);
  assert.ok(q5.isAnswered);

  assert.notOk(q1.cssTitle.indexOf("answer") > 0);
  assert.notOk(q2.cssTitle.indexOf("answer") > 0);
  assert.ok(q3.cssTitle.indexOf("answer") > 0);
  assert.notOk(q4.cssTitle.indexOf("answer") > 0);
  assert.ok(q5.cssTitle.indexOf("answer") > 0);

  q1.value = "abc";
  assert.ok(q1.cssTitle.indexOf("answer") > 0);
  q1.value = "";
  assert.notOk(q1.cssTitle.indexOf("answer") > 0);

  q2.value = 2;
  assert.ok(q2.cssTitle.indexOf("answer") > 0);
  q2.value = undefined;
  assert.notOk(q2.cssTitle.indexOf("answer") > 0);

  q3.clearValue();
  assert.notOk(q3.cssTitle.indexOf("answer") > 0);

  q4.value = [1];
  assert.ok(q4.cssTitle.indexOf("answer") > 0);
  q4.value = [];
  assert.notOk(q4.cssTitle.indexOf("answer") > 0);

  assert.notOk(q4.isAnswered, "q4 is not answered");
  survey.setValue("q4", [1]);
  assert.ok(q4.isAnswered, "q4 is answered");
  assert.ok(q4.cssTitle.indexOf("answer") > 0);

  survey.css.question.titleOnAnswer = prevStyle;
});
QUnit.test("question.startWithNewLine", function(assert) {
  const survey = new SurveyModel({
    elements: [
      { type: "text", name: "q1" },
      { type: "panel", name: "p1", elements: [{ type: "text", name: "q2" }] },
    ],
  });
  assert.equal(survey.getQuestionByName("q1").startWithNewLine, true);
  assert.equal(survey.getQuestionByName("q2").startWithNewLine, true);
  survey.pages[0].addNewQuestion("text", "q3");
  assert.equal(survey.getQuestionByName("q3").startWithNewLine, true);
  const q4 = new QuestionTextModel("q4");
  assert.equal(q4.startWithNewLine, true);
  survey.pages[0].addQuestion(q4);
  assert.equal(q4.startWithNewLine, true);
});
QUnit.test("checkbox question item methods", function (assert) {
  var json = {
    elements: [
      {
        type: "checkbox",
        name: "q1",
        choices: ["item1", "item2", "other"],
        hasOther: true,
      },
    ],
  };
  var survey = new SurveyModel(json);
  var question = <QuestionCheckboxModel>survey.getAllQuestions()[0];
  assert.equal(question.checkBoxSvgPath[0], "M", "Obtain checkbox SVG path");
  assert.equal(question.isOtherItem(question.choices[0]), false, "First item is not other");
  assert.equal(question.isOtherItem(question.choices[2]), true, "Last item is other");

  question.choices[1].setIsEnabled(false);
  assert.equal(question.getItemEnabled(question.choices[0]), true, "First item is enabled");
  assert.equal(question.getItemEnabled(question.choices[1]), false, "Second item is disabled");

});
QUnit.test("Check that we do not set valueChangedCallback internally", function(assert) {
  const questionClasses = Serializer.getChildrenClasses("question", true);
  for(let i = 0; i < questionClasses.length; i ++) {
    const className = questionClasses[i].name;
    const question = Serializer.createClass(className);
    assert.notOk(question.valueChangedCallback, "We should no set valueChangedCallback, class: " + className);
  }
});
QUnit.test("Multiple Text Question: editor.renderedPlaceHolder is undefined, Bug#3374", function(assert) {
  const survey = new SurveyModel({
    elements: [
      {
        type: "multipletext", name: "q1",
        items: [
          { name: "item1", placeHolder: "place holder" }
        ]
      }
    ]
  });
  const question = <QuestionMultipleTextModel>survey.getQuestionByName("q1");
  assert.equal(question.items[0].placeHolder, "place holder", "item place holder");
  assert.equal(question.items[0].editor.placeHolder, "place holder", "editor place holder");
  assert.equal(question.items[0].editor.renderedPlaceHolder, "place holder", "editor rendered place holder");
});
QUnit.test("setting visibleChoices do not fired onArrayChanged ", function (assert) {
  const question = new QuestionDropdownModel("q1");
  let counter = 0;
  (<any>question.visibleChoices).testId = 1;
  (<any>question.visibleChoices).onArrayChanged = () => {
    counter ++;
  };
  let hasVisibleChoicesInHash = false;
  question.iteratePropertiesHash((hash, key) => {
    if(key === "visibleChoices") {
      hasVisibleChoicesInHash = true;
    }
  });
  assert.equal(hasVisibleChoicesInHash, true, "visibleChoices array in hash");
  question.choices = [1, 2, 3];
  assert.equal(question.visibleChoices.length, 3, "visibleChoices is set");
  assert.equal((<any>question.visibleChoices).testId, 1, "visibleChoices array is the same");
  assert.equal(counter, 1, "We fired onArrayChanged for visibleChoices");
});
QUnit.test("Question title equals to name", (assert) => {
  const question = new QuestionTextModel("q1");
  assert.notOk(question.locTitle.getLocaleText(""), "Question title is empty # 1");
  assert.equal(question.locTitle.renderedHtml, "q1");
  question.locTitle.setLocaleText("", "q1");
  assert.notOk(question.locTitle.getLocaleText(""), "Question title is empty # 2");
  assert.equal(question.locTitle.renderedHtml, "q1");
});
QUnit.test("Checkox item, defaultValue and visibleIf bug, #3634", (assert) => {
  const survey = new SurveyModel({
    elements: [
      {
        "type": "radiogroup",
        "name": "question2",
        "choices": ["item1", "item2"]
      },
      {
        "type": "checkbox",
        "name": "question1",
        "defaultValue": ["item2"],
        "choices": [
          "item1",
          {
            "value": "item2",
            "visibleIf": "{question2} = 'item1'"
          },
          "item3"
        ]
      }
    ]
  });
  const question = <QuestionCheckboxModel>survey.getQuestionByName("question1");
  assert.deepEqual(question.value, [], "default value is not set, because item is invisible");
  survey.data = { question2: "item1", question1: ["item3"] };
  assert.deepEqual(question.value, ["item3"], "value from data is set");
});
QUnit.test("Checkox item, others  and visibleIf bug, #3694", (assert) => {
  const survey = new SurveyModel({
    elements: [
      {
        "type": "radiogroup",
        "name": "question2",
        "choices": ["item1", "item2"]
      },
      {
        "type": "checkbox",
        "name": "question1",
        "hasOther": true,
        "choices": [
          "item1",
          {
            "value": "item2",
            "visibleIf": "{question2} = 'item1'"
          },
          "item3"
        ]
      }
    ]
  });
  const question = <QuestionCheckboxModel>survey.getQuestionByName("question1");
  survey.data = { question2: "item1", question1: ["item1", "item2"] };
  assert.deepEqual(question.value, ["item1", "item2"], "value is set correctly");
  assert.equal(question.isOtherSelected, false, "Other is not selected");
  assert.equal(question.isItemSelected(question.choices[1]), true, "second item is selected");
});
QUnit.test("SelectBase otherPlaceHolder localized", function(assert) {
  var survey = new SurveyModel({
    questions: [
      {
        type: "radiogroup",
        name: "car",
        hasOther: true,
        otherPlaceHolder: {
          "da": "Skriv din begrundelse her...",
          "default": "Write your reason here..."
        },
        choices: ["Ford", "Toyota", "Citroen"]
      }
    ]
  });
  var question = <QuestionRadiogroupModel>survey.getAllQuestions()[0];
  assert.equal(survey.locale, "", "default locale");
  assert.equal(question.getLocale(), "", "default locale");
  assert.equal(question.otherPlaceHolder, "Write your reason here...", "default placeholder");
  survey.locale = "da";
  assert.equal(survey.locale, "da", "da locale");
  assert.equal(question.getLocale(), "da", "da locale");
  assert.equal(question.otherPlaceHolder, "Skriv din begrundelse her...", "da placeholder");
  survey.locale = "";
});
QUnit.test("Ranking commentPlaceHolder localized", function(assert) {
  var survey = new SurveyModel({
    questions: [
      {
        type: "rating",
        name: "satisfaction",
        "hasComment": true,
        "commentPlaceHolder": {
          "da": "Skriv din begrundelse her...",
          "default": "Write your reason here..."
        },
      }
    ]
  });
  var question = <QuestionRadiogroupModel>survey.getAllQuestions()[0];
  assert.equal(survey.locale, "", "default locale");
  assert.equal(question.getLocale(), "", "default locale");
  assert.equal(question.commentPlaceHolder, "Write your reason here...", "default placeholder");
  survey.locale = "da";
  assert.equal(survey.locale, "da", "da locale");
  assert.equal(question.getLocale(), "da", "da locale");
  assert.equal(question.commentPlaceHolder, "Skriv din begrundelse her...", "da placeholder");
  survey.locale = "";
});
QUnit.test("Dropdown optionsCaption localization", function(assert) {
  var survey = new SurveyModel({
    questions: [
      {
        type: "dropdown",
        name: "q1"
      }
    ]
  });
  survey.locale = "";
  var question = <QuestionDropdownModel>survey.getAllQuestions()[0];
  assert.equal(question.optionsCaption, "Choose...", "default locale");
  survey.locale = "de";
  assert.equal(question.optionsCaption, "Bitte auswählen...", "locale = de");
  survey.locale = "";
  assert.equal(question.optionsCaption, "Choose...", "default locale, #2");
});
QUnit.test("Test question.clearIfInvisible for survey.clearInvisibleValue='onComplete' (default)", function(assert) {
  var survey = new SurveyModel({
    questions: [
      { type: "text", name: "q1" },
      { type: "text", name: "q2", clearIfInvisible: "none" },
      { type: "text", name: "q3", clearIfInvisible: "onHidden" },
      { type: "text", name: "q4", clearIfInvisible: "onHidden", defaultValue: "default4" },
      { type: "text", name: "q5", clearIfInvisible: "onComplete" }
    ]
  });
  const q = { q1: null, q2: null, q3: null, q4: null, q5: null };
  for(var key in q) {
    q[key] = survey.getQuestionByName(key);
    q[key].value = key;
    q[key].visible = false;
  }
  assert.equal(q.q1.value, "q1", "q1: default/invisible");
  assert.equal(q.q2.value, "q2", "q2: none/invisible");
  assert.equal(q.q3.value, undefined, "q3: onHidden/invisible");
  assert.equal(q.q4.value, undefined, "q4: onHidden/defaultValue/invisible");
  assert.equal(q.q5.value, "q5", "q3: onComplete/invisible");
  q.q4.visible = true;
  assert.equal(q.q4.value, "default4", "q4: onHidden/defaultValue/visible");
  q.q4.visible = false;
  survey.doComplete();
  assert.deepEqual(survey.data, { q2: "q2" }, "q2 is none");
});
QUnit.test("Test question.clearIfInvisible for survey.clearInvisibleValue='none'", function(assert) {
  var survey = new SurveyModel({
    clearInvisibleValues: "none",
    questions: [
      { type: "text", name: "q1" },
      { type: "text", name: "q2", clearIfInvisible: "none" },
      { type: "text", name: "q3", clearIfInvisible: "onHidden" },
      { type: "text", name: "q4", clearIfInvisible: "onHidden", defaultValue: "default4" },
      { type: "text", name: "q5", clearIfInvisible: "onComplete" }
    ]
  });
  const q = { q1: null, q2: null, q3: null, q4: null, q5: null };
  for(var key in q) {
    q[key] = survey.getQuestionByName(key);
    q[key].value = key;
    q[key].visible = false;
  }
  assert.equal(q.q1.value, "q1", "q1: default/invisible");
  assert.equal(q.q2.value, "q2", "q2: none/invisible");
  assert.equal(q.q3.value, undefined, "q3: onHidden/invisible");
  assert.equal(q.q4.value, undefined, "q4: onHidden/defaultValue/invisible");
  assert.equal(q.q5.value, "q5", "q3: onComplete/invisible");
  q.q4.visible = true;
  assert.equal(q.q4.value, "default4", "q4: onHidden/defaultValue/visible");
  q.q4.visible = false;
  survey.doComplete();
  assert.deepEqual(survey.data, { q1: "q1", q2: "q2" }, "q1 is default, q2 is none");
});
QUnit.test("Test question.clearIfInvisible for survey.clearInvisibleValue='onHidden'", function(assert) {
  var survey = new SurveyModel({
    clearInvisibleValues: "onHidden",
    questions: [
      { type: "text", name: "q1" },
      { type: "text", name: "q2", clearIfInvisible: "none" },
      { type: "text", name: "q3", clearIfInvisible: "onHidden" },
      { type: "text", name: "q4", clearIfInvisible: "onHidden", defaultValue: "default4" },
      { type: "text", name: "q5", clearIfInvisible: "onComplete" }
    ]
  });
  const q = { q1: null, q2: null, q3: null, q4: null, q5: null };
  for(var key in q) {
    q[key] = survey.getQuestionByName(key);
    q[key].value = key;
    q[key].visible = false;
  }
  assert.equal(q.q1.value, undefined, "q1: default/invisible");
  assert.equal(q.q2.value, "q2", "q2: none/invisible");
  assert.equal(q.q3.value, undefined, "q3: onHidden/invisible");
  assert.equal(q.q4.value, undefined, "q4: onHidden/defaultValue/invisible");
  assert.equal(q.q5.value, "q5", "q3: onComplete/invisible");
  q.q4.visible = true;
  assert.equal(q.q4.value, "default4", "q4: onHidden/defaultValue/visible");
  q.q4.visible = false;
  survey.doComplete();
  assert.deepEqual(survey.data, { q2: "q2" }, "q2 is none");
});
QUnit.test("Test question.clearIfInvisible for survey.clearInvisibleValue='onHiddenContainer'", function(assert) {
  var survey = new SurveyModel({
    clearInvisibleValues: "onHiddenContainer",
    questions: [
      { type: "panel", name: "panel",
        elements: [
          { type: "text", name: "q1" },
          { type: "text", name: "q2", clearIfInvisible: "none" },
          { type: "text", name: "q3", clearIfInvisible: "onHidden" },
          { type: "text", name: "q4", clearIfInvisible: "onHidden", defaultValue: "default4" },
          { type: "text", name: "q5", clearIfInvisible: "onComplete" }
        ] }
    ]
  });
  const q = { q1: null, q2: null, q3: null, q4: null, q5: null };
  for(var key in q) {
    q[key] = survey.getQuestionByName(key);
    q[key].value = key;
  }
  (<PanelModel>survey.getPanelByName("panel")).visible = false;
  assert.equal(q.q1.value, undefined, "q1: default/invisible");
  assert.equal(q.q2.value, "q2", "q2: none/invisible");
  assert.equal(q.q3.value, undefined, "q3: onHidden/invisible");
  assert.equal(q.q4.value, undefined, "q4: onHidden/defaultValue/invisible");
  assert.equal(q.q5.value, "q5", "q3: onComplete/invisible");
  survey.doComplete();
  assert.deepEqual(survey.data, { q2: "q2" }, "q2 is none");
});
QUnit.test("QuestionTextModel isMinMaxType", function(assert) {
  const q1 = new QuestionTextModel("q1");
  assert.equal(q1.inputType, "text");
  assert.equal(q1.isMinMaxType, false);
  q1.inputType = "range";
  assert.equal(q1.isMinMaxType, false);
  q1.inputType = "datetime";
  assert.equal(q1.isMinMaxType, true);
});
