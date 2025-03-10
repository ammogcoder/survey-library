import { SurveyModel } from "../src/survey";
import { QuestionFileModel } from "../src/question_file";
import { QuestionPanelDynamicModel } from "../src/question_paneldynamic";
import { surveyLocalization } from "../src/surveyStrings";
import { settings } from "../src/settings";

export default QUnit.module("Survey_QuestionFile");

QUnit.test("QuestionFile value initialization strings", function(assert) {
  var json = {
    questions: [
      {
        type: "file",
        allowMultiple: true,
        title: "Please upload your photo 1",
        name: "image1",
        storeDataAsText: false,
        showPreview: true,
        imageWidth: 150,
        maxSize: 102400,
      },
      {
        type: "file",
        allowMultiple: true,
        title: "Please upload your photo 2",
        name: "image2",
        storeDataAsText: true,
        showPreview: true,
        imageWidth: 150,
        maxSize: 102400,
      },
    ],
  };

  var survey = new SurveyModel(json);
  var q1: QuestionFileModel = <any>survey.getQuestionByName("image1");
  var q2: QuestionFileModel = <any>survey.getQuestionByName("image2");
  survey.onDownloadFile.add((survey, options) => {
    options.callback("success", "data:image/jpeg;base64,FILECONTENT1");
  });

  survey.data = {
    image1: "someId",
    image2: "data:image/jpeg;base64,FILECONTENT",
  };
  assert.deepEqual(q1.value, survey.data.image1);
  assert.deepEqual(q2.value, survey.data.image2);
  assert.equal(q1.previewValue.length, 1, "remote stored file");
  assert.equal(q2.previewValue.length, 1, "file stored as text");
  assert.equal(
    q1.previewValue[0].content,
    "data:image/jpeg;base64,FILECONTENT1",
    "remote stored file content"
  );
  assert.equal(
    q2.previewValue[0].content,
    survey.data.image2,
    "locally stored file content"
  );
});

QUnit.test("QuestionFile value initialization array", function(assert) {
  var json = {
    questions: [
      {
        type: "file",
        allowMultiple: true,
        title: "Please upload your photo 1",
        name: "image1",
        storeDataAsText: false,
        showPreview: true,
        imageWidth: 150,
        maxSize: 102400,
      },
      {
        type: "file",
        allowMultiple: true,
        title: "Please upload your photo 2",
        name: "image2",
        storeDataAsText: true,
        showPreview: true,
        imageWidth: 150,
        maxSize: 102400,
      },
    ],
  };

  var survey = new SurveyModel(json);
  var q1: QuestionFileModel = <any>survey.getQuestionByName("image1");
  var q2: QuestionFileModel = <any>survey.getQuestionByName("image2");
  survey.onDownloadFile.add((survey, options) => {
    options.callback("success", "data:image/jpeg;base64,FILECONTENT1");
  });

  survey.data = {
    image1: ["someId"],
    image2: ["data:image/jpeg;base64,FILECONTENT"],
  };
  assert.deepEqual(q1.value, survey.data.image1);
  assert.deepEqual(q2.value, survey.data.image2);
  assert.equal(q1.previewValue.length, 1, "remote stored file");
  assert.equal(q2.previewValue.length, 1, "file stored as text");
  assert.equal(
    q1.previewValue[0].content,
    "data:image/jpeg;base64,FILECONTENT1",
    "remote stored file content"
  );
  assert.equal(
    q2.previewValue[0].content,
    survey.data.image2,
    "locally stored file content"
  );
});
QUnit.test("QuestionFile serialization", function(assert) {
  const fileQuestion = new QuestionFileModel("q1");
  assert.deepEqual(fileQuestion.toJSON(), { name: "q1" }, "We have only name in serialziation by default");
});
QUnit.test("QuestionFile value initialization array of objects", function(
  assert
) {
  var json = {
    questions: [
      {
        type: "file",
        allowMultiple: true,
        title: "Please upload your photo 1",
        name: "image1",
        storeDataAsText: false,
        showPreview: true,
        imageWidth: 150,
        maxSize: 102400,
      },
      {
        type: "file",
        allowMultiple: true,
        title: "Please upload your photo 2",
        name: "image2",
        storeDataAsText: true,
        showPreview: true,
        imageWidth: 150,
        maxSize: 102400,
      },
    ],
  };

  var survey = new SurveyModel(json);
  var q1: QuestionFileModel = <any>survey.getQuestionByName("image1");
  var q2: QuestionFileModel = <any>survey.getQuestionByName("image2");
  survey.onDownloadFile.add((survey, options) => {
    if (options.name == "image1") {
      assert.equal(q1.inputTitle, "Loading...");
    }
    if (options.name == "image2") {
      assert.equal(q2.inputTitle, " ");
    }
    options.callback("success", "data:image/jpeg;base64,FILECONTENT1");
  });

  assert.equal(q1.inputTitle, "Choose file(s)...");
  assert.equal(q2.inputTitle, "Choose file(s)...");
  survey.data = {
    image1: [{ content: "someId" }],
    image2: [{ content: "data:image/jpeg;base64,FILECONTENT" }],
  };
  assert.equal(q1.inputTitle, " ");
  assert.equal(q2.inputTitle, " ");
  assert.deepEqual(q1.value, survey.data.image1);
  assert.deepEqual(q2.value, survey.data.image2);
  assert.equal(q1.previewValue.length, 1, "remote stored file");
  assert.equal(q2.previewValue.length, 1, "file stored as text");
  assert.equal(
    q1.previewValue[0].content,
    "data:image/jpeg;base64,FILECONTENT1",
    "remote stored file content"
  );
  assert.equal(
    q2.previewValue[0].content,
    survey.data.image2[0].content,
    "locally stored file content"
  );
});

QUnit.test(
  "QuestionFile value initialization array of objects without onDownloadFile handler",
  function(assert) {
    var json = {
      questions: [
        {
          type: "file",
          allowMultiple: true,
          title: "Please upload your photo 1",
          name: "image1",
          storeDataAsText: false,
          showPreview: true,
          imageWidth: 150,
          maxSize: 102400,
        },
        {
          type: "file",
          allowMultiple: true,
          title: "Please upload your photo 2",
          name: "image2",
          storeDataAsText: true,
          showPreview: true,
          imageWidth: 150,
          maxSize: 102400,
        },
      ],
    };

    var survey = new SurveyModel(json);
    var q1: QuestionFileModel = <any>survey.getQuestionByName("image1");
    var q2: QuestionFileModel = <any>survey.getQuestionByName("image2");

    survey.data = {
      image1: [{ content: "someId" }],
      image2: [{ content: "data:image/jpeg;base64,FILECONTENT" }],
    };
    assert.deepEqual(q1.value, survey.data.image1);
    assert.deepEqual(q2.value, survey.data.image2);
    assert.equal(q1.previewValue.length, 1, "remote stored file");
    assert.equal(q2.previewValue.length, 1, "file stored as text");
    assert.equal(
      q1.previewValue[0].content,
      survey.data.image1[0].content,
      "remote stored file content"
    );
    assert.equal(
      q2.previewValue[0].content,
      survey.data.image2[0].content,
      "locally stored file content"
    );
  }
);

QUnit.test("QuestionFile upload files", function(assert) {
  var json = {
    questions: [
      {
        type: "file",
        allowMultiple: true,
        title: "Please upload your photo 1",
        name: "image1",
        storeDataAsText: false,
        showPreview: true,
        imageWidth: 150,
        maxSize: 102400,
      },
    ],
  };

  var survey = new SurveyModel(json);
  var q1: QuestionFileModel = <any>survey.getQuestionByName("image1");
  var done = assert.async();

  survey.onUploadFiles.add((survey, options) => {
    setTimeout(
      () =>
        options.callback(
          "success",
          options.files.map((file) => {
            return { file: file, content: file.name + "_url" };
          })
        ),
      10
    );
  });

  var files: any = [
    { name: "f1", type: "t1" },
    { name: "f2", type: "t2", size: 100000 },
  ];
  q1.loadFiles(files);

  survey.onValueChanged.add((survey, options) => {
    assert.equal(q1.value.length, 2, "2 files");
    assert.equal(
      q1.value[0].content,
      q1.value[0].name + "_url",
      "first content"
    );
    assert.equal(
      q1.value[1].content,
      q1.value[1].name + "_url",
      "second content"
    );
    assert.equal(
      q1.previewValue[0].content,
      q1.value[0].content,
      "preview content 1"
    );
    assert.equal(
      q1.previewValue[1].content,
      q1.value[1].content,
      "preview content 2"
    );

    assert.equal(q1.previewValue[0].name, q1.value[0].name, "preview name 1");
    assert.equal(q1.previewValue[1].name, q1.value[1].name, "preview name 2");
    done();
  });
});

QUnit.test("QuestionFile remove file", function(assert) {
  var json = {
    questions: [
      {
        type: "file",
        allowMultiple: true,
        name: "image1",
        showPreview: true,
      },
    ],
  };

  var survey = new SurveyModel(json);
  var q1: QuestionFileModel = <any>survey.getQuestionByName("image1");
  survey.data = {
    image1: [
      { name: "f1", content: "data" },
      { name: "f2", content: "data" },
    ],
  };

  q1.removeFile({ name: "f1" });
  assert.deepEqual(survey.data, {
    image1: [{ name: "f2", content: "data" }],
  });

  q1.removeFile({ name: "f2" });
  assert.deepEqual(survey.data, {});
});

QUnit.test(
  "QuestionFile upload files that exceed max size - https://surveyjs.answerdesk.io/ticket/details/T994",
  function(assert) {
    var json = {
      questions: [
        {
          type: "file",
          allowMultiple: true,
          name: "image1",
          storeDataAsText: false,
          maxSize: 10,
        },
      ],
    };

    var survey = new SurveyModel(json);
    var q1: QuestionFileModel = <any>survey.getQuestionByName("image1");

    var loadedFilesCount = 0;
    survey.onUploadFiles.add((survey, options) => {
      options.callback(
        "success",
        options.files.map((file) => {
          return { file: file, content: file.name + "_url" };
        })
      );
      loadedFilesCount++;
    });

    var files: any = [
      { name: "f1", type: "t1", size: 9 },
      { name: "f2", type: "t2", size: 11 },
    ];
    q1.loadFiles(files);
    assert.equal(q1.errors.length, 1, "one error");
    assert.equal(loadedFilesCount, 0, "no files loaded");

    var loadedFilesCount = 0;
    q1.loadFiles([<any>{ name: "f1", type: "t1", size: 9 }]);
    assert.equal(q1.errors.length, 0, "no error");
    assert.equal(loadedFilesCount, 1, "one files loaded");

    var loadedFilesCount = 0;
    q1.loadFiles([<any>{ name: "f1", type: "t1", size: 12 }]);
    assert.equal(q1.errors.length, 1, "one error");
    assert.equal(loadedFilesCount, 0, "no files loaded");

    var loadedFilesCount = 0;
    q1.loadFiles([
      <any>{ name: "f1", type: "t1", size: 1 },
      <any>{ name: "f2", type: "t2", size: 2 },
    ]);
    assert.equal(q1.errors.length, 0, "no error");
    assert.equal(loadedFilesCount, 1, "two files loaded");

    q1.clear();
  }
);

QUnit.test("QuestionFile canPreviewImage", function(assert) {
  var q1: QuestionFileModel = new QuestionFileModel("image1");

  assert.notOk(q1.canPreviewImage(undefined), "no item");
  assert.notOk(q1.canPreviewImage({}), "empty item");
  assert.ok(
    q1.canPreviewImage({ content: "data:image;/someth" }),
    "by content"
  );
  assert.ok(
    q1.canPreviewImage({ content: "someth", type: "image/png" }),
    "by content"
  );
  assert.notOk(
    q1.canPreviewImage({ content: "someth", type: "text/html" }),
    "other type"
  );
});

QUnit.test(
  "QuestionFile process errors during files uploading - https://surveyjs.answerdesk.io/ticket/details/T1075",
  function(assert) {
    var json = {
      questions: [
        {
          type: "file",
          name: "image1",
          storeDataAsText: false,
          showPreview: true,
        },
      ],
    };

    var survey = new SurveyModel(json);
    var q1: QuestionFileModel = <any>survey.getQuestionByName("image1");

    var isSuccess = true;
    survey.onUploadFiles.add((survey, options) => {
      if (isSuccess) {
        options.callback(
          "success",
          options.files.map((file) => {
            return { file: file, content: file.name + "_url" };
          })
        );
      } else {
        options.callback("error");
      }
    });

    var state = "";
    q1.onStateChanged.add((_, options) => {
      state = options.state;
    });

    assert.ok(q1.isEmpty());
    assert.equal(q1.value, undefined);
    assert.equal(state, "");

    isSuccess = false;
    q1.loadFiles([<any>{ name: "f1", type: "t1" }]);

    assert.ok(q1.isEmpty());
    assert.equal(q1.value, undefined);
    assert.equal(state, "error");

    isSuccess = true;
    q1.loadFiles([<any>{ name: "f2", type: "t2" }]);

    assert.notOk(q1.isEmpty());
    assert.equal(q1.value.length, 1);
    assert.equal(q1.value[0].content, "f2_url");
    assert.equal(state, "loaded");
  }
);

QUnit.test("QuestionFile replace file for single file mode", function(assert) {
  var json = {
    questions: [
      {
        type: "file",
        name: "image1",
        storeDataAsText: false,
      },
    ],
  };

  var survey = new SurveyModel(json);
  var q1: QuestionFileModel = <any>survey.getQuestionByName("image1");

  survey.onUploadFiles.add((survey, options) => {
    options.callback(
      "success",
      options.files.map((file) => {
        return { file: file, content: file.name + "_url" };
      })
    );
  });

  var files1: any = [{ name: "f1", type: "t1" }];
  q1.loadFiles(files1);
  assert.equal(q1.value.length, 1, "first file");
  assert.equal(q1.value[0].name, "f1", "first file name");

  var files2: any = [{ name: "f2", type: "t2", size: 100000 }];
  q1.loadFiles(files2);
  assert.equal(q1.value.length, 1, "the only single file");
  assert.equal(q1.value[0].name, "f2", "second file name");
});
QUnit.test("QuestionFile in panel dynamic in preview mode", function(assert) {
  var json = {
    questions: [
      {
        type: "paneldynamic",
        name: "panel",
        templateElements: [
          {
            type: "file",
            name: "files",
            storeDataAsText: false,
            allowMultiple: true,
            maxSize: 102400,
          },
        ],
      },
    ],
  };

  var survey = new SurveyModel(json);
  survey.data = { panel: [{ files: ["someId"] }] };
  survey.showPreview();
  var panel = <QuestionPanelDynamicModel>survey.getQuestionByName("panel");
  var fileQuestion = <QuestionFileModel>panel.panels[0].questions[0];
  assert.equal(panel.panelCount, 1, "One panel");
  var fileQuestion = <QuestionFileModel>panel.panels[0].questions[0];
  assert.equal(fileQuestion.value, "someId", "Question file name");
});
QUnit.test("Writable captions", function(assert) {
  var json = {
    questions: [
      {
        type: "file",
        allowMultiple: true,
        title: "Please upload your file",
        name: "file1",
      }
    ],
  };

  var survey = new SurveyModel(json);
  var q: QuestionFileModel = <any>survey.getQuestionByName("file1");
  /**
   * The remove file confirmation message template.
   */
  assert.equal(q.confirmRemoveMessage, surveyLocalization.getString("confirmRemoveFile"), "The remove file confirmation message template default");
  q.confirmRemoveMessage += "_new";
  assert.equal(q.confirmRemoveMessage, surveyLocalization.getString("confirmRemoveFile")+"_new", "The remove file confirmation message template new");
  /**
    * The remove all files confirmation message.
    */
  assert.equal(q.confirmRemoveAllMessage, surveyLocalization.getString("confirmRemoveAllFiles"), "The remove all files confirmation message default");
  q.confirmRemoveAllMessage += "_new";
  assert.equal(q.confirmRemoveAllMessage, surveyLocalization.getString("confirmRemoveAllFiles")+"_new", "The remove all files confirmation message new");
  /**
    * The no file chosen caption for modern theme.
    */
  assert.equal(q.noFileChosenCaption, surveyLocalization.getString("noFileChosen"), "The no file chosen caption for modern theme default");
  q.noFileChosenCaption += "_new";
  assert.equal(q.noFileChosenCaption, surveyLocalization.getString("noFileChosen")+"_new", "The no file chosen caption for modern theme new");
  /**
    * The choose files button caption for modern theme.
    */
  assert.equal(q.chooseButtonCaption, surveyLocalization.getString("chooseFileCaption"), "The choose files button caption for modern theme default");
  q.chooseButtonCaption += "_new";
  assert.equal(q.chooseButtonCaption, surveyLocalization.getString("chooseFileCaption")+"_new", "The choose files button caption for modern theme new");
  /**
    * The clean files button caption.
    */
  assert.equal(q.cleanButtonCaption, surveyLocalization.getString("cleanCaption"), "The clean files button caption default");
  q.cleanButtonCaption += "_new";
  assert.equal(q.cleanButtonCaption, surveyLocalization.getString("cleanCaption")+"_new", "The clean files button caption new");
  /**
    * The remove file button caption.
    */
  assert.equal(q.removeFileCaption, surveyLocalization.getString("removeFileCaption"), "The remove file button caption default");
  q.removeFileCaption += "_new";
  assert.equal(q.removeFileCaption, surveyLocalization.getString("removeFileCaption")+"_new", "The remove file button caption new");
  /**
    * The loading file input title.
    */
  assert.equal(q.loadingFileTitle, surveyLocalization.getString("loadingFile"), "The loading file input title default");
  q.loadingFileTitle += "_new";
  assert.equal(q.loadingFileTitle, surveyLocalization.getString("loadingFile")+"_new", "The loading file input title new");
  /**
   * The choose file input title.
   */
  assert.equal(q.chooseFileTitle, surveyLocalization.getString("chooseFile"), "The choose file input title default");
  q.chooseFileTitle += "_new";
  assert.equal(q.chooseFileTitle, surveyLocalization.getString("chooseFile")+"_new", "The choose file input title new");

});

QUnit.test("check file d&d", (assert) => {
  var json = {
    questions: [
      {
        type: "file",
        allowMultiple: true,
        title: "Please upload your file",
        name: "file1",
      }
    ],
  };

  var survey = new SurveyModel(json);
  var q: QuestionFileModel = <QuestionFileModel>survey.getQuestionByName("file1");
  let onChangeCalledCount = 0;
  q["onChange"] = () => { onChangeCalledCount++; };
  const event = { preventDefault: () => {}, dataTransfer: { dropEffect: "none", files: [{ type: "ext", name: "test", content: "test_content" }] } };
  q.onDragOver(event);
  assert.equal(event.dataTransfer.dropEffect, "copy");
  assert.equal(q.isDragging, true);

  q.onDragLeave(event);
  assert.equal(q.isDragging, false);

  q.onDragOver(event);
  assert.equal(q.isDragging, true);

  q.onDrop(event);
  assert.equal(q.isDragging, false);
  assert.equal(onChangeCalledCount, 1);
});

QUnit.test("check file d&d readonly", (assert) => {
  var json = {
    questions: [
      {
        type: "file",
        allowMultiple: true,
        title: "Please upload your file",
        name: "file1",
      }
    ],
  };
  var survey = new SurveyModel(json);
  var q: QuestionFileModel = <QuestionFileModel>survey.getQuestionByName("file1");
  let onChangeCalledCount = 0;
  q["onChange"] = () => { onChangeCalledCount++; };
  const event = { preventDefault: () => {}, dataTransfer: { dropEffect: "none", files: [{ type: "ext", name: "test", content: "test_content" }] } };
  const checkDD = () => {
    q.onDragOver(event);
    assert.equal(event.dataTransfer.dropEffect, "none");
    assert.equal(q.isDragging, false);

    q.onDragLeave(event);
    assert.equal(q.isDragging, false);

    q.onDragOver(event);
    assert.equal(q.isDragging, false);

    q.onDrop(event);
    assert.equal(q.isDragging, false);
    assert.equal(onChangeCalledCount, 0);
  };
  q.readOnly = true;
  checkDD();
  settings.supportCreatorV2 = true;
  survey.setDesignMode(true);
  checkDD();
});
QUnit.test("file.cleanButtonCaption localization", (assert) => {
  const survey = new SurveyModel({
    questions: [
      {
        type: "file",
        name: "file1",
      }
    ],
  });
  var q: QuestionFileModel = <QuestionFileModel>survey.getQuestionByName("file1");
  assert.equal(q.cleanButtonCaption, "Clean");
  survey.locale = "fr";
  assert.equal(q.cleanButtonCaption, "Nettoyer");
});

QUnit.test("Question File responsive", (assert) => {
  var json = {
    questions: [
      {
        type: "file",
        name: "image1",
        storeDataAsText: false,
        allowMultiple: true
      },
    ],
  };

  var survey = new SurveyModel(json);
  var q1: QuestionFileModel = <any>survey.getQuestionByName("image1");

  survey.onUploadFiles.add((survey, options) => {
    options.callback(
      "success",
      options.files.map((file) => {
        return { file: file, content: file.name + "_url" };
      })
    );
  });

  q1.cssClasses.mobile = "m";
  assert.equal(q1.fileRootCss, "sv_q_file");
  q1.isMobile = true;
  assert.equal(q1.fileRootCss, "sv_q_file m");
  assert.equal(q1.mobileFileNavigatorVisible, false);

  var files1: any = [{ name: "f1", type: "t1" }];
  q1.loadFiles(files1);

  assert.equal(q1.mobileFileNavigatorVisible, false);

  var files2: any = [{ name: "f2", type: "t2", size: 100000 }];
  q1.loadFiles(files2);

  assert.equal(q1.mobileFileNavigatorVisible, true);

  assert.equal(q1["fileIndexAction"].title, "1 of 2");
  q1["nextFileAction"].action();
  assert.equal(q1["fileIndexAction"].title, "2 of 2");
  q1["nextFileAction"].action();
  assert.equal(q1["fileIndexAction"].title, "1 of 2");
  q1["prevFileAction"].action();
  assert.equal(q1["fileIndexAction"].title, "2 of 2");
  q1["prevFileAction"].action();
  assert.equal(q1["fileIndexAction"].title, "1 of 2");

  assert.equal(q1.isPreviewVisible(0), true);
  assert.equal(q1.isPreviewVisible(1), false);

  q1["nextFileAction"].action();
  assert.equal(q1.isPreviewVisible(0), false);
  assert.equal(q1.isPreviewVisible(1), true);

  q1.isMobile = false;
  assert.equal(q1.isPreviewVisible(0), true);
  assert.equal(q1.isPreviewVisible(1), true);

  q1.isMobile = true;
  assert.equal(q1.mobileFileNavigatorVisible, true);
  q1.clear();
  assert.equal(q1.mobileFileNavigatorVisible, false);
});
