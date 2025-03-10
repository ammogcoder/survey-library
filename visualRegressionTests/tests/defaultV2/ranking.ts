import { Selector, ClientFunction } from "testcafe";
import { url, frameworks, initSurvey, url_test, checkElementScreenshot } from "../../helper";

const title = "Ranking Screenshot";

fixture`${title}`.page`${url}`;

const applyTheme = ClientFunction(theme => {
  (<any>window).Survey.StylesManager.applyTheme(theme);
});

const theme = "defaultV2";

frameworks.forEach(framework => {
  fixture`${framework} ${title} ${theme}`
    .page`${url_test}${theme}/${framework}.html`
    .beforeEach(async t => {
      await applyTheme(theme);
    });

  test("Check rating question", async (t) => {
    await t.resizeWindow(1920, 1080);
    await initSurvey(framework, {
      showQuestionNumbers: "off",
      questions: [
        {
          type: "ranking",
          title: "Tell me about a time you strongly disagreed with your manager. What did you do to convince him or her that you were right? What happened?",
          name: "ranking_question",
          choices: ["item1", "item2", "item3", "item4"]
        }
      ]
    });
    await checkElementScreenshot("question-ranking.png", Selector(".sd-question"), t);

    await t.hover(".sv-ranking-item");
    await checkElementScreenshot("question-ranking-hover-item.png", Selector(".sd-question"), t);
  });
});