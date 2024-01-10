/* jshint browser: true, jquery: true */
/* globals $, mw, OO */

// ==UserScript==
// @name         Wikipedia ChatGPT section summaries
// @namespace    http://tampermonkey.net/
// @version      0.1
// @description  Experiment to use ChatGPT to summarize page sections.
// @author       Aleksei
// @author       tonythomas01
// @author       Tgr
// @license      GPL-3.0-or-later
// @match        https://*.wikipedia.org/*
// @icon         https://doc.wikimedia.org/oojs-ui/master/demos/dist/themes/wikimediaui/images/icons/robot.svg
// @grant        none
// ==/UserScript==

function initializeSectionSummarizer() {
  const summarizerSections = getSections();
  window.summarizerSections = summarizerSections;
  if (summarizerSections.length === 0) {
    console.error("Section Summarizer could not find suitable sections");
  } else {
    injectSummaryWidgets(summarizerSections, 300);
  }
}

function injectSummaryWidgets(sections, minChars = 0) {
  sections.forEach(function (section) {
    if (section.contentPlainLength > minChars) {
      const widget = document.createElement("div");
      widget.className = "section-summary-widget";

      widget.innerHTML = [
        '<div class="section-summary-widget__collapsed"></div>',
        '<div class="section-summary-widget__loading">',
        "    <div>Summarizing the section...</div>",
        "</div>",
        '<div class="section-summary-widget__completed">',
        '    <div class="section-summary-widget__summary"></div>',
        '    <div class="section-summary-widget__disclaimer">',
        "        This summary was generated by AI and can contain errors.",
        "    </div>",
        "</div>",
        '<div class="section-summary-widget__error"></div>',
      ].join("");

      section.firstContentElement.parentNode.insertBefore(
        widget,
        section.firstContentElement
      );
      const collapsedSection = widget.querySelector(
        ".section-summary-widget__collapsed"
      );

      const summarizeButton = new OO.ui.ButtonWidget({
        label: "Summarize",
        title: "Click to summarize the section",
        icon: "robot",
        framed: false,
      });
      summarizeButton.on("click", function (event) {
        const sectionHeadingFromDOM = summarizeButton.$element
          .parent()
          .parent()
          .prev(".mw-heading");
        widget.classList.remove("collapsed");
        widget.classList.add("loading");

        const summaryDiv = widget.querySelector(
          ".section-summary-widget__summary"
        );

        const updateSummary = (newSummary) => {
          summaryDiv.textContent = newSummary;
          widget.classList.remove("loading");
          widget.classList.add("completed");
        };

        summarizeSection(section, updateSummary, sectionHeadingFromDOM)
          .then(function (summary) {
            // This part is not needed anymore since we update the summary in the updateSummary function
          })
          .catch(function (error) {
            const errorDiv = widget.querySelector(
              ".section-summary-widget__error"
            );
            errorDiv.textContent = "Error: " + error;
            widget.classList.remove("loading");
            widget.classList.add("error");
          });
      });

      // Append button to collapsedSection
      $(collapsedSection).append(summarizeButton.$element);
      widget.classList.add("collapsed");
    }
  });
}

var discussionToolsInfo;

function getSectionData($heading) {
  var dataPromise;
  if (discussionToolsInfo) {
    dataPromise = $.Deferred().resolve(discussionToolsInfo);
  } else {
    dataPromise = mw.loader
      .using(["mediawiki.api"])
      .then(function () {
        return new mw.Api().get({
          action: "discussiontoolspageinfo",
          page: mw.config.get("wgPageName"),
          prop: "threaditemshtml",
          format: "json",
          formatversion: 2,
        });
      })
      .then(function (data) {
        discussionToolsInfo = data;
        return data;
      });
  }

  var sectionId = $heading.find(".mw-headline").data("mw-thread-id");
  var sectionContent = [];
  var processReplies = function (reply) {
    if (reply.type === "comment") {
      sectionContent.push({
        type: "comment",
        level: reply.level,
        author: reply.author,
        text: getCommentTextFromHtml(reply.html),
      });
      for (var i = 0; i < reply.replies.length; i++) {
        processReplies(reply.replies[i]);
      }
    } else if (reply.type === "heading") {
      sectionContent.push({
        type: "heading",
        level: reply.level,
        headingLevel: reply.headingLevel,
        text: getCommentTextFromHtml(reply.html),
      });
      for (var i = 0; i < reply.replies.length; i++) {
        processReplies(reply.replies[i]);
      }
    } else {
      console.log("Unexpected type: " + reply.type, reply);
    }
  };

  return dataPromise.then(function (data) {
    for (
      var i = 0;
      i < data.discussiontoolspageinfo.threaditemshtml.length;
      i++
    ) {
      var section = data.discussiontoolspageinfo.threaditemshtml[i];
      if (section.id === sectionId) {
        sectionContent.push({
          type: "heading",
          level: 0,
          headingLevel: section.level,
          text: getCommentTextFromHtml(section.html),
        });
        for (var j = 0; j < section.replies.length; j++) {
          processReplies(section.replies[j]);
        }
      }
    }
    return sectionContent;
  });
}

/**
 * @param {string} html
 * @return {string}
 */
function getCommentTextFromHtml(html) {
  return $.parseHTML("<div>" + html + "</div>")
    .map((el) => el.innerText || "")
    .join("");
}

/**
 * @param {jQuery} $heading
 * @return {jQuery.Promise<string>}
 */
function getSectionText($heading) {
  return getSectionData($heading).then(function (data) {
    var sectionText = "";
    for (var i = 0; i < data.length; i++) {
      var item = data[i];
      if (item.type === "heading") {
        sectionText +=
          "\t".repeat(item.level) +
          "=".repeat(item.headingLevel) +
          item.text +
          "=".repeat(item.headingLevel) +
          "\n\n";
      } else if (item.type === "comment") {
        sectionText += (item.author + ": " + item.text).replace(
          /^|\n/g,
          "$&" + "\t".repeat(item.level)
        );
      }
      sectionText += "\n\n";
    }
    return sectionText;
  });
}

const prompts = {
  en: "Summarize the following section in less than 50 words, using English:  \n",
  cn: "用50个字以内的话总结以下内容，使用中文回复我。: \n",
};
const lang = navigator.language ?? navigator.userLanguage;
let p = prompts.en;

if (lang.startsWith("zh")) {
  p = prompts.cn;
}

function summarizeSection(section, updateSummary, sectionHeadingFromDOM) {
  return new Promise(function (resolve, reject) {
    const openAiKey = getOpenAiKey();
    if (!openAiKey) {
      reject("OpenAI API key not found or invalid");
      return;
    }
    const namespace = mw.config.get("wgCanonicalNamespace");
    if (namespace === "Talk") {
      // Use @Tgrs solution to parse things from the API instead.
      getSectionText(sectionHeadingFromDOM).then(function (sectionText) {
        const fixedPromptForChatGPT =
          "Summarize the following discussion section in less than 100 words. Username is followed by what they" +
          "wrote. Indentation is used to denote threaded replies. Use the usernames in the summary as well. \n";
        fetchSummaryUsingOpenAi(
          fixedPromptForChatGPT,
          openAiKey,
          sectionText,
          updateSummary,
          function (error, summary) {
            if (error) {
              reject(error);
            } else {
              resolve(summary);
            }
          }
        );
      });
    } else {
      const sectionContent =
        "## " + section.title + "\n\n" + section.contentPlain;
      const fixedPromptForChatGPT = p;
      fetchSummaryUsingOpenAi(
        fixedPromptForChatGPT,
        openAiKey,
        sectionContent,
        updateSummary,
        function (error, summary) {
          if (error) {
            reject(error);
          } else {
            resolve(summary);
          }
        }
      );
    }
  });
}

async function fetchSummaryUsingOpenAi(
  fixedPromptForChatGPT,
  openAiKey,
  sectionText,
  updateSummary,
  callback
) {
  const prompt = fixedPromptForChatGPT + sectionText;

  console.log("prompt", prompt);
  try {
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${openAiKey}`,
      },
      body: JSON.stringify({
        model: "gpt-3.5-turbo",
        messages: [
          {
            role: "user",
            content: prompt,
          },
        ],
        stream: true,
        temperature: 0,
      }),
    });
    if (response.status !== 200) {
      const errorText = await response.text();
      console.error("Error:", errorText);
      callback(
        new Error(`API responded with status ${response.status}: ${errorText}`)
      );
      return;
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder("utf-8");
    let summary = "";

    let buffer = "";
    while (true) {
      const { done, value } = await reader.read();
      if (done) {
        break;
      }

      buffer += decoder.decode(value, { stream: true });
      let start = 0;
      let end = buffer.indexOf("\n");

      while (end !== -1) {
        const line = buffer
          .slice(start, end)
          .replace(/^data: /, "")
          .trim();
        if (line !== "" && line !== "[DONE]") {
          const parsedLine = JSON.parse(line);
          const { choices } = parsedLine;
          const { delta } = choices[0];
          const { content } = delta;
          if (content) {
            summary += content;
            updateSummary(summary); // Update the summary content in the widget
          }
        }

        start = end + 1;
        end = buffer.indexOf("\n", start);
      }

      buffer = buffer.slice(start);
    }

    callback(null, summary);
  } catch (error) {
    console.error("Error:", error);
    callback(error);
  }
}

function getOpenAiKey() {
  let openAiKey = localStorage.getItem("openAiKey");

  if (!openAiKey) {
    const userInput = prompt(
      'Please enter your OpenAI API key (it should start with "sk-"):'
    );

    if (userInput && userInput.startsWith("sk-")) {
      openAiKey = userInput;
      localStorage.setItem("openAiKey", openAiKey);
    } else {
      console.error("Invalid OpenAI API key provided.");
      return null;
    }
  }

  return openAiKey;
}

function openSettings() {}
