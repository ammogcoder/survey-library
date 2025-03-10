import { Selector, ClientFunction } from "testcafe";
import { createScreenshotsComparer } from "devextreme-screenshot-comparer";
import { url, screenshotComparerOptions, frameworks, initSurvey, url_test, checkElementScreenshot } from "../../helper";

const title = "Question Screenshot";

fixture`${title}`.page`${url}`.beforeEach(async (t) => {

});

const applyTheme = ClientFunction(theme => {
  (<any>window).Survey.StylesManager.applyTheme(theme);
});

const theme = "defaultV2";

frameworks.forEach(framework => {
  fixture`${framework} ${title} ${theme}`
    .page`${url_test}${theme}/${framework}.html`.beforeEach(async t => {
    await applyTheme(theme);
  });
  test("Check question num", async (t) => {
    await t.resizeWindow(1920, 1080);
    await initSurvey(framework, {
      questions: [
        {
          type: "text",
          name: "question_with_num",
          width: "708px",
          title: "What can we improve or add to our Xamarin.Forms UI product line to better address your business needs in the future (control features, learning materials, etc.)?"
        },
      ]
    });
    const { takeScreenshot, compareResults } = createScreenshotsComparer(t);
    const questionRoot = Selector(".sd-question");
    await takeScreenshot("question-with-num.png", questionRoot, screenshotComparerOptions);
    await t
      .expect(compareResults.isValid())
      .ok(compareResults.errorMessages());
  });
  test("Check question num + expand/collapse", async (t) => {
    await t.resizeWindow(1920, 1080);
    await initSurvey(framework, {
      questions: [
        {
          type: "text",
          name: "question_with_num",
          width: "708px",
          state: "collapsed",
          title: "What can we improve or add to our Xamarin.Forms UI product line to better address your business needs in the future (control features, learning materials, etc.)?"
        },
      ]
    });
    const { takeScreenshot, compareResults } = createScreenshotsComparer(t);
    const questionRoot = Selector(".sd-question");
    await takeScreenshot("question-collapse.png", questionRoot, screenshotComparerOptions);
    await t
      .expect(compareResults.isValid())
      .ok(compareResults.errorMessages());
    await t.click(questionRoot);
    await takeScreenshot("question-expand.png", questionRoot, screenshotComparerOptions);
    await t
      .expect(compareResults.isValid())
      .ok(compareResults.errorMessages());
  });
  test("Check invisible question when showInvisibleElements: true", async (t) => {
    await t.resizeWindow(1920, 1080);
    await initSurvey(framework, {
      questions: [
        {
          type: "text",
          name: "q1",
          title: "Rate the importance of this scenario for your enterprise (assuming you've encountered it in the past).",
          width: "708px",
          choices: ["High", "Medium", "Low"],
          visible: false,
        },
      ]
    });
    const { takeScreenshot, compareResults } = createScreenshotsComparer(t);
    const questionRoot = Selector(".sd-question");
    await ClientFunction(()=>{ (<any>window).survey.showInvisibleElements = true; })();
    await ClientFunction(()=>{ document.body.focus(); })();
    await takeScreenshot("question-invisible.png", questionRoot, screenshotComparerOptions);
  });
  test("Check question title actions", async (t) => {
    await t.resizeWindow(1920, 1080);
    await initSurvey(framework, {
      showQuestionNumbers: "off",
      questions: [
        {
          type: "text",
          name: "question_with_num",
          width: "708px",
          state: "collapsed",
          title: "Personal information"
        },
      ]
    }, { onGetQuestionTitleActions: (_, opt) => {
      opt.titleActions.push(
        {
          title: "Reset to Default",
          action: () => {}
        }
      );
    } });
    const { takeScreenshot, compareResults } = createScreenshotsComparer(t);
    const questionRoot = Selector(".sd-question");
    await takeScreenshot("question-title-actions.png", questionRoot, screenshotComparerOptions);
    await t
      .expect(compareResults.isValid())
      .ok(compareResults.errorMessages());
  });
  test("Check required question with multiline title", async (t) => {
    await t.resizeWindow(1920, 1080);
    await initSurvey(framework, {
      showQuestionNumbers: "off",
      questions: [
        {
          type: "text",
          name: "required_question",
          isRequired: true,
          width: "708px",
          title: "What can we improve or add to our Xamarin.Forms UI product line to better address your business needs in the future (control features, learning materials, etc.)?"
        },
      ]
    });
    const { takeScreenshot, compareResults } = createScreenshotsComparer(t);
    const questionRoot = Selector(".sd-question");
    await ClientFunction(()=>{ document.body.focus(); })();
    await takeScreenshot("question-required.png", questionRoot, screenshotComparerOptions);
    await t
      .expect(compareResults.isValid())
      .ok(compareResults.errorMessages());

  });
  test("Check questions in one row", async (t) => {
    await t.resizeWindow(1920, 1080);
    await initSurvey(framework, {
      questions: [
        {
          type: "text",
          name: "question_with_num",
          title: "Personal information"
        },
        {
          type: "text",
          name: "question_with_num",
          startWithNewLine: false,
          title: "Contact information"
        },
      ]
    },);
    const { takeScreenshot, compareResults } = createScreenshotsComparer(t);
    const rowSelector = Selector(".sd-row");
    await ClientFunction(()=>{ document.body.focus(); })();
    await takeScreenshot("multiple-row.png", rowSelector, screenshotComparerOptions);
    await t
      .expect(compareResults.isValid())
      .ok(compareResults.errorMessages());
  });
  test("Check question error", async(t)=> {
    await t.resizeWindow(1920, 1080);
    await initSurvey(framework, {
      questions: [
        {
          type: "text",
          name: "q_error",
          title: "What is your name?",
          isRequired: true,
          colCount: 1,
        }
      ]
    },);
    const qRoot = Selector(".sd-question");
    await t.click(".sd-navigation__complete-btn");
    await ClientFunction(()=>{ document.body.focus(); })();
    await checkElementScreenshot("question-with-error.png", qRoot, t);
    await t.resizeWindow(600, 1080);
    await checkElementScreenshot("responsiveness-question-with-error.png", qRoot, t);
  });
  test("Check title location Left", async(t)=> {
    await t.resizeWindow(1920, 1080);
    await initSurvey(framework, {
      questions: [
        {
          type: "text",
          name: "q1",
          title: "What is your name?",
          titleLocation: "left"
        }
      ]
    },);
    const qRoot = Selector(".sd-question");
    await checkElementScreenshot("question-title-location-left.png", qRoot, t);
  });
});
